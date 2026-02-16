# Agent Team Mode

TEAM モードでタスクを並列実行するための運用ルールとロール定義。

**使用タイミング:**
- 複数の独立したタスクを並列実行したい
- タスクの依存関係を明示的に管理したい
- 役割分担（実装・検証・記録）を明確にしたい

---

## TEAM モード概要

### 基本原則

- 共有タスクリストで進捗管理 (`pending / in_progress / completed`)
- 依存関係を明示的に定義
- オーナーとターゲットファイルを分離して競合を回避
- 高リスクな変更は事前に計画承認を必須とする
- 1セッション = 1チーム（チームのネストは禁止）
- 完了時は、teammates を停止してからクリーンアップ

### 運用フロー

1. **チーム作成**: TeamCreate でチームと共有タスクリストを作成
2. **タスク分解**: TaskCreate でタスクを作成し、依存関係を設定
3. **メンバー起動**: Task ツールで teammates を起動
4. **タスク割り当て**: TaskUpdate で owner を設定して割り当て
5. **進捗管理**: teammates が作業完了したら TaskUpdate で completed に更新
6. **統合判断**: すべてのタスク完了後、統合可能か判断
7. **チーム解散**: SendMessage で shutdown_request を送信、TeamDelete でクリーンアップ

## Role Contract (TEAM)

### Role: Leader

**責務:**
- タスク分解と依存関係管理
- メンバーへのタスク割り当て
- 進捗判断と統合判断

**入力:**
- PROJECT_GOAL
- Issue
- 現状
- 各ロールからのレポート

**出力:**
- `GOAL / PLAN / INSPECTION_STATUS / RISKS / NEXT_ACTION`

**完了条件:**
- 依存関係が解決されている
- 統合が可能
- 次のタスクが明確に定義されている

**禁止事項:**
- 未承認のポリシー変更
- 証拠のない受け入れ判断
- 検証なしの完了宣言

---

### Role: Implementer

**責務:**
- 割り当てられたスコープの実装
- 関連テストの追加・更新
- 最小限必要な設計更新

**入力:**
- タスク仕様
- 受け入れ基準
- 既存コード

**出力:**
- 実装レポート: `CHANGES / TESTS / RISKS`

**完了条件:**
- 受け入れ基準を満たしている
- 検証結果が明確

**禁止事項:**
- 割り当て外の未承認変更
- 証拠なしの完了判断

---

### Role: Verifier

**責務:**
- 要件・コード・テスト・仕様を独立した視点で検査

**入力:**
- Diff
- テスト結果
- 要件
- 仕様

**出力:**
- 検査レポート: `OK | REWORK | ACCEPT_WITH_RISK`

**完了条件:**
- 判断・根拠・影響範囲・推奨アクションが再現可能

**禁止事項:**
- 証拠なしの承認
- 重大な発見事項の無視

---

### Role: Recorder

**責務:**
- Issue/PR/comments/`.docs/` に証拠を正規フォーマットで記録

**入力:**
- Leader/Implementer/Verifier からのレポート
- CI 結果
- 決定事項

**出力:**
- トレーサブルな GitHub レコードセット

**完了条件:**
- `Issue <-> PR <-> Commit` のリンクが確立されている

**禁止事項:**
- 証拠なしの完了記録
- 必須フィールドが欠けた merge-ready 判断

---

## Parallel Task Lock (推奨)

### 目的

複数の teammates が同時に作業する際の競合を防ぐ。

### 仕組み

- タスクごとにロックファイルを使用（例: `current_tasks/<task>.txt`）
- ロック取得失敗時はタスクを開始せず、別のタスクに切り替える
- 各サイクル内で厳密に `pull -> 競合解決 -> push -> ロック解放` の順序を守る

### 実装例

```bash
# ロック取得
mkdir -p current_tasks
if ! mkdir "current_tasks/task-123" 2>/dev/null; then
  echo "Task is locked, switching to another task"
  exit 1
fi

# 作業実行
git pull
# ... 作業 ...
git add .
git commit -m "message"
git push

# ロック解放
rm -rf "current_tasks/task-123"
```

---

## ベストプラクティス

### タスク分解

- **粒度**: 1タスク = 1-2時間で完了する単位
- **独立性**: 可能な限り依存関係を減らす
- **明確性**: 受け入れ基準を明示する

### コミュニケーション

- **SendMessage**: teammates への指示や確認は SendMessage ツールで送信
- **TaskUpdate**: タスクステータスの更新は TaskUpdate で行う
- **自動通知**: teammates がアイドル状態になると自動通知される（反応不要）

### トラブルシューティング

#### Teammate がブロックされている

1. 1回の再指示を試みる
2. 改善が見られない場合は別の teammate に交代

#### 進捗が停滞している

- 変更をさらに小さく分割して再試行

#### 依存関係の循環

- タスク分解を見直し、依存関係を整理

---

## 関連ツール

- `TeamCreate`: チーム作成
- `TeamDelete`: チーム削除
- `TaskCreate`: タスク作成
- `TaskUpdate`: タスク更新（status, owner, dependencies）
- `TaskList`: タスク一覧表示
- `TaskGet`: タスク詳細取得
- `SendMessage`: teammate へのメッセージ送信

---

**このスキルは TEAM モード使用時に手動で呼び出してください。**
**呼び出し方法: `/agent-team`**
