import { test, expect } from '@playwright/test';
import { waitForGameBoot } from '../helpers/game-fixtures';

test.describe('Boot & i18n', () => {
  test('login screen loads with translated strings (not raw i18n keys)', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);

    await expect(page.locator('#screen-login')).toBeVisible();
    await expect(page.locator('#input-username')).toBeVisible();

    const subtitle = page.locator('.login-subtitle');
    await expect(subtitle).toBeVisible();
    const text = (await subtitle.textContent())?.trim() ?? '';
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/^login\./);

    const translated = await page.evaluate(() =>
      typeof window.t === 'function' ? window.t('login.subtitle') : '',
    );
    expect(translated).not.toMatch(/^login\./);
    expect(translated.length).toBeGreaterThan(0);
  });

  test('I18n locale switch EN ↔ PT-BR updates login placeholder', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);

    await page.locator('#i18n-btn-pt').click();
    await page.waitForFunction(() => {
      const input = document.getElementById('input-username') as HTMLInputElement | null;
      const ph = input?.getAttribute('placeholder') ?? '';
      return ph.length > 0 && !ph.startsWith('login.');
    });

    const ptPlaceholder = await page.locator('#input-username').getAttribute('placeholder');
    expect(ptPlaceholder).not.toMatch(/^login\./);

    await page.locator('#i18n-btn-en').click();
    await page.waitForFunction(() => {
      const input = document.getElementById('input-username') as HTMLInputElement | null;
      const ph = input?.getAttribute('placeholder') ?? '';
      return ph.length > 0 && !ph.startsWith('login.');
    });
  });
});
