# 動作検証エージェント設計の外部調査（2026-07-09 実施）

`verification-documenter` エージェントおよび `documenting-verification` skill の設計根拠。
3本の並行調査（テスト設計技法 / エビデンス管理 / AI エージェントによる検証の先行事例）の結果と、採否の判断。

**注意**: 各調査はサブエージェントが WebSearch/WebFetch で収集した。「未確認」と記した項目は一次情報に到達できなかったか、二次情報からの推定。

---

## 1. 動作パターン列挙の技法

既存採用済み（調査対象外）: 同値分割 / 境界値分析 / 状態遷移テスト / デシジョンテーブル / エラー推測・異常系

| 技法 | 何を防げるか | 採否 | 出典 |
|---|---|---|---|
| ペアワイズ（オールペア法） | 多因子の相互作用バグ。組み合わせ爆発を避けつつ2因子間の穴を埋める | **採用** — 既存は単一要因の網羅止まり。agent 自身が「複合パターンは抜けやすい」と自認しながら道具が無かった | JSTQB ALTA シラバス https://jstqb.jp/dl/jstqb.jpdlJSTQB-SyllabusALTA_V311.J03.pdf |
| CRUD マトリクス | エンティティ×操作の実装漏れ・データ不整合 | **採用** — 既存はデータライフサイクル観点が皆無 | https://e-words.jp/w/CRUD%E5%9B%B3.html / JSTQB Advanced TA V4.0 https://www.jstqb.jp/wordpress/wp-content/uploads/2026/06/JSTQB-Syllabus.Advanced_TA_VersionV4.0.J01.pdf |
| ユースケース/シナリオテスト | 単機能では見えない画面間・機能間の不整合 | **採用** — 既存は単機能内の網羅のみ | https://www.qbook.jp/column/722.html |
| 直交表 | ペアワイズの統計的均衡版（全組み合わせが均等回数出現） | 見送り（ペアワイズで代替可） | JSTQB ALTA シラバス |
| クラシフィケーションツリー法 | 入力空間をツリーで可視化 | 見送り（組み合わせはペアワイズで足りる） | https://en.wikipedia.org/wiki/Classification_Tree_Method / https://www.razorcat.com/en/product-cte.html |
| モデルベーステスト (GraphWalker) | モデルからのケース自動生成 | 見送り（導入コスト高・YAGNI） | https://context7.com/graphwalker/graphwalker-project / https://techplay.jp/column/1838 |
| 探索的テスト | 機械的網羅の限界を人間側で補う | 別エージェント（`site-explorer`）の役割として分離済み | JSTQB Foundation シラバス |

**採用した3技法の共通点**: いずれも「単一入力の網羅」では原理的に届かない領域を埋める（多因子の交互作用 / データの時間的整合性 / 機能間の連結）。

## 2. 実装・画面からの機械的導出

ユーザー要求「実装や画面からすべての動作パターンを考えられるように」に直結する部分。

- **制御フローグラフ / 分岐網羅**: 実装コードの条件分岐を列挙してケース起点にする（ステートメント / デシジョン / パスカバレッジ）
  - https://ja.wikipedia.org/wiki/%E5%88%B6%E5%BE%A1%E3%83%95%E3%83%AD%E3%83%BC%E3%82%B0%E3%83%A9%E3%83%95
  - https://www.istqb.guru/how-to-calculate-statement-branchdecision-and-path-coverage-for-istqb-exam-purpose/
- **N スイッチカバレッジ（0/1/n）**: 画面遷移を「事前状態→トリガー→事後状態」の連鎖として段階的に網羅度を上げる
  - https://note.com/yumotsuyo/n/nd3099b40dc1f
- **OpenAPI スキーマからの導出（Schemathesis 等のプロパティベーステスト）**: 型・制約定義から入力パターンを機械的に生成
  - https://qiita.com/taikidanbara/items/20d1047d40f814f03619
  - https://dev.classmethod.jp/articles/schemathesis-openapi-pbt/

**設計への反映**: この3つを「三方向導出」（コード / 画面 / スキーマから独立に列挙し突き合わせる）として Phase 1-a に統合した。片側にしか無い項目が網羅の穴 or 実装バグとして機械的に落ちる。

