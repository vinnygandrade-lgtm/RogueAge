import { test, expect } from '@playwright/test';
import { waitForGameBoot } from '../helpers/game-fixtures';

test.describe('ItemSecurity (RG / UID)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForGameBoot(page);
  });

  test('createInstance assigns unique uid and preserves enchant', async ({ page }) => {
    const result = await page.evaluate(() => {
      const base = {
        nome: 'Smoke Test Blade',
        atk: 10,
        tipo: 'Sword',
        img: 'assets/itens/smoke.png',
      };
      const a = window.ItemSecurity.createInstance('weapon', base, { enchant: 3 });
      const b = window.ItemSecurity.createInstance('weapon', base, { enchant: 5 });
      if (!a || !b) return null;
      return {
        uidA: a.uid,
        uidB: b.uid,
        enchantA: a.enchant,
        nome: a.base.nome,
      };
    });

    expect(result).not.toBeNull();
    expect(result!.uidA).not.toBe(result!.uidB);
    expect(result!.uidA).toMatch(/^WPN-/);
    expect(result!.enchantA).toBe(3);
    expect(result!.nome).toBe('Smoke Test Blade');
  });
});
