---
name: create-issue
description: GitHub Issue を仕様書として作成する。仕様の追加/変更/削除/バグ修正を As-Is/To-Be 形式で構造化し、判断経緯(検討した選択肢、選択理由、トレードオフ)も記録する。ユーザーが「Issue作成」「仕様書作成」「機能追加したい」「バグを報告」などと言ったときに使用する。
allowed-tools: [Bash, Read, Write, Glob, AskUserQuestion]
---

# Issue 作成スキル

GitHub Issue を仕様書として作成する。

## 目次

1. [役割](#役割)
2. [ワークフロー](#ワークフロー)
3. [デフォルト設定](#デフォルト設定)
4. [例](#例)

## 役割

Issue は **仕様書の元** として機能する:
- What: 何を変えるか
- Why: なぜ変えるか (判断経緯)

技術的な実装詳細は PR 側に記録する。

## ワークフロー

### 0. テンプレートセットアップ

プロジェクトに Issue テンプレートがなければセットアップする。

```bash
# テンプレートの存在確認
ls .github/ISSUE_TEMPLATE/specification.yml 2>/dev/null
```

テンプレートが存在しない場合:
1. ユーザーに確認: 「Issue テンプレートをセットアップしますか?」
2. 承認後、本スキルの `templates/ISSUE_TEMPLATE/specification.yml` を読み込み
3. `.github/ISSUE_TEMPLATE/specification.yml` に Write ツールでコピー

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

**Note**: テンプレートは本スキルの親ディレクトリ `templates/` に配置されている。
スキルディレクトリ構造: `plugins/github/skills/create-issue/` → `plugins/github/templates/`

**Verification**: テンプレートが `.github/ISSUE_TEMPLATE/` に存在する

**Error Handling**:
- テンプレート既存: スキップして次へ
- コピー失敗: 手動でのテンプレート作成を案内

### 1. 要件ヒアリング

ユーザーから以下を確認:
- 何をしたいか (概要)
- 現状どうなっているか (As-Is)
- どう変えたいか (To-Be)

不明点があれば `AskUserQuestion` で質問する。

**Verification**: 概要、As-Is、To-Be が全て確認できた

**Error Handling**:
- 情報不足: 追加質問で補完
- ユーザーが不明: 仮定を明示して進める

### 2. 選択肢の検討

複数のアプローチがある場合:
- 各選択肢を列挙
- それぞれのメリット/デメリットを整理
- ユーザーと相談して決定

単一の明確なアプローチの場合はスキップ可。

**Verification**: 選択肢が整理され、ユーザーが選択した (または選択肢が1つのみ)

**Error Handling**:
- 選択肢が多すぎる: 3つ程度に絞って提示
- 決められない: 推奨案を提示

### 3. Issue 作成

`gh issue create` で Issue を作成する。

テンプレート形式は [references/issue-template.yml](references/issue-template.yml) を参照。

```bash
gh issue create --title "<種類>: <概要>" --body "$(cat <<'EOF'
## 種類
<feat/change/remove/fix>

## 概要
<1-2文で簡潔に>

## 現状 (As-Is)
<現在の仕様・動作>

## 変更後 (To-Be)
<変更後の仕様・動作>

## 検討した選択肢
### 選択肢A: <名前> (採用)
- <説明>

### 選択肢B: <名前>
- <説明>
- 却下理由: <理由>

## 選択理由
<なぜこの仕様を選んだか>

## トレードオフ・リスク
<この選択で生じる懸念>

## 受け入れ条件
- [ ] <条件1>
- [ ] <条件2>

## 影響範囲
- frontend / backend / packages/types

## タスク
- [ ] <タスク1>
- [ ] <タスク2>
EOF
)" --label "specification"
```

**Verification**: `gh issue create` が成功し、Issue URL が返された

**Error Handling**:
- 認証エラー: `gh auth login` を案内
- ネットワークエラー: 再試行を提案
- ラベル未存在: ラベルなしで作成、後で手動追加を案内

### 4. 確認

作成した Issue の URL をユーザーに共有する。

**Verification**: ユーザーに URL を共有した

## デフォルト設定

| 項目 | デフォルト値 |
|------|-------------|
| ラベル | `specification` |
| タイトル形式 | `<種類>: <概要>` |
| 影響範囲 | 未指定の場合は質問 |

## 例

### Good Example

**ユーザー**: 「ユーザーがプロフィール画像を設定できるようにしたい」

**プロセス**:
1. ヒアリング: 対応形式、サイズ制限、未設定時の表示を確認
2. 選択肢検討: 画像アップロード vs アバター選択 vs 外部連携
3. Issue作成: As-Is/To-Be、判断経緯を記録

**結果**: `feat: ユーザープロフィール画像機能` として Issue 作成

### Bad Example

**ユーザー**: 「機能追加して」

**問題**: 情報不足で Issue 作成不可

**対処**:
1. 「どのような機能を追加したいですか?」と質問
2. 概要を聞いた後、As-Is/To-Be を確認
3. 十分な情報が揃ってから Issue 作成

## 注意事項

- Issue タイトルは `<種類>: <概要>` 形式にする
- 判断経緯は将来の参照用に詳しく記録する
- 受け入れ条件はチェックリスト形式で具体的に書く
- `specification` ラベルを必ず付与する
