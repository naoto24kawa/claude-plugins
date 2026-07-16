# watch-sprawl

PR の import グラフ構造差分を sprawlens で計測し、循環依存・ハブ肥大化・エッジ密度の変化を PR コメントとして投稿するユーザーレベルスキル。

## 前提

### sprawlens のビルド

sprawlens は npm 未公開・dist 非コミットのためローカルビルドが必要。pnpm workspace 構成になっているため viz → cli の順でビルドする。

```bash
cd ~/projects/mizchi/sprawlens
pnpm install
pnpm --filter @sprawlens/viz build && pnpm --filter @sprawlens/cli build
```

ビルド後に動作確認する。

```bash
node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js --version
```

### その他

- `node` が PATH に存在する（`node --version` が通る）
- `gh` CLI が認証済み（`gh auth status` が通る）
- 対象リポジトリへの `push` 権限がある（ラベル自動作成に必要）
- 対象リポジトリが GitHub リモート付きの git リポジトリ

## 呼び出し方

```
/watch-sprawl             # watch:sprawl:checked ラベルがない open PR を順番に処理
/watch-sprawl max=3       # 最大3件まで処理
/watch-sprawl 42          # PR #42 を直接指定
```

`package.json` に `watch:sprawl` スクリプトは追加しない。ユーザーレベルで直接呼ぶ。

## GitHub ラベル

スキルが自動作成する。手動で付け外ししない。

| ラベル | 色 | 意味 |
|---|---|---|
| `watch:sprawl:active` | 黄 | チェック中 |
| `watch:sprawl:checked` | 緑 | チェック完了 |
| `watch:sprawl:warning` | 赤 | 要確認あり |

## 計測指標と閾値

| 指標 | Warning | Blocking |
|---|---|---|
| cycleCount（循環依存） | +1以上増加 | +2以上増加 |
| maxFanIn | +10以上増加 | +20以上増加 |
| エッジ密度（edges/files） | +0.1以上 | +0.2以上 |
| 最大連結成分比率 | +5%以上 | なし |

## 注意

- `watch-review` / `watch-issue` と同一 worktree で同時実行しない（`gh pr checkout` が HEAD を切り替えるため互いの作業を破壊する）
- sprawlens を更新した場合は再ビルドが必要
