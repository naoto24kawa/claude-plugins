# エージェント統合の検討（2026-07-10）

「似たようなエージェントが複数いる」問題について、統合すべきかを実データで評価した記録。

**結論を先に**: 統合は推奨しない。測定した重複の実体は**責務の重複ではなく boilerplate の重複**であり、
統合は認知負荷をわずかに下げる代わりに、独立再実行性・dispatch 精度・後方互換を失う。
痛みの原因は boilerplate なので、そこを抽出する方が費用対効果が高い。

---

## 0. 所有権の切り分け（統合可能な範囲）

| マーケットプレイス | remote | 統合の可否 |
|---|---|---|
| `naoto24kawa-claude-plugins` | github.com/naoto24kawa/claude-plugins | ✅ 自分のもの（source もローカルにある） |
| 個人エージェント `~/.claude/agents/` | — | ✅ 自分のもの |
| `claude-plugins-official` | Anthropic 公式 | ❌ 触れない |

**この時点で候補が1つ消える**: `code-reviewer` が2つ存在する（`feature-dev` と `pr-review-toolkit`）が、
どちらも**公式プラグイン**であり統合対象外。名前の重複を「重複3件」と数えると、実行不能な案が混ざる。

---

## 1. 候補A: `spec-phase0` 〜 `spec-phase8`（9個 → 1個）

### 共有しているのは責務か、足場か

| 指標 | 実測値 |
|---|---|
| 各ファイルの規模 | 96〜142 行 |
| 9個すべてに共通する非空行 | **17行** |
| その中身 | frontmatter (`---`, `model: sonnet`, `description: \|`)、見出し (`**Analysis Process:**`, `**Your Core Responsibilities:**`)、`<example>` ブロック、共通で読む `_context.md` のセクション構造 |
| 各 phase の**固有行の割合** | **45% 〜 72%**（phase8 が最も固有、phase2 が最も低い） |

**判定: 共有しているのは足場（boilerplate）であり、責務ではない。**
各 phase は「アーキテクチャ解析」「データモデル解析」「API 仕様抽出」…と、実際に異なる分析を行う。
半分以上が固有ロジックである以上、これは1つのエージェントに畳める種類の重複ではない。

### メリット（統合した場合）
- 呼び出し側が「どの phase を呼ぶか」を考えなくてよい（認知負荷の低下）
- frontmatter・見出しの定型を1箇所で保守できる
- エージェント一覧の見通しが良くなる（9行 → 1行）

### デメリット
- **独立再実行が失われる**。現行は「Phase 3 の出力だけ再生成」ができる。coordinator 設計はこれを買っている。統合すると全 phase の再実行か、内部フラグによる分岐（＝結局 9分岐）になる
- **context の肥大**。9個分の指示（合計 ~1,000行）を1エージェントが常に読む。API 解析をするときに非機能要件の指示まで読むことになり、指示の希釈が起きる
- **公開プラグインの破壊的変更**。`naoto24kawa-claude-plugins` の consumer が `spec-phase*` を直接呼んでいる場合に壊れる
- **単一障害点**。1エージェントの description が全 phase のトリガーを担うため、dispatch 精度が落ちる

### 推奨
**統合しない。** 代わりに boilerplate（frontmatter 定型・`_context.md` の構造記述・共通の見出し）を
`references/` の1ファイルに抽出し、各 phase から参照する。手元の `doc-dedup` skill が
「フォーマット複数定義の洗い出しと削減」を対象としており、まさにこの用途。

---

## 2. 候補B: `verification-documenter` + `site-explorer`（2個 → 1個）

### 共有しているのは責務か、足場か

| 指標 | site-explorer | verification-documenter |
|---|---|---|
| 規模 | 393 行 | 約 190 行 |
| 「Issue 化」への言及 | **7 箇所** | 1 箇所（※ site-explorer へ委譲する旨の記述） |
| 「探索的」への言及 | 2 箇所 | 1 箇所（※ 使い分けの記述） |
| 列挙技法（境界値・同値分割・デシジョンテーブル・ペアワイズ） | **0 箇所** | **6 箇所** |
| 出力 | `.docs/explorer-cycles/<timestamp>.md` + GitHub Issue | `.docs/verifications/<slug>/report.md` + evidence/ |
| 共通の非空行 | \-- 15行（「クリーンアップしろ」「問題を溜めて先へ進め」等の汎用原則）-- | |

**判定: 責務は補完的で、重複していない。**
- `site-explorer`: 未知のバグを**探索的に**見つけて **Issue 化**する（発散・終端は Issue）
- `verification-documenter`: 動作パターンを**網羅列挙**して実行し **資料化**する（収束・終端は資料）

この境界は description に明文化済み（「探索的に見つけて Issue 化するだけが目的なら site-explorer を使う」）。

### メリット（統合した場合）
- ブラウザ操作・クリーンアップ・認証まわりの記述（共通15行相当）を1箇所にできる
- 「どっちを呼ぶか」の判断が不要になる

### デメリット
- **mode-switch エージェントになる**。「探索モード」と「網羅モード」を内部分岐で持つことになり、
  どちらのモードも中途半端になる。両者は最適化する対象が逆（発散 vs 収束）
- **description が曖昧化し dispatch 精度が落ちる**。「探索も網羅もやる」は、トリガー条件として何も言っていない
- 393行 + 190行 で 580行超の指示になり、context の希釈が起きる
- 削減できるのは 15行の汎用原則のみ。**得られるものが小さすぎる**

