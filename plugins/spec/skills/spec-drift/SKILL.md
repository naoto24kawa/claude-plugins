---
name: spec-drift
description: This skill should be used when the user asks to "乖離チェックして", "仕様とコードがずれてないか確認して", "spec-driftを実行して", "仕様の乖離を検出して", "ドリフトレポートを出して", "仕様書の整合性を確認して", "specとコードを比較して". 仕様ドキュメント(docs/specs/)とコードベースの実態を比較し、乖離を検出してレポートを出力する。
allowed-tools: [Bash, Read, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Spec Drift

仕様ドキュメントとコードベースの乖離を検出する。

## 前提条件

- 仕様ドキュメントの出力ディレクトリ (デフォルト: `docs/specs/`) が存在すること
- 存在しない場合は `spec-coordinator` による初回生成を案内する

## Output Directory

1. ユーザーがカスタムディレクトリを指定した場合、それを使用する
2. 指定がない場合、デフォルト: `docs/specs/`

## ワークフロー

### Step 1: 全仕様ファイルの読み込み

Glob で仕様ディレクトリ内の `*.md` ファイルを検索し、各ファイルを Read して内容を把握する。
内部ファイル (`_context.md`, `_index.md`) はスキップする。

frontmatter の `type`, `area`, `doc_status` を抽出し、仕様の構造を把握する。
`doc_status: deprecated` のファイルは乖離チェック対象外とし、レポートで別途列挙する。

**Verification**: 全ファイルを読み込んだ

**Error Handling**:
- 仕様ディレクトリにファイルがない場合: `spec-coordinator` の実行を案内する

### Step 2: コード実態との比較

各仕様ドキュメントの `type` に応じた比較方法を適用する。

#### type: data-model の比較

1. 仕様の「エンティティ詳細」セクションからテーブル/モデル名を抽出する
2. Grep でコードベース内の対応するモデル定義を検索する (例: `schema.ts`, `models/`, `migrations/`, `prisma/schema.prisma`)
3. 仕様のカラム/フィールドとコード定義を照合する
4. frontmatter `related_tables` の値がコード内に実在するか Grep で確認する

#### type: api の比較

1. 仕様の「エンドポイント一覧」からメソッド + パスを抽出する
2. Grep でコードベース内のルーティング定義を検索する (例: `app.get`, `router.post`, `@Get`, `@Post`)
3. 仕様のエンドポイントとコード定義を照合する
4. frontmatter `related_apis` の値がコード内に実在するか Grep で確認する

#### type: feature / usecase の比較

1. 仕様の「機能一覧」または「基本フロー」からキーとなる機能名/処理名を抽出する
2. Grep でコードベース内の対応する実装を検索する
3. 記述された機能が実装に存在するか、逆に未記載の機能がないか確認する

#### type: architecture の比較

1. 仕様の「モジュール一覧」からモジュール名とパスを抽出する
2. Glob でコードベースの実際のディレクトリ構造と照合する
3. 仕様に記載のないディレクトリや、仕様のパスと実際のパスの食い違いを検出する

#### type: business-rules の比較

1. 仕様の「定数・設定値」「バリデーションルール」から具体的な値やルールを抽出する
2. Grep でコード内の対応する定数定義やバリデーション実装を検索する
3. 仕様の値とコード内の値が一致するか確認する

#### type: non-functional の比較

1. 仕様の「パフォーマンス」「セキュリティ」等から設定値や使用ライブラリを抽出する
2. Grep でコード内の対応する実装を検索する
3. 仕様の記述とコードの実態が一致するか確認する

#### type: overview の比較

1. 仕様の「技術スタック」テーブルから技術名とバージョンを抽出する
2. コードベースの `package.json`, `Cargo.toml`, `go.mod` 等と照合する
3. バージョンの食い違いや、未記載の主要依存を検出する

#### その他の type (screen, batch, integration)

1. 仕様の主要セクションからキー要素を抽出する
2. Grep でコード内の対応実装を検索して照合する

### Step 3: 未文書化の機能領域の検出

1. コードベースの主要ディレクトリ構造を Glob で取得する

```bash
ls -d src/*/  app/*/  lib/*/  packages/*/  2>/dev/null
```

2. 各ディレクトリの機能領域名を推定する
3. Step 1 で抽出した仕様の `area` 一覧と照合する
4. コードに存在するが仕様 area にマッピングされない領域を「未文書化」として報告する

### Step 4: frontmatter 整合性チェック

各仕様ファイルについて以下を確認する:

- `related`: 参照先ファイルが実在するか Glob で確認
- `related_tables`: テーブル名がコード内に実在するか Grep で確認
- `related_apis`: API パスがコード内に実在するか Grep で確認

### Step 5: レポート出力

以下のフォーマットでレポートをユーザーに表示する (ファイル保存はしない)。

```markdown
# Spec Drift Report

**検査日**: YYYY-MM-DD
**仕様ディレクトリ**: docs/specs/
**検査ファイル数**: N 件

## 乖離なし
- 00-overview.md
- 01-architecture.md

## 乖離あり
### 02-data-model.md
- [仕様にあり/実装になし] usersテーブルのemail_verified カラム
- [実装にあり/仕様になし] sessionsテーブルのdevice_info カラム

### 03-api-specification.md
- [実装にあり/仕様になし] DELETE /api/users/:id エンドポイント

## frontmatter 不整合
- 02-data-model.md: related_tables に "audit_logs" があるがコードに未検出

## 未文書化の機能領域
- notification (実装はあるが仕様ファイルなし)

## deprecated ドキュメント
- (なし、またはリスト)

## 推奨アクション
- [ ] spec-update で差分を反映する
- [ ] spec-coordinator で全体を再生成する
```

**Verification**: レポートがユーザーに提示された

## 記述方針

- 仕様には「何がどうなっているか」を記述する
- 「なぜそうなっているか」は PR/Issue/commit に残す
- この分離により、仕様は事実として信頼でき、変更理由は追跡チェーンで辿れる
- 設計判断の経緯は `decisions/` ディレクトリ (ADR等) に記録し、仕様からは参照のみ行う

## リファレンスファイル

- **`../../references/frontmatter-schema.md`** - docs/specs frontmatter の必須/オプションフィールド定義、doc_status 遷移ルール
- **`../../references/spec-template.md`** - type 別の仕様ドキュメントテンプレート (比較時のセクション構造の参照に使用)
