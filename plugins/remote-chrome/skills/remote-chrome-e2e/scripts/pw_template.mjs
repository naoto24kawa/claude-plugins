#!/usr/bin/env node
// pw_e2e.mjs - E2E verification + screenshot template
// Usage: Customize the "Custom Actions" section and deploy to remote machine
// Base: node pw_e2e.mjs (no args - all config is inline)
// Requires: playwright-core (`npm install playwright-core`), Google Chrome

import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  // --- Navigation ---
  await page.goto('http://localhost:23000/', {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  });

  // === Custom Actions (Claude generates this section) ===
  // Examples:
  //   await page.click('.notification-card');
  //   await page.fill('#search', 'keyword');
  //   await page.waitForSelector('.result-list');
  //   await page.selectOption('#dropdown', 'option-value');
  // === End Custom Actions ===

  // --- Verification ---
  const title = await page.title();
  const bodyText = await page.textContent('body');
  console.log(`Title: ${title}`);
  console.log(`Body preview: ${(bodyText || '').substring(0, 200)}`);

  // --- Screenshot ---
  await page.screenshot({ path: '/tmp/pw_e2e.png', fullPage: false });

  const fs = await import('node:fs');
  const stat = fs.statSync('/tmp/pw_e2e.png');
  console.log(`Screenshot saved: /tmp/pw_e2e.png (${stat.size} bytes)`);
} catch (e) {
  console.error('ERROR:', e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
  console.log('Done.');
}
