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
 *   plan_fetch   - SQSから1件取得してダウンロード + pending/→processing/ + delete-message
 *   plan_done    - 処理完了 (processing/→done/) + 通知送信
 *   plan_fail    - 処理失敗 (processing/→failed/) + 通知送信
 *   plan_retry   - failed/のplanをpending/に再投入
 *   plan_wait    - 指定planの完了/失敗を通知キューで待機
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
import path from "path";
import { execSync } from "child_process";

// ========== 設定 ==========
const HOST = process.env.MINIO_SHARED_PLAN_FILES_HOST ?? "localhost";
const S3_ENDPOINT = process.env.PLAN_S3_ENDPOINT ?? `http://${HOST}:9000`;
const SQS_ENDPOINT = process.env.PLAN_SQS_ENDPOINT ?? `http://${HOST}:9324`;
const QUEUE_URL = process.env.PLAN_QUEUE_URL ?? `${SQS_ENDPOINT}/000000000000/plans`;
const NOTIFICATION_QUEUE_URL =
  process.env.PLAN_NOTIFICATION_QUEUE_URL ??
  `${SQS_ENDPOINT}/000000000000/plan-notifications`;
const BUCKET = process.env.PLAN_BUCKET ?? "shared";
const REGION = process.env.PLAN_AWS_REGION ?? "us-east-1";
const ACCESS_KEY = process.env.PLAN_AWS_ACCESS_KEY_ID ?? "fileshare";
const SECRET_KEY = process.env.PLAN_AWS_SECRET_ACCESS_KEY ?? "fileshare123";

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

// ========== ヘルパー ==========
function getDefaultProject() {
  if (process.env.MINIO_SHARED_PLAN_FILES_PROJECT) {
    return process.env.MINIO_SHARED_PLAN_FILES_PROJECT;
  }
  try {
    const origin = execSync("git remote get-url origin 2>/dev/null", {
      encoding: "utf-8",
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

async function findSingleProcessingFile(project) {
  const resp = await s3
    .send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: `${project}/processing/`,
      })
    )
    .catch(() => ({ Contents: [] }));

  const files = (resp.Contents ?? []).filter(
    (obj) => !obj.Key.endsWith("/")
  );

  if (files.length === 0) {
    return { error: "processing/ にファイルがありません" };
  }
  if (files.length > 1) {
    const names = files.map((f) => path.basename(f.Key)).join(", ");
    return {
      error: `processing/ に複数のファイルがあります。filename を指定してください: ${names}`,
    };
  }
  return { filename: path.basename(files[0].Key) };
}

function errResult(text) {
  return { content: [{ type: "text", text }], isError: true };
}

async function sendNotification({ filename, project, status, reason, s3_key }) {
  try {
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: NOTIFICATION_QUEUE_URL,
        MessageBody: JSON.stringify({
          filename,
          project,
          status,
          reason: reason ?? null,
          s3_key,
          timestamp: new Date().toISOString(),
        }),
      })
    );
  } catch {
    // 通知送信失敗はワーニングのみ (S3移動は既に完了しているため)
  }
}

