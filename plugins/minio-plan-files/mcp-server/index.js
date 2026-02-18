#!/usr/bin/env node
/**
 * minio-plan-files MCP Server
 *
 * MinIO (S3互換) + ElasticMQ (SQS互換) を使ったAIエージェント向け
 * プラン共有ワークフローを MCP Tools として提供する。
 *
 * Tools:
 *   plan_status  - 各プレフィックスの件数とキュー状態を確認
 *   plan_submit  - planをMinIOにアップロードしてSQSキューに投入
 *   plan_fetch   - SQSから1件取得してpending/→processing/に移動
 *   plan_done    - 処理完了 (processing/→done/) + SQS削除
 *   plan_fail    - 処理失敗 (processing/→failed/) + SQS削除
 *   plan_retry   - failed/のplanをpending/に再投入
 *
 * 環境変数:
 *   MINIO_SHARED_PLAN_FILES_HOST  MinIO/ElasticMQ のホスト (default: localhost)
 *   MINIO_SHARED_PLAN_FILES_PROJECT  プロジェクト名 (default: git origin / dir名)
 *   PLAN_S3_ENDPOINT     MinIO エンドポイント
 *   PLAN_SQS_ENDPOINT    ElasticMQ エンドポイント
 *   PLAN_QUEUE_URL       SQS キューURL
 *   PLAN_BUCKET          S3 バケット名 (default: shared)
 *   PLAN_AWS_ACCESS_KEY_ID      (default: fileshare)
 *   PLAN_AWS_SECRET_ACCESS_KEY  (default: fileshare123)
 *   PLAN_AWS_REGION      (default: us-east-1)
 *   PLAN_WORK_DIR        ステートファイル保存先 (default: .)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// ========== 設定 ==========
const HOST = process.env.MINIO_SHARED_PLAN_FILES_HOST ?? "localhost";
const S3_ENDPOINT = process.env.PLAN_S3_ENDPOINT ?? `http://${HOST}:9000`;
const SQS_ENDPOINT = process.env.PLAN_SQS_ENDPOINT ?? `http://${HOST}:9324`;
const QUEUE_URL = process.env.PLAN_QUEUE_URL ?? `${SQS_ENDPOINT}/000000000000/plans`;
const BUCKET = process.env.PLAN_BUCKET ?? "shared";
const REGION = process.env.PLAN_AWS_REGION ?? "us-east-1";
const ACCESS_KEY = process.env.PLAN_AWS_ACCESS_KEY_ID ?? "fileshare";
const SECRET_KEY = process.env.PLAN_AWS_SECRET_ACCESS_KEY ?? "fileshare123";
const WORK_DIR = process.env.PLAN_WORK_DIR ?? ".";
const STATE_FILE = path.join(WORK_DIR, ".current-plan");

// ========== クライアント ==========
const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true,
});

const sqs = new SQSClient({
  endpoint: SQS_ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

// ========== ステート管理 ==========
let currentPlan = null; // { s3Key, receiptHandle, startedAt, filename, project }

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return;
  try {
    const state = {};
    for (const line of fs.readFileSync(STATE_FILE, "utf-8").split("\n")) {
      const m = line.match(/^(\w+)="(.*)"\s*$/);
      if (m) state[m[1]] = m[2];
    }
    if (state.PLAN_S3_KEY) {
      currentPlan = {
        s3Key: state.PLAN_S3_KEY,
        receiptHandle: state.PLAN_RECEIPT_HANDLE,
        startedAt: state.PLAN_STARTED_AT,
        filename: path.basename(state.PLAN_S3_KEY),
        project: state.PLAN_S3_KEY.split("/")[0],
      };
    }
  } catch (e) {
    console.error("loadState: ステートファイルの読み込みに失敗:", e.message);
    currentPlan = null;
  }
}

function saveState(s3Key, receiptHandle, startedAt) {
  const localPath = path.join(WORK_DIR, path.basename(s3Key));
  fs.writeFileSync(
    STATE_FILE,
    `PLAN_S3_KEY="${s3Key}"\nPLAN_RECEIPT_HANDLE="${receiptHandle}"\nPLAN_STARTED_AT="${startedAt}"\nPLAN_LOCAL_PATH="${localPath}"\n`
  );
}

function clearState() {
  currentPlan = null;
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}

// ========== ヘルパー ==========
function getDefaultProject() {
  if (process.env.MINIO_SHARED_PLAN_FILES_PROJECT) {
    return process.env.MINIO_SHARED_PLAN_FILES_PROJECT;
  }
  try {
    const origin = execSync("git remote get-url origin 2>/dev/null", {
      encoding: "utf-8",
      cwd: WORK_DIR,
    }).trim();
    return origin
      .replace(/.*github\.com[:/]/, "")
      .replace(/\.git$/, "")
      .replace("/", "-");
  } catch {
    return path.basename(process.cwd());
  }
}

async function s3Move(srcKey, dstKey) {
  await s3.send(
    new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${srcKey}`,
      Key: dstKey,
    })
  );
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: srcKey }));
}

function errResult(text) {
  return { content: [{ type: "text", text }], isError: true };
}

/** パストラバーサル対策: 英数字・ハイフン・ドット・アンダースコア・@・/ のみ許可 */
function validateName(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    return `Error: ${label} が空です。`;
  }
  if (!/^[a-zA-Z0-9\-._@/]+$/.test(value)) {
    return `Error: ${label} に使用できない文字が含まれています (許可: 英数字, -, ., _, @, /)。`;
  }
  if (value.includes("..")) {
    return `Error: ${label} に '..' は使用できません。`;
  }
  return null;
}

