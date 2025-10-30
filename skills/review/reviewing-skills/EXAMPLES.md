# スキル作成の良い例・悪い例

このドキュメントは、Claude Code スキル作成における良い例と悪い例を対比して示します。

---

## 目次

1. [スキル名の例](#スキル名の例)
2. [Description の例](#description-の例)
3. [Progressive Disclosure の例](#progressive-disclosure-の例)
4. [ワークフローの例](#ワークフローの例)
5. [エラーハンドリングの例](#エラーハンドリングの例)
6. [テンプレートの例](#テンプレートの例)

---

## スキル名の例

### ❌ 悪い例

```yaml
# 悪い例1: Gerund 形式でない
name: pdf-helper

# 悪い例2: 曖昧な名前
name: utils

# 悪い例3: 大文字を含む
name: PDF-Processing

# 悪い例4: 予約語使用
name: document-manager
```

**問題点**:
- Gerund 形式（動詞+-ing）でない
- 機能が不明確
- 命名規則違反

### ✅ 良い例

```yaml
# 良い例1: 明確な機能と Gerund 形式
name: processing-pdfs

# 良い例2: 具体的なアクション
name: analyzing-spreadsheets

# 良い例3: 目的が明確
name: reviewing-code

# 良い例4: スキル名から機能が推測できる
name: generating-reports
```

**良い点**:
- Gerund 形式に準拠
- 機能が明確
- 発見しやすい

---

## Description の例

### ❌ 悪い例

#### 例1: 曖昧で情報不足

```yaml
description: Helps with documents
```

**問題点**:
- 何をするのか不明確
- トリガーワードがない
- 一人称でない（これは実は問題ない、三人称が推奨）

#### 例2: 一人称で記述

```yaml
description: I can help you extract text from PDF files and merge documents
```

**問題点**:
- 一人称（"I"）を使用している
- 三人称で記述すべき

#### 例3: トリガーワードがない

```yaml
description: Processes and analyzes Excel spreadsheet data with various operations
```

**問題点**:
- いつ使うべきかが不明
- 具体的なユースケースがない

### ✅ 良い例

#### 例1: 具体的でトリガーワード付き

```yaml
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.
```

**良い点**:
- 具体的な機能を列挙
- "Use when..." でトリガーを明示
- 複数のキーワード（PDF, forms, extraction）

#### 例2: 詳細な機能説明

```yaml
description: Analyze Excel spreadsheets for data patterns, create pivot tables, generate charts, and export reports. Use when the user wants to work with Excel files, mentions spreadsheet analysis, data visualization, or asks for Excel-related tasks.
```

**良い点**:
- 機能が具体的
- ユースケースが明確
- 多様なトリガーワード

#### 例3: コードレビューの例（作成したスキル）

```yaml
description: コードの品質、設計、型安全性を6つの専門エージェント（SRP、可読性、KISS、規約、TypeScript、ゴミファイル検出）で多角的にレビューし、優先度付き改善計画を策定する。ユーザーが「レビュー」「コード品質」「改善提案」「リファクタリング」「設計評価」「型チェック」などを依頼した時、または実装後の品質確認が必要な時に使用する
```

**良い点**:
- 具体的なエージェント数と種類
- 多数のトリガーワード
- ユースケースが明確

---

## Progressive Disclosure の例

### ❌ 悪い例: すべてを SKILL.md に詰め込む

```markdown
---
name: analyzing-data
description: ...
---

## データ分析スキル

### 概要
[50行の説明...]

### 詳細な統計手法
[200行の統計理論...]

### 機械学習アルゴリズム
[300行のアルゴリズム説明...]

### 可視化テクニック
[150行の可視化方法...]

### トラブルシューティング
[100行のエラー対処...]

### 参考資料
[50行の参考リンク...]

合計: 850行
```

**問題点**:
- 500行推奨を大幅超過
- すべての情報が常に読み込まれる
- コンテキストウィンドウの無駄遣い

### ✅ 良い例: Progressive Disclosure

#### SKILL.md (150行)

```markdown
---
name: analyzing-data
description: ...
---

## データ分析スキル

### 概要
このスキルはデータ分析を支援します。

### 実行手順

1. **データ読み込み**: CSVまたはExcelファイルを読み込む
2. **分析実施**: 統計分析または機械学習を適用
   - 詳細: `./STATISTICAL_METHODS.md`
3. **可視化**: 結果をグラフ化
   - 詳細: `./VISUALIZATION_GUIDE.md`
4. **レポート作成**: 結果をレポートにまとめる
   - テンプレート: `./REPORT_TEMPLATE.md`

### トラブルシューティング
一般的な問題の対処法は `./TROUBLESHOOTING.md` を参照
```

#### 外部ファイル

- `STATISTICAL_METHODS.md` (200行) - 統計手法の詳細
- `VISUALIZATION_GUIDE.md` (150行) - 可視化の詳細
- `REPORT_TEMPLATE.md` (100行) - レポートテンプレート
- `TROUBLESHOOTING.md` (100行) - トラブルシューティング

**良い点**:
- SKILL.md が簡潔（150行）
- 詳細は必要時のみ読み込まれる
- 参照が1階層のみ

---

## ワークフローの例

### ❌ 悪い例: 検証なし

```markdown
## 実行手順

1. データを読み込む
2. 分析を実行する
3. 結果を保存する
```

**問題点**:
- 検証ステップがない
- エラー時の対処が不明
- 成功条件が不明確

### ✅ 良い例: 検証付きワークフロー

```markdown
## 実行手順（検証付き）

### ステップ1: データ読み込み
- 対象ファイルを読み込む
- **検証**: ファイルが存在し、読み込み可能であることを確認
- **エラー時**: ファイルパスを確認し、再試行

### ステップ2: データ検証
- データ形式をチェック
- **検証**: 必須カラムが存在することを確認
- **エラー時**: 欠損カラムを報告し、ユーザーに確認

### ステップ3: 分析実行
- 統計分析を実施
- **検証**: 分析結果が有効な値であることを確認
- **エラー時**: エラーメッセージを表示し、データを確認

### ステップ4: 結果保存
- 分析結果を保存
- **検証**: ファイルが正常に作成されたことを確認
- **出力**: 保存先パスを表示
```

**良い点**:
- 各ステップに検証がある
- エラーハンドリングが明確
- 成功条件が定義されている

---

## エラーハンドリングの例

### ❌ 悪い例: "Punt"（問題を先送り）

```markdown
## 実行手順

1. データファイルを読み込む
2. エラーが発生した場合、ユーザーに報告する
3. 分析を続行する
```

**問題点**:
- エラーを具体的に処理していない
- 問題をユーザーに丸投げ
- 続行可能か不明

### ✅ 良い例: "Solve, Don't Punt"

```markdown
## 実行手順

### ステップ1: データ読み込み（エラーハンドリング付き）

**通常処理**:
```python
data = load_csv(file_path)
```

**エラーハンドリング**:
```python
try:
    data = load_csv(file_path)
except FileNotFoundError:
    # エラーを解決: 代替パスを試行
    alternative_paths = [
        f"./{file_name}",
        f"./data/{file_name}",
        f"./input/{file_name}"
    ]
    for path in alternative_paths:
        if os.path.exists(path):
            data = load_csv(path)
            print(f"✓ ファイルを発見: {path}")
            break
    else:
        # それでも見つからない場合
        print(f"✗ エラー: {file_name} が見つかりません")
        print(f"以下のディレクトリを確認してください:")
        print(f"  - カレントディレクトリ")
        print(f"  - ./data/")
        print(f"  - ./input/")
        exit(1)
except PermissionError:
    print(f"✗ エラー: {file_path} の読み取り権限がありません")
    print(f"対処法: chmod +r {file_path} を実行してください")
    exit(1)
```
```

**良い点**:
- エラーを明示的に処理
- 代替案を自動で試行
- 具体的なエラーメッセージと対処法を提供

---

## テンプレートの例

### ❌ 悪い例: テンプレートなし

```markdown
## レポート作成

分析結果をレポートにまとめてください。
```

**問題点**:
- 期待される形式が不明
- 出力が不統一になる
- ユーザーが迷う

### ✅ 良い例: 明確なテンプレート

```markdown
## レポート作成

以下のテンプレートに従って、分析結果をレポートにまとめてください。

**テンプレート** (`./REPORT_TEMPLATE.md`):

```markdown
# データ分析レポート

## サマリー
- **データセット**: [ファイル名]
- **分析日時**: [日時]
- **レコード数**: [数]

## 主要な発見
1. [発見1]
2. [発見2]
3. [発見3]

## 統計情報
| 指標 | 値 |
|------|-----|
| 平均 | [値] |
| 中央値 | [値] |
| 標準偏差 | [値] |

## 推奨事項
- [推奨1]
- [推奨2]

## 詳細データ
[グラフまたは表を添付]
```
```

**良い点**:
- 期待される形式が明確
- 一貫性のある出力
- コピー可能なテンプレート提供

---

## 自由度レベルの例

### 高自由度（柔軟なタスク）

```markdown
## クリエイティブライティング

**指示**:
ユーザーの要求に応じて、創造的な文章を生成してください。
スタイル、トーン、長さは状況に応じて調整してください。
```

**適切な理由**: 創造的タスクには柔軟性が必要

### 中自由度（推奨パターンあり）

```markdown
## データ分析

**推奨アプローチ**:
1. データを読み込み、基本統計を確認
2. 外れ値を検出し、適切に処理
3. 相関分析を実施
4. 結果を可視化

**注意**: プロジェクト固有の要件がある場合は調整可能
```

**適切な理由**: ベストプラクティスを示しつつ、柔軟性も保持

### 低自由度（脆弱な操作）

```markdown
## データベース移行

**実行スクリプト**:
```bash
#!/bin/bash
# 必ずこの順序で実行してください

# 1. バックアップ作成
pg_dump -h localhost -U user -d olddb > backup_$(date +%Y%m%d).sql

# 2. 新データベース作成
createdb -h localhost -U user newdb

# 3. スキーマ移行
psql -h localhost -U user -d newdb < schema.sql

# 4. データ移行
psql -h localhost -U user -d newdb < backup_*.sql

# 5. 検証
psql -h localhost -U user -d newdb -c "SELECT COUNT(*) FROM users;"
```

**重要**: このスクリプトを正確に実行してください。
順序を変えると、データ損失の可能性があります。
```

**適切な理由**: データ操作は正確性が必要で、エラーが致命的

---

## まとめ

### 良いスキルの特徴

1. **明確な命名**: Gerund 形式で機能が推測できる
2. **発見可能な Description**: トリガーワードと具体的な機能説明
3. **Progressive Disclosure**: SKILL.md は簡潔で、詳細は外部ファイル
4. **検証付きワークフロー**: 各ステップに検証とエラーハンドリング
5. **明確なテンプレート**: 期待される出力形式を提供
6. **適切な自由度**: タスクの性質に応じた指示レベル

### 避けるべき反パターン

1. ❌ 曖昧な命名と説明
2. ❌ すべてを SKILL.md に詰め込む
3. ❌ 検証のないワークフロー
4. ❌ エラーをユーザーに丸投げ
5. ❌ テンプレートなしの出力指示
6. ❌ 時間依存情報の含有

これらの例を参考に、高品質なスキルを作成してください。
