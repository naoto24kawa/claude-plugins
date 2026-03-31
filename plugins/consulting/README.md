# Consulting Plugin

ソフトウェアプロダクトの開発・運営に必要な意思決定を支援する7人の専門コンサルタントエージェント。
個人開発から企業のサービス開発まで、コード外のビジネス判断で「迷い」を減らす。

## Agents

| Agent | 領域 | 個人開発での活用例 | 企業での活用例 |
|-------|------|-----------------|--------------|
| `legal-advisor` | 法務・契約 | 利用規約、OSSライセンス選定 | NDA、業務委託契約のリスク分析 |
| `pricing-strategist` | 価格・収益 | アプリの価格設定、マネタイズ選択 | SaaS料金プラン階層設計 |
| `tech-architect` | 技術選定 | ライブラリ採用判断 | モノリス vs マイクロサービス |
| `security-advisor` | セキュリティ | 個人情報管理、HTTPS設定 | GDPR/SOC2対応、監査準備 |
| `marketing-advisor` | マーケ・GTM | ゼロ予算集客、Product Hunt戦略 | GTM戦略、リードジェネレーション |
| `product-advisor` | UX・プロダクト | MVPスコープ決定 | ロードマップ設計、優先度調整 |
| `finance-advisor` | 財務・資金 | 月間コスト管理、損益分岐計算 | ROI算出、ユニットエコノミクス |

## Usage

各エージェントは自然言語で相談するだけで自動的にトリガーされる。

```
# 例
「利用規約ってどんな項目が必要?」        → legal-advisor
「月額いくらにすべき?」                  → pricing-strategist
「PostgreSQLとMongoDBどっちがいい?」     → tech-architect
「ユーザーの個人情報どう管理する?」       → security-advisor
「アプリ作ったけどどう知ってもらう?」     → marketing-advisor
「MVPどの機能まで入れる?」              → product-advisor
「インフラ費用の増額を上に説明したい」     → finance-advisor
```

## Note

legal-advisor と finance-advisor はAIアシスタントであり、資格を持つ専門家ではない。
重要な法務・財務判断は必ず有資格の専門家に相談すること。
