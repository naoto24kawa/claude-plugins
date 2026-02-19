# Playwright-core API Quick Reference

E2E スクリプト生成時に参照する Playwright API のリファレンス。
全 API は `page` オブジェクト経由で呼び出す。

## Navigation

```javascript
// URL に遷移
await page.goto('http://localhost:23000/', {
  waitUntil: 'domcontentloaded',  // 'load' | 'domcontentloaded' | 'networkidle'
  timeout: 15000,
});

// リロード
await page.reload();

// 戻る / 進む
await page.goBack();
await page.goForward();
```

## Click / Interaction

```javascript
// クリック
await page.click('.button');
await page.click('text=Submit');        // テキストで指定
await page.click('[data-testid="btn"]'); // data-testid で指定

// ダブルクリック
await page.dblclick('.item');

// ホバー
await page.hover('.menu-trigger');

// チェックボックス
await page.check('#agree');
await page.uncheck('#newsletter');
```

## Input

```javascript
// テキスト入力(既存値をクリアして入力)
await page.fill('#username', 'testuser');
await page.fill('#password', 'secret123');

// 1文字ずつタイプ(遅延入力が必要な場合)
await page.type('#search', 'keyword', { delay: 100 });

// ドロップダウン選択
await page.selectOption('#role', 'admin');
await page.selectOption('#color', { label: 'Blue' });

// ファイルアップロード
await page.setInputFiles('#file-input', '/tmp/test.png');
```

## Wait

```javascript
// セレクタが表示されるまで待機
await page.waitForSelector('.result-list');
await page.waitForSelector('.loading', { state: 'hidden' }); // 消えるまで待機

// 固定時間待機(非同期コンテンツ用)
await page.waitForTimeout(3000); // 3秒

// URL 変化を待機
await page.waitForURL('**/dashboard');
await page.waitForURL(/\/result\/\d+/);

// ページ読み込み状態を待機
await page.waitForLoadState('networkidle');

// レスポンス待機(API 呼び出し完了を検出)
await page.waitForResponse(resp =>
  resp.url().includes('/api/data') && resp.status() === 200
);
```

## Query / Extract

```javascript
// ページタイトル
const title = await page.title();

// テキスト取得
const text = await page.textContent('.message');
const innerText = await page.innerText('.content');

// HTML 取得
const html = await page.innerHTML('.container');

// 属性値取得
const href = await page.getAttribute('a.link', 'href');

// 要素数カウント
const count = await page.locator('.item').count();

// 複数要素のテキスト一括取得
const texts = await page.locator('.item').allTextContents();

// JavaScript 実行(DOM 直接操作)
const result = await page.evaluate(() => {
  return document.querySelector('.app').dataset.version;
});
```

## Assert / Check

```javascript
// 表示確認
const visible = await page.isVisible('.dialog');

// 有効/無効確認
const enabled = await page.isEnabled('#submit-btn');

// チェック状態確認
const checked = await page.isChecked('#agree');

// テキスト内容の検証(console.log で出力)
const text = await page.textContent('.status');
console.log(`Status: ${text}`);
// スクリプト内で assert する場合:
if (!text.includes('Success')) {
  throw new Error(`Expected "Success" but got "${text}"`);
}
```

## Screenshot

```javascript
// ページ全体のスクリーンショット
await page.screenshot({ path: '/tmp/result.png' });

// フルページ(スクロール含む)
await page.screenshot({ path: '/tmp/full.png', fullPage: true });

// 特定要素のみ
await page.locator('.card').screenshot({ path: '/tmp/card.png' });

// クリップ(座標指定)
await page.screenshot({
  path: '/tmp/area.png',
  clip: { x: 0, y: 0, width: 800, height: 600 },
});
```

## Keyboard / Mouse

```javascript
// キー入力
await page.keyboard.press('Enter');
await page.keyboard.press('Control+a');
await page.keyboard.press('Escape');

// マウスクリック(座標指定)
await page.mouse.click(100, 200);

// ドラッグ
await page.mouse.move(100, 200);
await page.mouse.down();
await page.mouse.move(300, 400);
await page.mouse.up();
```

## Locator (推奨パターン)

```javascript
// Locator は再利用可能で自動待機する
const card = page.locator('.notification-card').first();
await card.click();
const text = await card.textContent();

// nth 要素
const thirdItem = page.locator('.item').nth(2);

// フィルタ
const activeItem = page.locator('.item').filter({ hasText: 'Active' });

// チェーン
const button = page.locator('.dialog').locator('button.confirm');
await button.click();
```

## よくある E2E パターン

### パターン 1: ページ遷移 + 結果確認

```javascript
await page.goto('http://localhost:23000/');
await page.click('a[href="/settings"]');
await page.waitForURL('**/settings');
const title = await page.title();
console.log(`Navigated to: ${title}`);
await page.screenshot({ path: '/tmp/settings.png' });
```

### パターン 2: フォーム入力 + 送信

```javascript
await page.goto('http://localhost:23000/form');
await page.fill('#name', 'Test User');
await page.selectOption('#role', 'admin');
await page.click('#submit');
await page.waitForSelector('.success-message');
await page.screenshot({ path: '/tmp/form-result.png' });
```

### パターン 3: リスト操作 + 詳細表示

```javascript
await page.goto('http://localhost:23000/');
await page.waitForSelector('.notification-card');
const count = await page.locator('.notification-card').count();
console.log(`Found ${count} notifications`);
await page.locator('.notification-card').first().click();
await page.waitForSelector('.detail-view');
await page.screenshot({ path: '/tmp/detail.png' });
```

### パターン 4: 非同期データ待機

```javascript
await page.goto('http://localhost:23000/');
// SSE 接続確立 + データ受信を待機
await page.waitForSelector('.connected-badge');
await page.waitForTimeout(5000); // 追加データ受信待ち
await page.screenshot({ path: '/tmp/with-data.png' });
```