/** ListObjectsV2 のページネーション対応 (1000件超対応) */
async function listAllObjects(prefix) {
  const all = [];
  let continuationToken;
  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ...(continuationToken && { ContinuationToken: continuationToken }),
      })
    );
    if (resp.Contents) all.push(...resp.Contents);
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  return all;
}

// 起動時にステートファイルを読み込む
loadState();

// ========== MCP サーバー ==========
const server = new McpServer({
  name: "minio-plan-files",
  version: "1.2.0",
});

// ---------- plan_status ----------
server.tool(
  "plan_status",
  "各S3プレフィックス (pending/processing/done/failed) の件数とSQSキュー状態を確認する",
  {
    project: z
      .string()
      .optional()
      .describe("プロジェクト名 (省略時: 環境変数/git/ディレクトリ名から自動取得)"),
  },
  async ({ project }) => {
    const proj = project ?? getDefaultProject();
    const nameErr = validateName(proj, "project");
    if (nameErr) return errResult(nameErr);

    const counts = {};
    for (const dir of ["pending", "processing", "done", "failed"]) {
      try {
        const objects = await listAllObjects(`${proj}/${dir}/`);
        counts[dir] = objects.length;
      } catch {
        counts[dir] = "?";
      }
    }

    const queueAttrs = await sqs
      .send(
        new GetQueueAttributesCommand({
          QueueUrl: QUEUE_URL,
          AttributeNames: [
            "ApproximateNumberOfMessages",
            "ApproximateNumberOfMessagesNotVisible",
          ],
        })
      )
      .catch(() => null);

    const visible =
      queueAttrs?.Attributes?.ApproximateNumberOfMessages ?? "?";
    const invisible =
      queueAttrs?.Attributes?.ApproximateNumberOfMessagesNotVisible ?? "?";

    const lines = [
      `=== Plan Status: ${proj} ===`,
      `  pending/     ${counts.pending} 件`,
      `  processing/  ${counts.processing} 件`,
      `  done/        ${counts.done} 件`,
      `  failed/      ${counts.failed} 件`,
      ``,
      `=== Queue ===`,
      `  待機中 (visible):   ${visible} 件`,
      `  処理中 (invisible): ${invisible} 件`,
    ];

    if (currentPlan) {
      lines.push(
        ``,
        `=== Current Plan (このセッションが処理中) ===`,
        `  S3 Key:  ${currentPlan.s3Key}`,
        `  Started: ${currentPlan.startedAt}`
      );
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ---------- plan_submit ----------
server.tool(
  "plan_submit",
  "planのJSONコンテンツをMinIOのpending/にアップロードし、SQSキューにメッセージを送信する (Dispatcher側)",
  {
    content: z.string().describe("planのJSONコンテンツ (文字列)"),
    filename: z
      .string()
      .optional()
      .describe("ファイル名 (省略時: plan-<timestamp>.json)"),
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
  },
  async ({ content, filename, project }) => {
    const proj = project ?? getDefaultProject();
    const fname = filename ?? `plan-${Date.now()}.json`;

    const projErr = validateName(proj, "project");
    if (projErr) return errResult(projErr);
    const fnameErr = validateName(fname, "filename");
    if (fnameErr) return errResult(fnameErr);

    const s3Key = `${proj}/pending/${fname}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: content,
        ContentType: "application/json",
      })
    );

    const msgResp = await sqs.send(
      new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({
          s3_key: s3Key,
          project: proj,
          filename: fname,
          dispatched_at: new Date().toISOString(),
        }),
      })
    );

    return {
      content: [
        {
          type: "text",
          text: [
            `Submitted: s3://${BUCKET}/${s3Key}`,
            `Message ID: ${msgResp.MessageId}`,
          ].join("\n"),
        },
      ],
    };
  }
);

