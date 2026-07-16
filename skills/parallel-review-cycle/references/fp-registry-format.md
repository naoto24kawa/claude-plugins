# FP Registry Format

偽陽性レジストリのフォーマットと運用ルール。

## エントリフォーマット

```markdown
## FP-{N}
**主張**: {スペシャリストが報告した問題の要約（1〜2行）}
**初出**: R{ラウンド番号} #{スペシャリスト番号} ({ロール名})
**判定**: FALSE POSITIVE
**理由**: {なぜ偽陽性か。どこに保護があるか、設計意図は何か、を具体的に}
```

## 例

```markdown
## FP-001
**主張**: implement モードの SKIP count が過小評価される（変更ファイルが reverseFiles に含まれるのに表示されない）
**初出**: R1 #5 (Fresh Eyes)
**判定**: FALSE POSITIVE
**理由**: 変更ファイルは reverseFiles の depth=0 に含まれており、
  "Changed:" ヘッダーセクションで表示されている。
  totalFiles - reverseFiles.size - forwardFiles.size は
  「Changed + Reverse + Forward = totalFiles - SKIP」を正確に表す。

## FP-002
**主張**: buildFullGraph が WAL モードで別接続と競合する（SQLITE_BUSY）
**初出**: R2 #3 (Core Logic)
**判定**: FALSE POSITIVE
**理由**: openDb は必ず WAL モードで接続を開く。
  WAL モードでは同一ファイルへの並行接続は安全（reader/writer は非ブロッキング）。
  SQLITE_BUSY は exclusive モードでのみ発生する。
```

## 照合ルール

### マッチとみなす条件

完全一致は不要。以下の条件で「同じ偽陽性」と判定する:

1. **同じロジックへの同じ誤解**: 例「SKIP count が間違っている」という主張はどの表現でも FP-001 にマッチ
2. **同じ前提の欠落**: 例「WAL モードを考慮していない」系はすべて FP-002 にマッチ
3. **同じ保護の見落とし**: 例「db! が危険」という主張は「process.exit(1) で保護済み」という事実で棄却

### マッチしない条件（新規として扱う）

- 新しいファイルや新しいコードパスへの指摘
- 既知の FP と「似ているが別の問題」（例: SKIP count の計算式は同じでも異なるモードの話）
- FP レジストリにある「理由」が現在のコードに当てはまらない（コードが変わった場合）

## スペシャリストへの展開方法

FP レジストリをプロンプトに組み込む際は、以下の形式で埋め込む:

```
## 既知の偽陽性（これらは確認済み・報告不要）

{fp-registry.md の内容をそのまま展開}

上記はすでに「偽陽性」と確認済みです。同じ主張は報告しないでください。
```

## レジストリの成長管理

### いつ追加するか

- スペシャリストの指摘を分析し「これは設計通りで問題ない」と判断したとき
- 複数ラウンドで同じ指摘が繰り返されたとき

### いつ「昇格」させるか

FP レジストリはサイクル終了時に削除される。しかし以下の場合は恒久的な記録に昇格させる:

- **CLAUDE.md の「重要な設計上の事実」セクションへ**: コードベース全体で繰り返す可能性がある設計判断
- **スペシャリストプロンプトの「設計上の事実」へ**: 次サイクルでも同じ誤判定が予想される場合

昇格させることで、次サイクルで FP レジストリを初期化してもゼロから学び直さなくて済む。

## レジストリファイルの管理

```bash
# 初期化（サイクル開始時）— uuidgen (macOS/BSD) / /proc (Linux) でポータブルに生成
_uuid=$(uuidgen 2>/dev/null | tr '[:upper:]' '[:lower:]' \
  || cat /proc/sys/kernel/random/uuid 2>/dev/null \
  || date +%s%N)
REVIEW_DIR="/tmp/review-cycle-${_uuid}"
mkdir -p "$REVIEW_DIR"
touch "$REVIEW_DIR/fp-registry.md"

# 現在のエントリ数を確認
grep -c "^## FP-" "$REVIEW_DIR/fp-registry.md" 2>/dev/null || echo "0"

# エントリを追加（このファイルの「エントリフォーマット」セクションに従い追記）

# クリーンアップ（サイクル完了時）
rm -rf "$REVIEW_DIR"
```
