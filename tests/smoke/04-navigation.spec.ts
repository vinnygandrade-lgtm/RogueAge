import { test, expect } from '@playwright/test';
import { bootstrapSmokeHero, waitForGameBoot } from '../helpers/game-fixtures';

test.describe('In-game navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
    await bootstrapSmokeHero(page);
  });

  test('screen-game is active after bootstrap', async ({ page }) => {
    await expect(page.locator('#screen-game')).toHaveClass(/active-screen/);
  });

  test('irPara perfil shows profile panel', async ({ page }) => {
    await page.evaluate(() => window.irPara('perfil'));

    const perfil = page.locator('#tela-perfil');
    await expect(perfil).toBeVisible();
    await expect(perfil).toHaveCSS('display', 'flex');
  });

  test('irPara inventario shows inventory grid', async ({ page }) => {
    await page.evaluate(() => window.irPara('inventario'));

    await expect(page.locator('#tela-inventario')).toBeVisible();
    await expect(page.locator('#grid-inventario')).toBeVisible();
  });
});