// ---------- plan_fetch ----------
server.tool(
  "plan_fetch",
  "SQSキューから1件のplanを取得し、S3上でpending/→processing/に移動してコンテンツを返す (Agent側・第1ステップ)",
  {
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
    wait_seconds: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .describe("メッセージ待機秒数 (0-20, default: 20, SQS仕様上限: 20)"),
  },
  async ({ project, wait_seconds = 20 }) => {
    loadState();
    if (currentPlan) {
      return errResult(
        `Error: すでに処理中のplanがあります: ${currentPlan.s3Key}\nplan_done または plan_fail を先に実行してください。`
      );
    }

    const msgResp = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: wait_seconds,
      })
    );

    if (!msgResp.Messages?.length) {
      return { content: [{ type: "text", text: "キューにplanがありません。" }] };
    }

    const msg = msgResp.Messages[0];
    const receiptHandle = msg.ReceiptHandle;

    let body;
    try {
      body = JSON.parse(msg.Body);
    } catch (e) {
      // 不正JSONメッセージをキューから削除して安全に処理
      console.error("plan_fetch: SQSメッセージのJSONパースに失敗:", e.message);
      await sqs
        .send(new DeleteMessageCommand({ QueueUrl: QUEUE_URL, ReceiptHandle: receiptHandle }))
        .catch((delErr) => console.error("plan_fetch: 不正メッセージの削除にも失敗:", delErr.message));
      return errResult(`Error: SQSメッセージのJSONパースに失敗しました: ${e.message}\n不正メッセージはキューから削除しました。`);
    }

    if (!body.s3_key) {
      await sqs
        .send(new DeleteMessageCommand({ QueueUrl: QUEUE_URL, ReceiptHandle: receiptHandle }))
        .catch((delErr) => console.error("plan_fetch: 不正メッセージの削除にも失敗:", delErr.message));
      return errResult("Error: SQSメッセージに s3_key フィールドがありません。\n不正メッセージはキューから削除しました。");
    }

    const s3Key = body.s3_key;

    const msgProject = body.project ?? s3Key.split("/")[0];
    const filename = path.basename(s3Key);
    const processingKey = `${msgProject}/processing/${filename}`;

    // pending/ → processing/
    await s3Move(s3Key, processingKey);

    // コンテンツ取得
    const getResp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: processingKey })
    );
    const planContent = await getResp.Body.transformToString();

    const startedAt = new Date().toISOString();
    currentPlan = {
      s3Key: processingKey,
      receiptHandle,
      startedAt,
      filename,
      project: msgProject,
    };
    saveState(processingKey, receiptHandle, startedAt);

    return {
      content: [
        {
          type: "text",
          text: [
            `Fetched: ${filename}`,
            `S3 Key:  ${processingKey}`,
            `Started: ${startedAt}`,
            ``,
            `--- Plan Content ---`,
            planContent,
          ].join("\n"),
        },
      ],
    };
  }
);

// ---------- plan_done ----------
server.tool(
  "plan_done",
  "現在処理中のplanを完了にする: S3でprocessing/→done/に移動し、SQSメッセージを削除する (Agent側・完了ステップ)",
  {
    result: z
      .string()
      .optional()
      .describe("結果JSONコンテンツ (省略可)。指定するとdone/に <name>-result.json としてアップロードされる"),
  },
  async ({ result }) => {
    loadState();
    if (!currentPlan) {
      return errResult("Error: 処理中のplanがありません。plan_fetch を先に実行してください。");
    }

    const { s3Key, receiptHandle, filename, project } = currentPlan;
    const doneKey = `${project}/done/${filename}`;

    if (result) {
      const resultKey = `${project}/done/${filename.replace(/\.json$/, "")}-result.json`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: resultKey,
          Body: result,
          ContentType: "application/json",
        })
      );
    }

    await s3Move(s3Key, doneKey);

    await sqs
      .send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: receiptHandle,
        })
      )
      .catch((e) => console.error("plan_done: SQSメッセージ削除に失敗:", e.message));

    clearState();

    return {
      content: [
        {
          type: "text",
          text: `Done: ${filename} → s3://${BUCKET}/${doneKey}`,
        },
      ],
    };
  }
);

