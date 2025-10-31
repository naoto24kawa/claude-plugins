# Playwrightデバッグガイド

このガイドでは、Playwrightテスト実行中に発生する問題のデバッグ方法とトラブルシューティング手法を説明します。

## 目次

1. [デバッグツールの活用](#デバッグツールの活用)
   - コンソールログの監視
   - ネットワークリクエストの分析
   - スクリーンショットによる視覚的デバッグ
   - DOM構造の確認
2. [よくある問題とその解決方法](#よくある問題とその解決方法)
   - 要素が見つからない
   - タイムアウトエラー
   - クリックが機能しない
   - 入力が反映されない
   - 認証エラー
   - ダイアログ/モーダルが表示されない
3. [デバッグワークフロー](#デバッグワークフロー)
4. [ログ分析のベストプラクティス](#ログ分析のベストプラクティス)
5. [トラブルシューティングチェックリスト](#トラブルシューティングチェックリスト)

---

## デバッグツールの活用

### 1. コンソールログの監視

#### すべてのログを取得

```typescript
// テスト開始前にコンソール監視を開始
browser_console_messages()

// 結果の分析
// - error: 重大なエラー、修正必須
// - warning: 警告、確認推奨
// - info: 情報ログ
// - debug: デバッグ情報
```

#### エラーログのフィルタリング

コンソールログから特定のパターンを検索：
- CORS エラー
- 404 Not Found
- Uncaught Exception
- Promise rejection

### 2. ネットワークリクエストの分析

```typescript
browser_network_requests()

// 確認項目:
// - ステータスコード（200, 404, 500など）
// - レスポンスタイム（パフォーマンス問題の検出）
// - リクエストヘッダー（認証トークンの確認）
// - リクエストボディ（送信データの検証）
// - レスポンスボディ（返却データの確認）
```

### 3. スクリーンショットによる視覚的デバッグ

```typescript
// 問題発生時の画面状態を記録
browser_take_screenshot({
  name: "error-state.png",
  fullPage: true
})

// 各ステップでの状態変化を追跡
browser_take_screenshot({ name: "step-1-before.png" })
// 操作実行
browser_take_screenshot({ name: "step-1-after.png" })
```

### 4. DOM構造の確認

```typescript
// 現在のHTML構造を取得
browser_snapshot()

// 特定の要素の存在確認
browser_evaluate({
  script: "return document.querySelector('.target-element') !== null"
})

// 要素の属性値を取得
browser_evaluate({
  script: "return document.querySelector('#element').getAttribute('data-value')"
})
```

## よくある問題とその解決方法

### 問題1: 要素が見つからない（Element Not Found）

#### 原因

- セレクタが間違っている
- 要素がまだロードされていない
- 要素が動的に生成される
- iframeの中にある

#### 解決策

```typescript
// 1. 要素の出現を待機
browser_wait_for({
  selector: ".target-element",
  state: "visible",
  timeout: 30000
})

// 2. セレクタの確認
browser_evaluate({
  script: "return Array.from(document.querySelectorAll('*')).map(el => el.className).filter(c => c)"
})

// 3. iframe内の要素の場合
// まずiframeに切り替えてから操作
browser_evaluate({
  script: `
    const iframe = document.querySelector('iframe');
    return iframe.contentDocument.querySelector('.target');
  `
})
```

### 問題2: タイムアウトエラー

#### 原因

- ページ読み込みが遅い
- ネットワーク遅延
- 無限ローディング
- JavaScriptエラーで処理が止まっている

#### 解決策

```typescript
// 1. タイムアウト時間を延長
browser_wait_for({
  selector: ".slow-element",
  timeout: 60000  // 60秒に延長
})

// 2. ネットワークアイドルを待機
browser_wait_for({
  event: "networkidle",
  timeout: 30000
})

// 3. カスタム条件で待機
browser_evaluate({
  script: `
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (window.dataLoaded) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  `
})

// 4. エラーの詳細を記録
browser_console_messages()  // JavaScriptエラーを確認
browser_network_requests()  // ネットワークの問題を確認
browser_take_screenshot({ name: "timeout-state.png" })
```

### 問題3: クリックが機能しない

#### 原因

- 要素が他の要素に覆われている
- 要素が無効化されている
- アニメーション中
- イベントリスナーが設定されていない

#### 解決策

```typescript
// 1. 要素がクリック可能になるまで待機
browser_wait_for({
  selector: "button#submit",
  state: "visible"
})

// 2. スクロールして要素を表示
browser_evaluate({
  script: "document.querySelector('button#submit').scrollIntoView()"
})

// 3. JavaScriptで直接クリック
browser_evaluate({
  script: "document.querySelector('button#submit').click()"
})

// 4. ホバーしてからクリック
browser_hover({ selector: "button#submit" })
browser_click({ selector: "button#submit" })

// 5. 要素の状態を確認
browser_evaluate({
  script: `
    const btn = document.querySelector('button#submit');
    return {
      disabled: btn.disabled,
      visible: btn.offsetParent !== null,
      zIndex: window.getComputedStyle(btn).zIndex
    };
  `
})
```

### 問題4: 入力が反映されない

#### 原因

- input要素が無効化されている
- JavaScriptフレームワークの双方向バインディング
- カスタムイベントリスナー

#### 解決策

```typescript
// 1. フォーカスしてから入力
browser_click({ selector: "input#email" })
browser_type({ selector: "input#email", text: "user@example.com" })

// 2. 既存の値をクリアしてから入力
browser_evaluate({
  script: "document.querySelector('input#email').value = ''"
})
browser_type({ selector: "input#email", text: "user@example.com" })

// 3. JavaScriptで直接値を設定
browser_evaluate({
  script: `
    const input = document.querySelector('input#email');
    input.value = 'user@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  `
})

// 4. React/Vueなどのフレームワーク対応
browser_evaluate({
  script: `
    const input = document.querySelector('input#email');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(input, 'user@example.com');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  `
})
```

### 問題5: 認証エラー

#### 原因

- セッションが切れている
- CSRFトークンが無効
- Cookie/LocalStorageが設定されていない

#### 解決策

```typescript
// 1. ログイン処理を実行
browser_navigate({ url: "https://example.com/login" })
browser_type({ selector: "input#email", text: "user@example.com" })
browser_type({ selector: "input#password", text: "password123" })
browser_click({ selector: "button#login" })
browser_wait_for({ selector: ".dashboard" })

// 2. Cookie/LocalStorageを設定
browser_evaluate({
  script: `
    localStorage.setItem('authToken', 'token-value');
    document.cookie = 'session=abc123; path=/';
  `
})

// 3. 認証状態を確認
browser_evaluate({
  script: `
    return {
      cookies: document.cookie,
      localStorage: { ...localStorage },
      authToken: localStorage.getItem('authToken')
    };
  `
})
```

### 問題6: ダイアログ/モーダルが表示されない

#### 原因

- アニメーションが完了していない
- z-indexの問題
- 表示条件が満たされていない

#### 解決策

```typescript
// 1. モーダルトリガーをクリック
browser_click({ selector: "button.open-modal" })

// 2. モーダルの出現を待機
browser_wait_for({
  selector: ".modal-content",
  state: "visible",
  timeout: 10000
})

// 3. アニメーション完了を待機
browser_evaluate({
  script: `
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 500);  // アニメーション時間
    });
  `
})

// 4. モーダルの表示状態を確認
browser_evaluate({
  script: `
    const modal = document.querySelector('.modal');
    return {
      exists: modal !== null,
      visible: modal && window.getComputedStyle(modal).display !== 'none',
      opacity: modal && window.getComputedStyle(modal).opacity
    };
  `
})

// 5. スクリーンショットで視覚的に確認
browser_take_screenshot({ name: "modal-state.png" })
```

## デバッグワークフロー

### ステップ1: エラー情報の収集

```typescript
// すべてのデバッグ情報を一括取得
const debugInfo = {
  screenshot: browser_take_screenshot({ name: "error.png" }),
  console: browser_console_messages(),
  network: browser_network_requests(),
  snapshot: browser_snapshot()
};
```

### ステップ2: エラーの再現

```typescript
// 1. 初期状態に戻る
browser_navigate({ url: "https://example.com" })

// 2. 各ステップを記録しながら実行
for (const step of testSteps) {
  console.log(`Executing step: ${step.name}`);
  browser_take_screenshot({ name: `${step.name}-before.png` });

  // ステップ実行
  executeStep(step);

  browser_take_screenshot({ name: `${step.name}-after.png` });
  const logs = browser_console_messages();

  // エラー発生時は中断
  if (logs.some(log => log.type === 'error')) {
    console.log('Error detected at step:', step.name);
    break;
  }
}
```

### ステップ3: 問題の特定

```typescript
// コンソールログから問題を特定
const errorLogs = logs.filter(log => log.type === 'error');
const warningLogs = logs.filter(log => log.type === 'warning');

// ネットワークリクエストから問題を特定
const failedRequests = requests.filter(req => req.status >= 400);

// DOM構造から問題を特定
const missingElements = browser_evaluate({
  script: `
    const selectors = ['.expected-element', '#important-button'];
    return selectors.map(sel => ({
      selector: sel,
      exists: document.querySelector(sel) !== null
    }));
  `
});
```

### ステップ4: 問題の修正と検証

```typescript
// 修正を適用
// 例: 要素の待機時間を追加

// 検証
browser_navigate({ url: "https://example.com" })
// テストを再実行
const result = runTest();

if (result.success) {
  console.log('問題が修正されました');
} else {
  console.log('さらなる調査が必要です');
  // デバッグ情報を再取得
}
```

## ログ分析のベストプラクティス

### コンソールログのパターン分析

```typescript
// エラーパターンの検出
const errorPatterns = {
  cors: /CORS policy/i,
  network: /Failed to fetch/i,
  notFound: /404/,
  syntax: /SyntaxError/i,
  promise: /Unhandled Promise Rejection/i
};

// ログから問題を分類
const categorizedErrors = logs
  .filter(log => log.type === 'error')
  .map(log => {
    for (const [category, pattern] of Object.entries(errorPatterns)) {
      if (pattern.test(log.message)) {
        return { category, message: log.message };
      }
    }
    return { category: 'unknown', message: log.message };
  });
```

### ネットワークログのパフォーマンス分析

```typescript
// 遅いリクエストを特定
const slowRequests = requests
  .filter(req => req.duration > 3000)  // 3秒以上
  .sort((a, b) => b.duration - a.duration);

// 失敗したリクエストを分類
const failedRequests = requests
  .filter(req => req.status >= 400)
  .reduce((acc, req) => {
    const category = req.status >= 500 ? 'server' : 'client';
    acc[category] = acc[category] || [];
    acc[category].push(req);
    return acc;
  }, {});
```

## トラブルシューティングチェックリスト

### テスト開始前

- [ ] 対象URLが正しいか
- [ ] 必要な認証情報が揃っているか
- [ ] ネットワーク接続が安定しているか
- [ ] ブラウザが正常にインストールされているか

### テスト実行中

- [ ] 各ステップでスクリーンショットを取得しているか
- [ ] コンソールログを監視しているか
- [ ] タイムアウト時間が適切に設定されているか
- [ ] 要素の待機処理が入っているか

### エラー発生時

- [ ] エラーメッセージを記録したか
- [ ] スクリーンショットを取得したか
- [ ] コンソールログを確認したか
- [ ] ネットワークリクエストを確認したか
- [ ] DOM構造を記録したか

### テスト完了後

- [ ] すべてのリソースが解放されたか
- [ ] ブラウザが正常に閉じられたか
- [ ] デバッグ情報が保存されたか
- [ ] エラーレポートが生成されたか

このガイドを活用して、Playwrightテストの問題を迅速に特定・解決してください。
