# Site Explorer Config

<!-- このファイルをプロジェクトルートに .site-explorer.md として配置してください -->
<!-- Git 管理可。認証情報は .env に分離してください -->

## App Overview
このアプリが何をするサービスか（1〜3行）

## Environments

| URL | API Base URL |
|-----|-------------|
| https://staging.example.com | https://api-stg.example.com |
| https://app.example.com     | https://api.example.com     |

<!-- 1環境のみの場合は以下の形式でも可 -->
<!-- Entry URL: https://staging.example.com -->
<!-- API Base URL: https://api-stg.example.com -->

## Auth Method
email/password ログイン（/login ページ）

## Auth Restrictions
- production URL (app.example.com) では Turnstile CAPTCHA がバイパス不可のためログイン試行をスキップする

## Key Flows
- メインオブジェクトの作成 → 一覧確認 → 編集 → 削除
- 設定変更

## Cleanup Method
設定ページ → アカウント削除

## Notes
- その他特記事項（CAPTCHA 手順・特殊なナビゲーションなど）

---

## .env に追加するキー（**Git 管理外・`.gitignore` 必須**）

```
SITE_EXPLORER_EMAIL=test@example.com
SITE_EXPLORER_PASSWORD=YourPassword123!
SITE_EXPLORER_TURNSTILE_BYPASS_TOKEN=  # 任意: CAPTCHA バイパストークン（staging 等）
```