// ========== MCP サーバー ==========
const server = new McpServer({
  name: "minio-plan-files",
  version: "1.0.0",
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

    const counts = {};
    for (const dir of ["pending", "processing", "done", "failed"]) {
      const resp = await s3
        .send(
          new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${proj}/${dir}/` })
        )
        .catch(() => ({ Contents: [] }));
      counts[dir] = (resp.Contents ?? []).filter(
        (obj) => !obj.Key.endsWith("/")
      ).length;
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
        MessageBody: JSON.stringify({ s3_key: s3Key, project: proj }),
      })
    );

    return {
      content: [
        {
          type: "text",
          text: [
            `Submitted: s3://${BUCKET}/${s3Key}`,
            `Filename: ${fname}`,
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
  "SQSキューから1件のplanを取得し、ダウンロード + pending/→processing/移動 + SQSメッセージ削除を行う (Agent側)",
  {
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
    wait_seconds: z
      .number()
      .optional()
      .describe("メッセージ待機秒数 (default: 20)"),
  },
  async ({ project, wait_seconds = 20 }) => {
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
    const body = JSON.parse(msg.Body);
    const s3Key = body.s3_key;
    const receiptHandle = msg.ReceiptHandle;

    const msgProject = body.project ?? s3Key.split("/")[0];
    const filename = path.basename(s3Key);
    const processingKey = `${msgProject}/processing/${filename}`;

    // 1. コンテンツ取得 (先にダウンロードしてファイルロストを防ぐ)
    const getResp = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
    );
    const planContent = await getResp.Body.transformToString();

    // 2. pending/ → processing/ に移動
    await s3Move(s3Key, processingKey);

    // 3. SQS メッセージを削除
    try {
      await sqs.send(
        new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: receiptHandle,
        })
      );
    } catch {
      // delete-message の失敗は警告のみ (VisibilityTimeout後に自動的に戻るが、ファイルは既にprocessing/に移動済み)
    }

    return {
      content: [
        {
          type: "text",
          text: [
            `Fetched: ${filename}`,
            `Project: ${msgProject}`,
            `S3 Key:  ${processingKey}`,
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
  "processing/のplanをdone/にS3移動し、plan-notificationsキューに完了通知を送信する",
  {
    filename: z
      .string()
      .optional()
      .describe(
        "対象ファイル名 (省略時: processing/ 内のファイルが1件なら自動検出)"
      ),
    result: z
      .string()
      .optional()
      .describe(
        "結果JSONコンテンツ (省略可)。指定するとdone/に <name>-result.json としてアップロードされる"
      ),
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
  },
  async ({ filename, result, project }) => {
    const proj = project ?? getDefaultProject();

    // ファイル名の特定
    let fname = filename;
    if (!fname) {
      const detected = await findSingleProcessingFile(proj);
      if (detected.error) return errResult(detected.error);
      fname = detected.filename;
    }

    const processingKey = `${proj}/processing/${fname}`;
    const doneKey = `${proj}/done/${fname}`;

    // 結果ファイルのアップロード
    if (result) {
      const resultKey = `${proj}/done/${fname.replace(/\.json$/, "")}-result.json`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: resultKey,
          Body: result,
          ContentType: "application/json",
        })
      );
    }

    // processing/ → done/
    await s3Move(processingKey, doneKey);

    // 完了通知を送信
    await sendNotification({
      filename: fname,
      project: proj,
      status: "done",
      reason: null,
      s3_key: doneKey,
    });

    return {
      content: [
        {
          type: "text",
          text: `Done: ${fname} → s3://${BUCKET}/${doneKey}`,
        },
      ],
    };
  }
);

// ---------- plan_fail ----------
server.tool(
  "plan_fail",
  "processing/のplanをfailed/にS3移動し、plan-notificationsキューに失敗通知を送信する",
  {
    filename: z
      .string()
      .optional()
      .describe(
        "対象ファイル名 (省略時: processing/ 内のファイルが1件なら自動検出)"
      ),
    reason: z
      .string()
      .optional()
      .describe("失敗理由 (default: 'unknown')"),
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
  },
  async ({ filename, reason = "unknown", project }) => {
    const proj = project ?? getDefaultProject();

    // ファイル名の特定
    let fname = filename;
    if (!fname) {
      const detected = await findSingleProcessingFile(proj);
      if (detected.error) return errResult(detected.error);
      fname = detected.filename;
    }

    const processingKey = `${proj}/processing/${fname}`;
    const failedKey = `${proj}/failed/${fname}`;

    // processing/ → failed/
    await s3Move(processingKey, failedKey);

    // 失敗通知を送信
    await sendNotification({
      filename: fname,
      project: proj,
      status: "failed",
      reason,
      s3_key: failedKey,
    });

    return {
      content: [
        {
          type: "text",
          text: [
            `Failed: ${fname} (reason: ${reason})`,
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

    const listResp = await s3
      .send(
        new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${proj}/failed/` })
      )
      .catch(() => ({ Contents: [] }));

    const files = (listResp.Contents ?? []).filter(
      (obj) => !obj.Key.endsWith("/")
    );
    if (!files.length) {
      return { content: [{ type: "text", text: "failed/に再投入対象のplanはありません。" }] };
    }

    let count = 0;
    for (const obj of files) {
      const fname = path.basename(obj.Key);
      const pendingKey = `${proj}/pending/${fname}`;

      await s3Move(obj.Key, pendingKey);

      await sqs.send(
        new SendMessageCommand({
          QueueUrl: QUEUE_URL,
          MessageBody: JSON.stringify({
            s3_key: pendingKey,
            project: proj,
            retried: true,
          }),
        })
      );

      count++;
    }

    return {
      content: [{ type: "text", text: `再投入完了: ${count} 件` }],
    };
  }
);

// ---------- plan_wait ----------
server.tool(
  "plan_wait",
  "指定したplanの完了/失敗を待機する。通知キューをlong-pollし、対象filenameの通知が届くまで待つ (Dispatcher側)",
  {
    filenames: z
      .array(z.string())
      .describe("待機対象のファイル名リスト"),
    project: z.string().optional().describe("プロジェクト名 (省略時: 自動取得)"),
    timeout_seconds: z
      .number()
      .optional()
      .describe("最大待機秒数 (default: 300, max: 600)"),
  },
  async ({ filenames, project, timeout_seconds = 300 }) => {
    const proj = project ?? getDefaultProject();
    const timeout = Math.min(timeout_seconds, 600);
    const deadline = Date.now() + timeout * 1000;

    // 結果を追跡
    const results = new Map();
    for (const f of filenames) {
      results.set(f, { status: "pending" });
    }

    const remaining = () =>
      [...results.values()].filter((r) => r.status === "pending").length;

    while (remaining() > 0 && Date.now() < deadline) {
      const waitTime = Math.min(20, Math.ceil((deadline - Date.now()) / 1000));
      if (waitTime <= 0) break;

      const msgResp = await sqs
        .send(
          new ReceiveMessageCommand({
            QueueUrl: NOTIFICATION_QUEUE_URL,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: waitTime,
          })
        )
        .catch(() => ({ Messages: [] }));

      if (!msgResp.Messages?.length) continue;

      for (const msg of msgResp.Messages) {
        try {
          const body = JSON.parse(msg.Body);
          const fname = body.filename;

          if (results.has(fname) && results.get(fname).status === "pending") {
            results.set(fname, {
              status: body.status,
              reason: body.reason,
              s3_key: body.s3_key,
            });
            // 対象の通知なので削除
            await sqs
              .send(
                new DeleteMessageCommand({
                  QueueUrl: NOTIFICATION_QUEUE_URL,
                  ReceiptHandle: msg.ReceiptHandle,
                })
              )
              .catch(() => {});
          }
          // 対象外の通知は削除しない (VisibilityTimeout後にキューに戻る)
        } catch {
          // パース失敗は無視
        }
      }
    }

    // 結果フォーマット
    const lines = [`=== Plan Wait Result (${proj}) ===`];
    let doneCount = 0;
    let failedCount = 0;
    let pendingCount = 0;

    for (const [fname, result] of results) {
      if (result.status === "done") {
        lines.push(`  ${fname}: done (s3://${BUCKET}/${result.s3_key})`);
        doneCount++;
      } else if (result.status === "failed") {
        lines.push(
          `  ${fname}: failed (reason: ${result.reason ?? "unknown"}) (s3://${BUCKET}/${result.s3_key})`
        );
        failedCount++;
      } else {
        lines.push(`  ${fname}: pending (timeout - まだ完了していません)`);
        pendingCount++;
      }
    }

    const total = filenames.length;
    lines.push("");
    lines.push(
      `完了: ${doneCount}/${total}, 失敗: ${failedCount}/${total}, 未完了: ${pendingCount}/${total}`
    );

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ========== 起動 ==========
const transport = new StdioServerTransport();
await server.connect(transport);