## 3. 網羅の「限界の測り方」（終了基準）

- **コードカバレッジ 100% でも仕様漏れ（未実装の分岐）は検出不可** — https://glossary.istqb.org/en/term/code-coverage
- **リスクベースドテストの終了基準**: 全網羅でなく「発生確率×影響度」で深さを絞り、"リスクが軽減された" を終了条件にする
  - https://www.docswell.com/s/makotookano/5YD8V4-2024-12-20-113402
  - https://hackerslab.aktsk.jp/2024/12/06/120000
- **要求カバレッジ / トレーサビリティマトリクス**: 要求↔ケース対応で「仕様に対する漏れ」を見る（**未確認** — 一次情報未特定、JSTQB 一般記述からの推定）

## 4. エビデンス・検証資料の管理

- **IEEE 829 の3層**: Test Log（時系列の実行記録）/ Anomaly Report（期待・実際・証拠）/ Summary Report。`report.md` 1枚はこの圧縮版として妥当
  - https://en.wikipedia.org/wiki/Software_test_documentation
  - https://zetcode.com/terms-testing/ieee-829/
- **実行メタデータの標準項目**: 実行ID・ケースID・開始/終了時刻・実行者・環境（OS/ブラウザ/ビルド版）・再試行回数 — https://yrkan.com/blog/test-execution-log/
- **再現性の3要素**: 環境固定（Docker等）/ コミットハッシュ記録 / データ・シードのバージョン管理 — https://mlops-coding-course.fmind.dev/7.0.%20Reproducibility.html
- **非決定性(flaky)**: 順序依存/非依存で性質が異なり完全再現は困難。「再現率」を記録し断定を避ける — https://dl.acm.org/doi/fullHtml/10.1145/3476105
- **エビデンスの強弱設計**: 全ケース一律フルエビデンスは Lean 文脈で holding cost の無駄。fail / 境界値を厚く、happy path は簡略 — https://aqua-cloud.io/lean-software-testing-principles-implementation/ （※コストを定量化した一次資料は見つからず、Lean 文脈からの類推＝**未確認**）
- **スクショの信頼性**: URL・タイムスタンプの付帯が要。命名は小文字ハイフン区切り
  - https://siftfeed.com/guides/screenshot-evidence-standards
  - https://shawnyoung.com/journal/2020-04-19-image-file-naming-conventions.php
- **秘密の混入防止**: pre-commit の gitleaks/TruffleHog が実務標準（`--no-verify` 回避のため CI で二段構え）— https://trufflesecurity.com/blog/do-pre-commit-hooks-prevent-secrets-leakage
- **Git LFS**: バイナリは差分蓄積で肥大化。目安10MB超/頻繁更新で LFS 退避 — https://www.git-tower.com/learn/git/faq/handling-large-files-with-lfs → **見送り（YAGNI、閾値超過時の移行先を一言残すのみ）**
  - 視覚回帰系の Git直置き / LFS / 外部ストレージのトレードオフ — https://oneuptime.com/blog/post/2026-01-24-visual-regression-testing/view
- **JUnit XML / Allure / TestRail**: XML は CI ゲート用の機械可読、Allure は人間向けダッシュボード。少数ケース・人間承認向けの Markdown 手書きは維持でよい → **見送り**
  - https://ankurm.com/junit-6-test-reporting/
  - https://support.testrail.com/hc/en-us/articles/12989737200276
- ※ ISO/IEC/IEEE 29119-3 の記録項目テンプレート原文は有償（IEEE Xplore）のため一次確認できず（**未確認**）

## 5. AI エージェントに検証させる先行事例と失敗モード

