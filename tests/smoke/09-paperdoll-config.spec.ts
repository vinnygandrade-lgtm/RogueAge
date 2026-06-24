import { test, expect } from '@playwright/test';
import { bootstrapSmokeHero, waitForGameBoot } from '../helpers/game-fixtures';

test.describe('Paperdoll config (TS module)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
  });

  test('resolvePaperdollPresetId returns human_fighter by default', async ({ page }) => {
    const preset = await page.evaluate(() => {
      window.charRace = 'Human';
      window.charGender = 'Male';
      window.charClass = 'Fighter';
      return window.resolvePaperdollPresetId();
    });
    expect(preset).toBe('human_fighter');
  });

  test('getPaperdollBodySrcList includes preset body path', async ({ page }) => {
    const src = await page.evaluate(() =>
      window.getPaperdollBodySrcList('human_fighter')[0],
    );
    expect(src).toContain('assets/paperdolls/human_fighter/body.png');
  });

  test('profile paperdoll has data-paperdoll-preset after boot', async ({ page }) => {
    await bootstrapSmokeHero(page);
    await page.evaluate(() => window.irPara('perfil'));
    const preset = await page.locator('.l2-paperdoll').first().getAttribute('data-paperdoll-preset');
    expect(preset).toBeTruthy();
  });
});
