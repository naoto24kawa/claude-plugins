---
name: standards-audit
description: Use when the user wants to check project compliance against elchika-inc/standards. Triggers include "standards チェック", "standards に準拠しているか", "kickoff チェック", "プロジェクト開始のチェック", "progress チェック", "完了前の最終確認", "done チェック", "standards-audit", "project health", "セットアップ確認", "standards と比較して".
allowed-tools: [Read, Bash, Glob, Grep]
---

# Standards Health Check

プロジェクトの現在状態を standards と比較し、ギャップを報告する。**修正はしない — 比較と結果出力のみ。**

**検査項目の正本は standards `AUDIT.md`。この skill はチェックリストの実体を持たない。** この skill が担うのは「フェーズに応じた絞り込み」「N/A の判定」「レポート形式」の 3 つだけ。検査の中身を複製すると standards の更新ごとに追随が必要になり、rev ごとに陳腐化する（実際 rev.38 で `.docs/` 層構成が変わり rev.39 で `plans/` の命名規約が加わった際、複製していたチェックリストがそれらを検査しない状態になった）。

Standards 正本: ローカル checkout（例: `~/projects/elchika-inc/standards/`）。存在しなければ `gh repo clone elchika-inc/standards <一時ディレクトリ>` で取得したコピーを使う。

---

## ステップ 1: フェーズを確定する

引数またはコンテキストから以下のいずれかを判定する。不明な場合のみユーザーに確認する。非対話実行（CI / hook）の場合は `progress` をデフォルトとする。

| フェーズ | 使うタイミング |
|---------|--------------|
| `kickoff` | 新規プロジェクト開始直後（テンプレートコピー後） |
| `progress` | 開発途中の準拠確認 |
| `done` | リリース前・完了宣言前の最終確認 |

---

## ステップ 2: 正本とプロジェクト状態を読む

**正本を先に読む**（これを省くと検査項目が古いまま実行される）:

```
<standards>/AUDIT.md          # 検査項目の正本。「実行方法」節を必ず読む
<standards>/CHANGELOG.md      # 最新 rev の確認（先頭エントリ）
```

続いてプロジェクト側を読む（存在しないファイルは「未作成」として記録する）:

```
README.md
AGENTS.md（または CLAUDE.md）
biome.json
.gitignore
pnpm-workspace.yaml  または  package.json
.github/workflows/ci.yml
.github/workflows/deploy.yml
.github/PULL_REQUEST_TEMPLATE.md
.docs/                       # 層構成の検査対象（DOCS_OPS §3）
design-tokens.css のコピー先（`find . -name "index.css" -path "*/apps/*/src/*"` で探す）
apps/docs/src/content/docs/legal/  または  src/content/docs/legal/  （legal ディレクトリ）
```

---

## ステップ 3: AUDIT.md の該当セクションを実行する

`AUDIT.md` の「チェック項目」から、フェーズに応じたセクションを実行する。

| フェーズ | 実行する `AUDIT.md` のセクション |
|---------|--------------------------------|
| `kickoff` | 構成・ツーリング（PROJECT_RULES）／ドキュメント（DOCS_OPS / AI_FIRST）／UI・デザイン（DESIGN — UI を持つ場合）／公開プロダクト追加分（PRODUCT_PLAYBOOK — 公開予定の場合） |
| `progress` | kickoff の全セクション ＋ アーキテクチャ（ARCHITECTURE） |
| `done` | progress の全セクション ＋ セキュリティ・コンプライアンス機能一覧（アプリ層／GDPR／開示・インシデント対応）＋ 公開プロダクト追加分の全項目 |

### 実行時の規律（`AUDIT.md`「実行方法」節が正本 — MUST）

- **パスの読み替え**: `<SRC>` は `apps/*/src packages/*/src`、`<I18N_DIR>` は `apps/web/src/i18n/locales`。i18n なしのプロジェクトは i18n チェックを N/A とする。
- **空走ガード（全検出系コマンド対象）**: 検査対象が 1 ファイル以上存在することを `ls` 等で先に確認する。空ディレクトリ・glob 不一致への検査成功はサイレント故障。
- **self-test（全検出系コマンド対象）**: 実行前に既知の違反 fixture で 1 件ヒットすることを確認する。**0 件の検査結果は self-test 通過後のみ「準拠」と報告できる。**
- **コマンドは `AUDIT.md` のコードブロックが正本。この skill にコマンドを複製しない。**

### N/A の判定

`AUDIT.md` の各項目が定める N/A 条件（「認証なし」「Webhook 機能なし」「個人データなし」等）に該当する場合は N/A として報告する。**判定の根拠を備考に書く**（「認証なしのため」等）。根拠のない N/A は WARN として扱う。

---

## ステップ 4: ヘルスレポートを出力する

ドメイン名は `AUDIT.md` のセクション名に合わせる（対応を追えるようにするため）。

```
## Standards Health Report  [kickoff | progress | done]
standards_version（参照）: <CHANGELOG.md の最新 rev>
プロジェクト standards_version: <AGENTS.md / CLAUDE.md の値 or 未記載>
実行セクション: <ステップ 3 の表に従って実行したセクション名>

| ドメイン            | 状態 | ギャップ                                      |
|--------------------|------|-----------------------------------------------|
| 構成・ツーリング      | ⚠️   | deploy.yml に <DEPLOY_COMMAND> が残っている     |
| アーキテクチャ        | ✅   |                                               |
| UI・デザイン         | ✅   |                                               |
| ドキュメント          | ❌   | .docs/ に PROJECT_GOAL.md がない（DOCS_OPS §3） |
| セキュリティ          | ⚠️   | SSRF 防止未確認（アウトバウンド HTTP あり）      |
| 公開プロダクト        | ❌   | <product> プレースホルダーが 3 箇所残っている    |

### 要対応（❌ FAIL）
1. ...

### 確認推奨（⚠️ WARN）
1. ...

### self-test の結果
検出系チェックのうち 0 件だった項目について、self-test を通過したかを記載する。
未実施の項目は「未検証」と明記し、準拠とは報告しない。
```

状態の定義:

- ✅ PASS: 該当セクションの項目がすべて満たされている（根拠つき N/A を含む）
- ⚠️ WARN: 軽微な未対応（プレースホルダー 1 箇所等）、条件付き項目が未確認、または self-test 未実施で 0 件だった項目がある
- ❌ FAIL: MUST 項目が未対応

`standards_version` がプロジェクト側で古い場合は、その差分 rev 数を必ず報告に含める（古い版を前提に準拠していても、現行 standards には準拠していないため）。
