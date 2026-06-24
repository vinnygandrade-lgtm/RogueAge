import { test, expect } from '@playwright/test';
import { waitForGameBoot } from '../helpers/game-fixtures';

test.describe('Core runtime APIs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
  });

  test('critical engines are registered on window', async ({ page }) => {
    const apis = await page.evaluate(() => ({
      InventoryManager: typeof window.InventoryManager === 'object',
      ItemSecurity: typeof window.ItemSecurity === 'object',
      calcularStatusGlobais: typeof window.calcularStatusGlobais === 'function',
      salvarJogo: typeof window.salvarJogo === 'function',
      carregarJogo: typeof window.carregarJogo === 'function',
      AuthEngine: typeof window.AuthEngine === 'object',
      SupabaseAPI: typeof window.SupabaseAPI === 'object',
      I18n: typeof window.I18n === 'object',
    }));

    expect(apis.InventoryManager).toBe(true);
    expect(apis.ItemSecurity).toBe(true);
    expect(apis.calcularStatusGlobais).toBe(true);
    expect(apis.salvarJogo).toBe(true);
    expect(apis.carregarJogo).toBe(true);
    expect(apis.AuthEngine).toBe(true);
    expect(apis.I18n).toBe(true);
  });

  test('calcularStatusGlobais produces sane playerStats for default fighter', async ({ page }) => {
    const stats = await page.evaluate(() => {
      window.charRace = 'Human';
      window.charClass = 'Fighter';
      window.charGender = 'Male';
      window.nivel = 1;
      window.calcularStatusGlobais();
      return { ...window.playerStats };
    });

    expect(stats.maxHp).toBeGreaterThan(0);
    expect(stats.pAtk).toBeGreaterThan(0);
    expect(stats.pDef).toBeGreaterThan(0);
  });

  test('calcularDefesaDoPlayer uses asymptotic formula branch', async ({ page }) => {
    const def = await page.evaluate(() => {
      window.playerStats = { ...window.playerStats, pDef: 100, mDef: 50 };
      return window.calcularDefesaDoPlayer(false);
    });
    expect(def).toBe(100);

    const mdef = await page.evaluate(() => window.calcularDefesaDoPlayer(true));
    expect(mdef).toBe(50);
  });
});