// ---------- plan_fail ----------
server.tool(
  "plan_fail",
  "現在処理中のplanを失敗にする: S3でprocessing/→failed/に移動し、SQSメッセージを削除する (Agent側・失敗ステップ)",
  {
    reason: z
      .string()
      .optional()
      .describe("失敗理由 (default: 'unknown')"),
  },
  async ({ reason = "unknown" }) => {
    loadState();
    if (!currentPlan) {
      return errResult("Error: 処理中のplanがありません。plan_fetch を先に実行してください。");
    }

    const { s3Key, receiptHandle, filename, project } = currentPlan;
    const failedKey = `${project}/failed/${filename}`;

    await s3Move(s3Key, failedKey);

    await sqs
      .send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: receiptHandle,
        })
      )
      .catch((e) => console.error("plan_fail: SQSメッセージ削除に失敗:", e.message));

    clearState();

    return {
      content: [
        {
          type: "text",
          text: [
            `Failed: ${filename} (reason: ${reason})`,
            `Moved to: s3://${BUCKET}/${failedKey}`,
            `再投入するには: plan_retry を使用`,
          ].join("\n"),
        },
      ],
    };
  }
);

// ---------- plan_retry ----------
server.tool(
  "plan_retry",
  "failed/のplanをすべてpending/に戻し、SQSキューに再投入する",
  {
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
  },
  async ({ project }) => {
    const proj = project ?? getDefaultProject();
    const nameErr = validateName(proj, "project");
    if (nameErr) return errResult(nameErr);

    const files = await listAllObjects(`${proj}/failed/`).catch(() => []);
    if (!files.length) {
      return { content: [{ type: "text", text: "failed/に再投入対象のplanはありません。" }] };
    }

    let succeeded = 0;
    let failed = 0;
    const errors = [];
    for (const obj of files) {
      const filename = path.basename(obj.Key);
      const pendingKey = `${proj}/pending/${filename}`;

      try {
        await s3Move(obj.Key, pendingKey);

        await sqs.send(
          new SendMessageCommand({
            QueueUrl: QUEUE_URL,
            MessageBody: JSON.stringify({
              s3_key: pendingKey,
              project: proj,
              filename,
              dispatched_at: new Date().toISOString(),
              retried: true,
            }),
          })
        );

        succeeded++;
      } catch (e) {
        failed++;
        errors.push(`${filename}: ${e.message}`);
        console.error(`plan_retry: ${filename} の再投入に失敗:`, e.message);
      }
    }

    const lines = [`再投入完了: ${succeeded} 件成功`];
    if (failed > 0) {
      lines.push(`${failed} 件失敗:`);
      lines.push(...errors.map((e) => `  - ${e}`));
    }
    return {
      content: [{ type: "text", text: lines.join("\n") }],
      ...(failed > 0 && { isError: true }),
    };
  }
);

// ---------- health_check ----------
server.tool(
  "health_check",
  "S3/SQSへの接続を検証し、設定情報を表示する (セットアップ時のデバッグ用)",
  {},
  async () => {
    const checks = [];

    // S3 接続チェック
    try {
      await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1 }));
      checks.push(`S3:  OK (endpoint: ${S3_ENDPOINT}, bucket: ${BUCKET})`);
    } catch (e) {
      checks.push(`S3:  NG - ${e.message}`);
    }

    // SQS 接続チェック
    try {
      const attrs = await sqs.send(
        new GetQueueAttributesCommand({
          QueueUrl: QUEUE_URL,
          AttributeNames: ["ApproximateNumberOfMessages"],
        })
      );
      const msgCount = attrs.Attributes?.ApproximateNumberOfMessages ?? "?";
      checks.push(`SQS: OK (queue: ${QUEUE_URL}, messages: ${msgCount})`);
    } catch (e) {
      checks.push(`SQS: NG - ${e.message}`);
    }

    // 設定情報
    const proj = getDefaultProject();
    checks.push(
      ``,
      `=== Configuration ===`,
      `  Project:      ${proj}`,
      `  S3 Endpoint:  ${S3_ENDPOINT}`,
      `  SQS Endpoint: ${SQS_ENDPOINT}`,
      `  Bucket:       ${BUCKET}`,
      `  Queue URL:    ${QUEUE_URL}`,
      `  Region:       ${REGION}`,
      `  Work Dir:     ${WORK_DIR}`,
    );

    const allOk = checks[0].includes("OK") && checks[1].includes("OK");
    return {
      content: [{ type: "text", text: checks.join("\n") }],
      ...(!allOk && { isError: true }),
    };
  }
);

// ========== 起動 ==========
const transport = new StdioServerTransport();
await server.connect(transport);

// ========== グレースフルシャットダウン ==========
async function shutdown() {
  console.error("minio-plan-files: シャットダウン中...");
  try {
    await server.close();
  } catch (e) {
    console.error("minio-plan-files: server.close() に失敗:", e.message);
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
