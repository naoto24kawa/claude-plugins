---
name: create-pr
description: GitHub Pull Request を技術記録として作成する。実装の技術的な決定事項、アーキテクチャへの影響、変更ファイルを記録する。ユーザーが「PR作成」「プルリクエスト作成」「マージしたい」などと言ったとき、または実装完了後に使用する。
allowed-tools: [Bash, Read, Write, Glob, AskUserQuestion]
---

# PR 作成スキル

GitHub Pull Request を技術記録として作成する。

## 目次

1. [役割](#役割)
2. [ワークフロー](#ワークフロー)
3. [デフォルト設定](#デフォルト設定)
4. [例](#例)

## 役割

PR は **技術記録** として機能する:
- How: どう実装したか
- 技術的な決定事項
- アーキテクチャへの影響

仕様の「なぜ」は関連 Issue 側を参照する。

## ワークフロー

### 0. テンプレートセットアップ

プロジェクトに PR テンプレートがなければセットアップする。

```bash
# テンプレートの存在確認
ls .github/PULL_REQUEST_TEMPLATE.md 2>/dev/null
```

テンプレートが存在しない場合:
1. ユーザーに確認: 「PR テンプレートをセットアップしますか?」
2. 承認後、本スキルの `templates/` 配下のファイルを読み込み
3. `.github/` に Write ツールでコピー

```bash
mkdir -p .github/PULL_REQUEST_TEMPLATE
```

コピー対象:
- `templates/PULL_REQUEST_TEMPLATE.md` → `.github/PULL_REQUEST_TEMPLATE.md`
- `templates/PULL_REQUEST_TEMPLATE/deploy.md` → `.github/PULL_REQUEST_TEMPLATE/deploy.md`

**Note**: テンプレートは本スキルの親ディレクトリ `templates/` に配置されている。
スキルディレクトリ構造: `plugins/github/skills/create-pr/` → `plugins/github/templates/`

**Verification**: テンプレートが `.github/` に存在する

**Error Handling**:
- テンプレート既存: スキップして次へ
- コピー失敗: 手動でのテンプレート作成を案内

### 1. 変更内容の確認

```bash
git status
git diff main...HEAD
git log main..HEAD --oneline
```

**Verification**: 変更内容が把握できた (変更ファイル、コミット履歴)

**Error Handling**:
- 未コミットの変更あり: コミットを促す
- main ブランチにいる: 新しいブランチ作成を提案
- **差分がない (main と同一)**: 空コミットで対処 (下記参照)

### 2. リモートへのプッシュ確認

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "no upstream"
```

**Verification**: リモートブランチが設定されている、または設定が必要と判明

**Error Handling**:
- upstream 未設定: `git push -u origin <branch>` を実行
- プッシュ失敗: 認証確認、リモート状態確認

### 3. 技術的な決定事項の整理

実装中に判断したことを整理:
- 使用したライブラリ/パターン
- なぜその方法を選んだか

**Verification**: 技術的な決定事項がリストアップされた

### 4. PR 作成

`gh pr create` で PR を作成する。

テンプレート形式は [references/pr-template.md](references/pr-template.md) を参照。

```bash
gh pr create --title "<type>: <概要>" --body "$(cat <<'EOF'
## Related Issue

Closes #<issue番号>

## Summary

<このPRで何を実装したか>

## Technical Changes

### 変更ファイル

- `path/to/file.ts` - <変更内容>

### 技術的な決定事項

| 決定事項 | 選択 | 理由 |
|---------|------|------|
| <例: 状態管理> | <useState> | <理由> |

### アーキテクチャへの影響

- [ ] なし
- [ ] DB スキーマ変更
- [ ] API エンドポイント追加・変更
- [ ] 新規依存パッケージ追加
- [ ] 設定ファイル変更

## Type

- [ ] `feat` - 新機能
- [ ] `fix` - バグ修正
- [ ] `change` - 既存機能の変更
- [ ] `remove` - 機能削除
- [ ] `refactor` - リファクタリング

## Affected Areas

- [ ] `apps/frontend`
- [ ] `apps/backend`
- [ ] `packages/types`

## Testing

- [ ] 単体テスト追加・更新
- [ ] ローカルで手動確認

## Breaking Changes

なし
EOF
)"
```

**Verification**: `gh pr create` が成功し、PR URL が返された

**Error Handling**:
- 認証エラー: `gh auth login` を案内
- ブランチ未プッシュ: Step 2 に戻ってプッシュ
- ベースブランチ不正: `--base main` を明示的に指定

### 5. 確認

作成した PR の URL をユーザーに共有する。

**Verification**: ユーザーに URL を共有した

## デフォルト設定

| 項目 | デフォルト値 |
|------|-------------|
| ベースブランチ | `main` |
| タイトル形式 | `<type>: <概要>` |
| Breaking Changes | `なし` (変更がある場合は明記) |

## 例

### Good Example

**状況**: Issue #42 の実装が完了、3ファイルを変更

**プロセス**:
1. 変更確認: `git diff main...HEAD` で差分確認
2. プッシュ確認: upstream 設定済み
3. 決定事項整理: 「useState を選択、Context は不要と判断」
4. PR作成: 技術的決定事項を表形式で記録

**結果**:
```
## Technical Changes

### 技術的な決定事項

| 決定事項 | 選択 | 理由 |
|---------|------|------|
| 状態管理 | useState | 単一コンポーネント内で完結 |
| バリデーション | Zod | 型安全性と実行時検証の両立 |
```

### Bad Example

**状況**: 「PR作成して」と言われたが、まだ main ブランチにいる

**問題**: PR 作成不可

**対処**:
1. 「現在 main ブランチにいます。新しいブランチを作成しますか?」と確認
2. ブランチ作成後、変更をコミット
3. その後 PR 作成に進む

## 差分がない場合の対処

main ブランチと差分がない状態で PR を作成したい場合 (ドキュメント PR、議論用 PR など)。

### 空コミットによる PR 作成

```bash
# 1. feature ブランチを作成 (まだの場合)
git checkout -b <branch-name>

# 2. 空コミットを作成
git commit --allow-empty -m "<type>: <概要>"

# 3. プッシュ
git push -u origin <branch-name>

# 4. PR 作成
gh pr create --title "<type>: <概要>" --body "..."
```

### 使用ケース

| ケース | 説明 |
|--------|------|
| ドキュメント PR | README や設計ドキュメントの議論用 |
| 議論用 PR | 実装前の設計レビュー |
| プレースホルダー PR | 後から変更を追加する予定 |

### 注意点

- 空コミットは `--allow-empty` フラグが必須
- PR 本文に「空コミットで作成」した理由を明記する
- 実際の変更は後から追加コミットで対応

## 注意事項

- PR タイトルは `<type>: <概要>` 形式にする
- 関連 Issue を `Closes #` で紐付ける
- 技術的な決定事項は表形式で簡潔に記録
- 変更ファイルはパスを明記する
- 差分がない場合は空コミット (`--allow-empty`) で対処可能