### 推奨
**統合しない。** 共通15行が気になるなら、それは統合ではなく「クリーンアップ規約」の共通 reference 化で足りる。

---

## 3. 候補C: `fde`（別枠・統合ではなく欠落の指摘）

`fde` は `Write` を持ち `.docs/actions/` へ書き出すが、**ペアの skill を持たない唯一のエージェント**。
`spec-phase*` は `dev-tools:spec`、`site-explorer` は `dev-tools:site-explorer`、
`verification-documenter` は `documenting-verification` と、いずれも書き出しを統括する skill を持つ。

統合の話ではないが、「成果物を書くのに機構が無い」位置にいるため、
将来ハーネスのヒューリスティックが広がると壊れる（brain URISK-045）。

---

## 総合推奨

**統合しない。「似ている」の正体は boilerplate であって責務ではない。**

測定が示したこと:
- spec-phase の固有行は 45〜72%。共通17行は frontmatter と見出しだけ
- 検証系2つの共通行は15行で、しかも汎用原則。列挙技法は 6 対 0 で完全に分かれている

代わりに取るべき手:
1. **boilerplate の抽出**（`doc-dedup` skill の対象）— frontmatter 定型・共通セクション構造・クリーンアップ規約を `references/` へ
2. **description のトリガー境界の維持** — 既に明文化済み。ここが曖昧になると「どれを呼ぶか」問題が再発する
3. `fde` に書き出しの機構を与えるか、`.docs/actions/` への書き込みを呼び出し元へ移す

**エージェントの数を減らすことと、保守コストを下げることは別の問題。**
数を減らしても、各 phase の固有ロジック（合計 ~500行）はどこかに存在し続ける。
減らせるのは boilerplate だけであり、それは統合しなくても減らせる。

---

## 追記1: dispatch の差別化は実測で確認した（2026-07-10）

「description が衝突していないか」を実測。fresh context のサブエージェントに **description のみ**を見せ、
本文は見せずに dispatch 先を選ばせた（dispatch は description しか見ないため）。

| プロンプト | reps | 選択 | 確信度 | 曖昧だった相手 |
|---|---|---|---|---|
| 「仕様書を生成して」 | 3 | `spec-phase0-context` ×3（全一致） | high | none |
| 「動作検証して資料に残して」 | 1 | `verification-documenter` | high | none |
| 「staging を触ってバグを Issue に」 | 1 | `site-explorer` | high | none |
| 「アーキテクチャを解析して」 | 1 | `spec-phase2-architecture` | high | none |

静的には「7個の spec-phase が description の example に同じ発話 `"仕様書を生成して"` を持つ」＝危険に見えたが、
**実際の dispatch は割れなかった**。description 冒頭の `Phase 0: repository context collection` のような
役割記述が判断を支配し、example の文言は補足として扱われている。variance ゼロ（3/3 一致）。

**含意**: 統合は、今きれいに分離できている dispatch を1つの description に混ぜることになる。統合しない根拠が強化された。

**副次的発見（統合とは別問題）**: 「アーキテクチャを解析して」で `spec-phase2` が coordinator を経由せず直接選ばれた。
phase2 は `_context.md`（phase0 の出力）を prerequisite とするため、単独起動すると前提ファイルが無い可能性がある。

## 追記2: boilerplate 抽出も見送った（2026-07-10）

当初「統合の代わりに boilerplate を `references/` へ抽出する」を推奨したが、**この推奨は誤りだったので撤回する**。

理由: **skill と agent では読み込まれ方が違う。**

| 対象 | 読み込まれ方 | 抽出可否 |
|---|---|---|
| frontmatter（`---`, `model: sonnet`, description 構造） | ハーネスがファイル単位で必須ロード | ❌ 原理的に不可。共通17行の大半はこれ |
| body の規約を `references/` + 「読め」と指示 | **advisory**（読まれる保証がない） | ⚠️ 可能だが信頼性を落とす取引 |
| coordinator skill が dispatch prompt に注入 | skill はコードなので必ず含まれる | ✅ deterministic |

agent の `.md` body は**そのままシステムプロンプト**であり常に全文がロードされる。
これを `references/` に出して「読め」と指示すると、**常時ロードされる確実なテキストを、読まれるか不確実な advisory に変換する**ことになる。

同日の別作業で、まさにこの failure mode を実測した（`verification-documenter` に「マーカーで囲んで返せ」と
散文で指示したが、実行時に出力されなかった。一方 skill の手順に置いた書き出しは確実に動いた）。

**3つの独立した信号が同じ方向を指した**:
1. dispatch 実測はクリーン（差別化は機能している）
2. `doc-dedup` 自身がフォーマット重複を **🟡 低優先度**と格付け
3. 同スキルの注意書き「**情報の消失は重複より危険**」

### 決定
- **候補B（検証系2つの共通15行）: 見送り。** 削れるのは汎用原則15行のみ。加えて `verification-documenter` は個人の
  `~/.claude/agents/`、`site-explorer` はプラグイン内にあり、**別ルートなのでファイルを共有できない**。
- **候補A（spec-phase の boilerplate）: 現状維持。** 抽出可能な surface は frontmatter を除くと小さく、
  `references/` 方式は advisory 化を招く。将来 DRY 化するなら **`dev-tools:spec` coordinator が
  dispatch prompt に共通規約を注入する形**のみが信頼性を保てる。

**この重複は安い。信頼性を払って剥がすものではない。**
