import { test, expect } from '@playwright/test';
import {
  SMOKE_HERO_NAME,
  bootstrapSmokeHero,
  buildMinimalSave,
  waitForGameBoot,
} from '../helpers/game-fixtures';

test.describe('Save / load roundtrip', () => {
  test('salvarJogo persists adenas to localStorage after carregarJogo', async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
    await bootstrapSmokeHero(page);

    await page.evaluate(() => {
      window.adenas = 7777;
      window.salvarJogo({ silent: true });
    });

    const raw = await page.evaluate(
      (key) => localStorage.getItem(key),
      `l2mini_save_${SMOKE_HERO_NAME.toLowerCase()}`,
    );
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.adenas).toBe(7777);
    expect(parsed.saveVersion).toBeGreaterThanOrEqual(1);
    expect(parsed.charName).toBe(SMOKE_HERO_NAME);
  });

  test('carregarJogo restores migrated save fields', async ({ page }) => {
    const save = buildMinimalSave('MigrateHero', 1234);
    delete (save as { saveVersion?: number }).saveVersion;

    await page.goto('/');
    await waitForGameBoot(page);

    await page.evaluate(
      ({ key, payload }) => {
        localStorage.setItem(key, JSON.stringify(payload));
      },
      { key: 'l2mini_save_migratehero', payload: save },
    );

    const loaded = await page.evaluate(async () => {
      const ok = await window.carregarJogo('MigrateHero');
      if (ok) window.salvarJogo({ silent: true });
      return { ok, adenas: window.adenas };
    });

    expect(loaded.ok).toBe(true);
    expect(loaded.adenas).toBe(1234);

    const migrated = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      'l2mini_save_migratehero',
    );
    expect(migrated.saveVersion).toBeGreaterThanOrEqual(1);
  });
});
