# Playwright実行例集

このドキュメントでは、実際のPlaywrightテストシナリオの具体例を紹介します。

## 目次

1. [例1: ECサイトの購入フロー検証](#例1-ecサイトの購入フロー検証)
2. [例2: ログイン機能とセッション管理の検証](#例2-ログイン機能とセッション管理の検証)
3. [例3: SPAのルーティング検証](#例3-spaのルーティング検証)
4. [例4: フォームバリデーション検証](#例4-フォームバリデーション検証)
5. [例5: レスポンシブデザイン検証](#例5-レスポンシブデザイン検証)
6. [使用時の注意点](#使用時の注意点)

---

## 例1: ECサイトの購入フロー検証

### シナリオ

ユーザーが商品を選択し、カートに追加して、購入を完了するまでのフローを検証

### 実行ステップ

```typescript
// 1. トップページへ移動
browser_navigate({ url: "https://example-shop.com" })
browser_take_screenshot({ name: "01-top-page.png" })

// 2. 商品を検索
browser_type({ selector: "input#search", text: "Tシャツ" })
browser_press_key({ key: "Enter" })
browser_wait_for({ selector: ".product-list", state: "visible" })
browser_take_screenshot({ name: "02-search-results.png" })

// 3. 商品詳細ページへ移動
browser_click({ selector: ".product-item:first-child" })
browser_wait_for({ selector: ".product-detail", state: "visible" })
browser_take_screenshot({ name: "03-product-detail.png" })

// 4. サイズとカラーを選択
browser_select_option({ selector: "select#size", value: "M" })
browser_click({ selector: ".color-option[data-color='blue']" })

// 5. カートに追加
browser_click({ selector: "button#add-to-cart" })
browser_wait_for({ selector: ".cart-notification", state: "visible" })
browser_take_screenshot({ name: "04-added-to-cart.png" })

// 6. カートを表示
browser_click({ selector: ".cart-icon" })
browser_wait_for({ selector: ".cart-items", state: "visible" })
browser_take_screenshot({ name: "05-cart-page.png" })

// 7. 購入手続きへ
browser_click({ selector: "button#checkout" })
browser_wait_for({ selector: ".checkout-form", state: "visible" })

// 8. 配送先情報を入力
browser_fill_form({
  formData: {
    "input#name": "山田太郎",
    "input#email": "yamada@example.com",
    "input#phone": "090-1234-5678",
    "input#postal-code": "100-0001",
    "input#address": "東京都千代田区千代田1-1",
  }
})
browser_take_screenshot({ name: "06-checkout-form.png" })

// 9. 支払い方法を選択
browser_click({ selector: "input#payment-credit" })
browser_type({ selector: "input#card-number", text: "4111111111111111" })
browser_type({ selector: "input#card-expiry", text: "12/25" })
browser_type({ selector: "input#card-cvv", text: "123" })

// 10. 注文確認
browser_click({ selector: "button#confirm-order" })
browser_wait_for({ selector: ".order-complete", state: "visible", timeout: 30000 })
browser_take_screenshot({ name: "07-order-complete.png" })

// 11. 検証
const orderNumber = browser_evaluate({
  script: "return document.querySelector('.order-number').textContent"
})
console.log(`注文番号: ${orderNumber}`)

// 12. コンソールとネットワークログを確認
const consoleLogs = browser_console_messages()
const networkRequests = browser_network_requests()

// エラーがないことを確認
const errors = consoleLogs.filter(log => log.type === 'error')
if (errors.length > 0) {
  console.log('エラーが検出されました:', errors)
}

// 決済APIの呼び出しを確認
const paymentRequests = networkRequests.filter(req =>
  req.url.includes('/api/payment')
)
console.log('決済APIリクエスト:', paymentRequests)

browser_close()
```

### 期待する結果

- ✓ すべてのページが正常に読み込まれる
- ✓ 商品がカートに追加される
- ✓ 注文が正常に完了する
- ✓ 注文番号が表示される
- ✓ コンソールエラーが発生しない
- ✓ 決済APIが正常に呼び出される

## 例2: ログイン機能とセッション管理の検証

### シナリオ

ログイン機能が正常に動作し、セッションが維持されることを確認

### 実行ステップ

```typescript
// 1. ログインページへ移動
browser_navigate({ url: "https://example.com/login" })
browser_take_screenshot({ name: "01-login-page.png" })

// 2. ログイン試行（不正な認証情報）
browser_type({ selector: "input#email", text: "invalid@example.com" })
browser_type({ selector: "input#password", text: "wrongpassword" })
browser_click({ selector: "button#login" })
browser_wait_for({ selector: ".error-message", state: "visible" })
browser_take_screenshot({ name: "02-login-error.png" })

// エラーメッセージを確認
const errorMessage = browser_evaluate({
  script: "return document.querySelector('.error-message').textContent"
})
console.log('エラーメッセージ:', errorMessage)

// 3. ログイン試行（正しい認証情報）
browser_type({ selector: "input#email", text: "user@example.com" })
browser_type({ selector: "input#password", text: "correctpassword" })
browser_click({ selector: "button#login" })
browser_wait_for({ selector: ".dashboard", state: "visible" })
browser_take_screenshot({ name: "03-dashboard.png" })

// 4. セッション情報を確認
const sessionData = browser_evaluate({
  script: `
    return {
      cookies: document.cookie,
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    };
  `
})
console.log('セッション情報:', sessionData)

// 5. 認証が必要なページへアクセス
browser_navigate({ url: "https://example.com/profile" })
browser_wait_for({ selector: ".profile-content", state: "visible" })
browser_take_screenshot({ name: "04-profile-page.png" })

// セッションが維持されていることを確認
const isLoggedIn = browser_evaluate({
  script: "return document.querySelector('.logout-button') !== null"
})
console.log('ログイン状態:', isLoggedIn ? 'ログイン中' : 'ログアウト')

// 6. 別タブで同じサイトを開く
browser_tab_new({ url: "https://example.com/dashboard" })
browser_wait_for({ selector: ".dashboard", state: "visible" })
browser_take_screenshot({ name: "05-new-tab-dashboard.png" })

// 新しいタブでもログイン状態が維持されていることを確認
const isLoggedInNewTab = browser_evaluate({
  script: "return document.querySelector('.user-menu') !== null"
})
console.log('新しいタブのログイン状態:', isLoggedInNewTab)

// 7. ログアウト
const tabs = browser_tab_list()
browser_tab_select({ tabId: tabs[0].id })  // 最初のタブに戻る
browser_click({ selector: "button.logout" })
browser_wait_for({ selector: ".login-form", state: "visible" })
browser_take_screenshot({ name: "06-logged-out.png" })

// 8. ログアウト後にプロテクトされたページへアクセス
browser_navigate({ url: "https://example.com/profile" })
browser_wait_for({ selector: ".login-form", state: "visible" })
browser_take_screenshot({ name: "07-redirect-to-login.png" })

// ログインページにリダイレクトされることを確認
const currentUrl = browser_evaluate({
  script: "return window.location.href"
})
console.log('リダイレクト後のURL:', currentUrl)

browser_close()
```

### 期待する結果

- ✓ 不正な認証情報でログイン失敗する
- ✓ 正しい認証情報でログイン成功する
- ✓ セッションが維持される
- ✓ 別タブでもログイン状態が維持される
- ✓ ログアウトが正常に動作する
- ✓ ログアウト後はログインページにリダイレクトされる

## 例3: SPAのルーティング検証

### シナリオ

React/VueなどのSPAアプリケーションのクライアントサイドルーティングを検証

### 実行ステップ

```typescript
// 1. SPAのルートページへ移動
browser_navigate({ url: "https://spa-example.com" })
browser_wait_for({ selector: "#app", state: "visible" })
browser_take_screenshot({ name: "01-home-page.png" })

// 2. ナビゲーションリンクをクリック
browser_click({ selector: "a[href='/about']" })
browser_wait_for({ selector: ".about-content", state: "visible" })

// URLが変更されたことを確認（ページリロードなし）
const currentPath = browser_evaluate({
  script: "return window.location.pathname"
})
console.log('現在のパス:', currentPath)  // /about
browser_take_screenshot({ name: "02-about-page.png" })

// 3. 別のページへ移動
browser_click({ selector: "a[href='/products']" })
browser_wait_for({ selector: ".product-list", state: "visible" })
browser_take_screenshot({ name: "03-products-page.png" })

// 4. ブラウザの戻るボタン
browser_navigate_back()
browser_wait_for({ selector: ".about-content", state: "visible" })
browser_take_screenshot({ name: "04-back-to-about.png" })

// パスが戻ったことを確認
const backPath = browser_evaluate({
  script: "return window.location.pathname"
})
console.log('戻るボタン後のパス:', backPath)  // /about

// 5. ブラウザの進むボタン
browser_navigate_forward()
browser_wait_for({ selector: ".product-list", state: "visible" })
browser_take_screenshot({ name: "05-forward-to-products.png" })

// 6. 動的ルート（パラメータ付き）
browser_click({ selector: ".product-item:first-child a" })
browser_wait_for({ selector: ".product-detail", state: "visible" })

const productId = browser_evaluate({
  script: "return window.location.pathname.split('/').pop()"
})
console.log('商品ID:', productId)
browser_take_screenshot({ name: "06-product-detail.png" })

// 7. 404ページの検証
browser_navigate({ url: "https://spa-example.com/invalid-page" })
browser_wait_for({ selector: ".not-found", state: "visible" })
browser_take_screenshot({ name: "07-404-page.png" })

// 8. コンソールエラーがないことを確認
const consoleLogs = browser_console_messages()
const errors = consoleLogs.filter(log => log.type === 'error')
console.log('コンソールエラー数:', errors.length)

// 9. ルーティング時のネットワークリクエスト確認
const networkRequests = browser_network_requests()
const htmlRequests = networkRequests.filter(req => req.type === 'document')
console.log('HTMLリクエスト数:', htmlRequests.length)  // 初回の1回のみであることを確認

browser_close()
```

### 期待する結果

- ✓ クライアントサイドルーティングが動作する
- ✓ ページリロードなしで画面遷移する
- ✓ ブラウザの戻る/進むボタンが機能する
- ✓ 動的ルート（パラメータ）が正しく処理される
- ✓ 404ページが表示される
- ✓ コンソールエラーが発生しない

## 例4: フォームバリデーション検証

### シナリオ

入力フォームのバリデーションが正しく動作することを確認

### 実行ステップ

```typescript
// 1. フォームページへ移動
browser_navigate({ url: "https://example.com/contact" })
browser_take_screenshot({ name: "01-contact-form.png" })

// 2. 空のフォームを送信（バリデーションエラー）
browser_click({ selector: "button#submit" })
browser_wait_for({ selector: ".validation-error", state: "visible" })
browser_take_screenshot({ name: "02-validation-errors.png" })

// エラーメッセージを取得
const errors = browser_evaluate({
  script: `
    return Array.from(document.querySelectorAll('.validation-error'))
      .map(el => el.textContent);
  `
})
console.log('バリデーションエラー:', errors)

// 3. 不正なメールアドレスを入力
browser_type({ selector: "input#email", text: "invalid-email" })
browser_click({ selector: "button#submit" })
browser_wait_for({ selector: ".email-error", state: "visible" })
browser_take_screenshot({ name: "03-email-validation-error.png" })

// 4. 正しい形式で入力
browser_evaluate({
  script: "document.querySelector('input#email').value = ''"
})
browser_type({ selector: "input#email", text: "user@example.com" })
browser_type({ selector: "input#name", text: "山田太郎" })
browser_type({ selector: "textarea#message", text: "お問い合わせ内容" })

// リアルタイムバリデーションの確認
browser_wait_for({ selector: ".email-error", state: "hidden" })
browser_take_screenshot({ name: "04-valid-input.png" })

// 5. フォーム送信
browser_click({ selector: "button#submit" })
browser_wait_for({ selector: ".success-message", state: "visible" })
browser_take_screenshot({ name: "05-form-submitted.png" })

// 送信されたデータを確認
const networkRequests = browser_network_requests()
const postRequest = networkRequests.find(req =>
  req.method === 'POST' && req.url.includes('/api/contact')
)
console.log('送信されたデータ:', postRequest.body)

browser_close()
```

### 期待する結果

- ✓ 空のフォーム送信でバリデーションエラーが表示される
- ✓ 不正なメールアドレスでエラーが表示される
- ✓ リアルタイムバリデーションが動作する
- ✓ 正しい入力でフォームが送信される
- ✓ 送信後に成功メッセージが表示される

## 例5: レスポンシブデザイン検証

### シナリオ

各デバイスサイズでレイアウトとインタラクションが正しく動作することを確認

### 実行ステップ

```typescript
const testResponsive = async (device) => {
  console.log(`Testing device: ${device.name}`)

  // デバイスサイズに変更
  browser_resize({ width: device.width, height: device.height })

  // ページ読み込み
  browser_navigate({ url: "https://example.com" })
  browser_take_screenshot({ name: `${device.name}-home.png` })

  // ナビゲーションメニューの確認
  if (device.mobile) {
    // モバイル: ハンバーガーメニューをクリック
    browser_click({ selector: ".hamburger-menu" })
    browser_wait_for({ selector: ".mobile-nav", state: "visible" })
    browser_take_screenshot({ name: `${device.name}-menu-open.png` })
  } else {
    // デスクトップ: ナビゲーションメニューが常に表示
    browser_wait_for({ selector: ".desktop-nav", state: "visible" })
  }

  // フォーム入力テスト
  browser_navigate({ url: "https://example.com/contact" })
  browser_type({ selector: "input#email", text: "test@example.com" })
  browser_take_screenshot({ name: `${device.name}-form.png` })

  // レイアウトの検証
  const layout = browser_evaluate({
    script: `
      const container = document.querySelector('.container');
      return {
        width: container.offsetWidth,
        display: window.getComputedStyle(container).display
      };
    `
  })
  console.log(`${device.name} layout:`, layout)
}

// テスト対象デバイス
const devices = [
  { name: "mobile", width: 375, height: 667, mobile: true },
  { name: "tablet", width: 768, height: 1024, mobile: false },
  { name: "desktop", width: 1920, height: 1080, mobile: false }
]

// 各デバイスでテスト実行
for (const device of devices) {
  await testResponsive(device)
}

browser_close()
```

### 期待する結果

- ✓ 各デバイスサイズで適切なレイアウトが表示される
- ✓ モバイルでハンバーガーメニューが機能する
- ✓ デスクトップでナビゲーションメニューが常に表示される
- ✓ フォーム入力が各デバイスで正常に動作する

## 使用時の注意点

### タイムアウトの調整

- ネットワーク状況に応じてタイムアウト時間を調整
- 動的コンテンツは長めのタイムアウトを設定

### エラーハンドリング

- 各ステップでエラーチェックを実施
- エラー発生時はスクリーンショットとログを取得

### テストデータ

- 本番環境では実際のデータを使用しない
- テスト専用のアカウントとデータを使用

### パフォーマンス

- 不要なスクリーンショット取得を避ける
- ネットワークログは必要な時のみ取得

これらの例を参考に、プロジェクト固有のテストシナリオを作成してください。
