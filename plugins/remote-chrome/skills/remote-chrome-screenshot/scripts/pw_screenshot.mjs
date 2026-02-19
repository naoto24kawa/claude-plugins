import { chromium } from 'playwright-core';

const url = process.argv[2] || 'http://localhost:23000/';
const output = process.argv[3] || '/tmp/pw_screenshot.png';
const waitSec = parseInt(process.argv[4] || '5');

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

  console.log(`Waiting ${waitSec}s for async content...`);
  await page.waitForTimeout(waitSec * 1000);

  const title = await page.title();
  const bodyText = await page.textContent('body');
  console.log(`Title: ${title}`);
  console.log(`Body preview: ${(bodyText || '').substring(0, 100)}`);

  console.log('Taking screenshot...');
  await page.screenshot({ path: output, fullPage: false });

  const fs = await import('node:fs');
  const stat = fs.statSync(output);
  console.log(`Saved: ${output} (${stat.size} bytes)`);
} catch (e) {
  console.error('ERROR:', e.message);
} finally {
  await browser.close();
  console.log('Done.');
}