### 実例（Claude Code + Playwright MCP）
- ZOZO https://techblog.zozo.com/entry/claude-code-with-playwright-cli
- GMO 次世代システム研究室 https://recruit.group.gmo/engineer/jisedai/blog/claude-code-playwright-e2e-test-automation
- kickflow https://tech.kickflow.co.jp/entry/2026/04/03/113600 （900件の flaky / spec-change 分類を自動化）
- Yappli https://tech.yappli.io/entry/create-e2e-test-with-claude-code （**テストケース診断＝人間承認あり / テスト生成＝完全自動** の2段階設計。モデル使い分け）
- エムスリー https://m3tech.blog/entry/2026/04/20/090035 （実行時間 105分 → 27分）
- kubell https://creators-note.chatwork.com/entry/subagent_for_qa （実装 / QA の役割分離）
- OSS: browser-use/qa-use https://github.com/browser-use/qa-use / browserbase/stagehand https://github.com/browserbase/stagehand （「サイト変更時のみ AI 推論、それ以外はキャッシュ」）

### 失敗モード（設計の中核根拠）
- **false success（偽の成功）**: arXiv 2606.09863 — tau2-bench で失敗の **45〜48% が「自然言語の完了宣言と環境状態の不一致」**。LLM ジャッジより軽量な TF-IDF 検出器の方が有効と結論
- Anthropic 公式 https://anthropic.com/engineering/effective-harnesses-for-long-running-agents — 「単体テストは実行するが E2E 検証を怠り未完成機能を完了と誤認」
- **自己採点バイアス**: arXiv 2509.26072 "Silent Judge" — LLM 審査者は新しさ・権威性に暗黙に誘導され、その偏りが理由付けの文面に一切現れない（＝説明が自然に読めることは正しさの証拠にならない）
- **reward hacking**: SpecBench (arXiv 2605.21384) / Reward Hacking Benchmark (arXiv 2605.02964) — 簡易な環境的安全策で搾取率 88% 削減
- **非決定性**: temperature=0 でもサーバー側バッチングの数値誤差で発生 (arXiv 2408.04667)。`--json-schema` で判定を構造化して揺れを吸収する実践 https://alexop.dev/posts/automated-qa-claude-code-agent-browser-cli-github-actions
- **コンテキスト溢れ**: https://anthropic.com/engineering/effective-context-engineering-for-ai-agents

### 人間が信頼するための仕組み
- Anthropic 公式ベストプラクティス https://code.claude.com/docs/en/best-practices — 「証拠を示させる（テスト出力 / 実行コマンド / スクショ）」「adversarial review step（fresh subagent に実装過程を見せず判定させる）」「Stop hook での決定論的ゲート」
- Software Delegation Contracts (arXiv 2606.17099) — 「契約は正確性でなく**レビュー可能性**を買う」（evidence sufficiency +0.83, p<0.0001）

### 商用ツールの設計思想
- Momentic https://momentic.ai/blog/how-agentic-testing-works — ロケータキャッシュ + ミス時のみ再解決
- **QA Wolf — AI による修正は毎回人間承認必須**
- mabl / Applitools — 単一セレクタでなく多信号フュージョンで非決定性を吸収

### 既存 CLAUDE.md との関係
「完了ゲート」「偽成功シグナル」「採点者分離」は本調査で見つかった最良実践とほぼ一致（**上位互換で実装済み**）→ 追加不要と判断。
※ LINEヤフーの「作業時間50%削減」は自社目標値で第三者検証なし（**未確認**）。

---

## 設計への反映まとめ

**採用（A: 列挙技法）**: ペアワイズ / CRUD マトリクス / シナリオテスト / 三方向導出（機械的導出）/ リスクベース終了基準・未到達分岐

**採用（B: 資料・再現性）**: コミットハッシュ + 実行環境の必須メタ化 / flaky の再現率 / evidence の秘密マスキング / 命名規約と強弱設計

**見送り（YAGNI）**: Git LFS / JUnit XML・Allure 併用 / モデルベーステスト / 直交表 / クラシフィケーションツリー / JSON schema 判定固定

## 調査の後、実運用で判明したこと（調査外・実測）

- サブエージェントは `Write` でレポートファイルを書けない（ハーネスがブロック）。責務分割で解決 → brain URISK-045。
- **散文の contract は発火しないことがある**。修正後のエージェントに「マーカーで囲んで返せ」と指示したが、実行時にマーカーは出力されなかった。
  一方、書き出しを skill 側の機構に置いた部分は確実に動いた。**advisory と deterministic の差が実測で出た**（この skill の存在理由）。
