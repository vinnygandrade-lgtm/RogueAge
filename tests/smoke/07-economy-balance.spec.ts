import { test, expect } from '@playwright/test';
import { waitForGameBoot } from '../helpers/game-fixtures';

test.describe('EconomyBalance (TS module)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
  });

  test('effectiveShopUnitPrice scales with player level', async ({ page }) => {
    const prices = await page.evaluate(() => {
      const eb = window.EconomyBalance;
      return {
        lv1: eb.effectiveShopUnitPrice(1000, 1),
        lv40: eb.effectiveShopUnitPrice(1000, 40),
      };
    });
    expect(prices.lv1).toBe(1000);
    expect(prices.lv40).toBeGreaterThan(prices.lv1);
  });

  test('adenaLootMult includes zone bonus', async ({ page }) => {
    const mult = await page.evaluate(() =>
      window.EconomyBalance.adenaLootMult(20, 'C'),
    );
    expect(mult).toBeGreaterThan(1.2);
  });
});
