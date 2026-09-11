import { chromium, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const url = process.env.TEST_URL || 'http://127.0.0.1:4174/salary-pulse/';
const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync(systemChrome) ? systemChrome : undefined);
const browser = await chromium.launch({ headless: true, executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
const smokeEmail = `smoke-${Date.now()}@example.com`;
page.on('pageerror', (error) => errors.push(error.message));
await page.goto(url);

await expect(page.getByRole('heading', { name: '让每一秒的工作，都有回声。' })).toBeVisible();
await expect(page.getByRole('button', { name: '进入仪表盘' })).toBeVisible();
await expect(page.getByLabel('邮箱')).toBeVisible();
await page.getByRole('button', { name: '注册账号' }).click();
await expect(page.getByRole('heading', { name: '建立你的收入现场' })).toBeVisible();
await page.getByLabel('邮箱').fill(smokeEmail);
await page.getByLabel('密码').fill('password');
if (process.env.TEST_AUTH_SUBMIT === '1') {
  await page.getByRole('button', { name: '创建账号' }).click();
  await expect(page.getByRole('heading', { name: '先设置你的收入，再让它跳起来。' })).toBeVisible();
}

for (const width of [320, 390, 768, 1280]) {
  await page.setViewportSize({ width, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
expect(errors).toEqual([]);
console.log('PASS: auth entry, signup form, 4 responsive widths, zero page errors');
await browser.close();
