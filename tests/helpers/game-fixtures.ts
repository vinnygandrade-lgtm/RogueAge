import type { Page } from '@playwright/test';
import type { CharacterSave } from '../../src/types/game';
import { L2MINI_SAVE_VERSION } from '../../src/types/game';

/** Personagem mínimo para smoke tests (save v7, tutorial concluído). */
export const SMOKE_HERO_NAME = 'SmokeHero';

export function buildMinimalSave(charName: string, adenas = 500): CharacterSave {
  return {
    saveVersion: L2MINI_SAVE_VERSION,
    charName,
    charRace: 'Human',
    charGender: 'Male',
    charClass: 'Fighter',
    adenas,
    ancientCoins: 0,
    enchant: 0,
    enchantArmor: 0,
    nivel: 1,
    xpAtual: 0,
    isAugmented: false,
    playerHP: 100,
    playerMP: 50,
    playerCP: 60,
    inventario: { 'HP Potion': 20, 'Mana Potion': 5 },
    inventarioEquips: [],
    armaEquipadaBase: null,
    armaduraEquipada: null,
    barraAtalhos: [
      'Attack', null, 'HP Potion', 'Mana Potion',
      null, null, null, null, null, null,
      null, null, null, null, null, null,
      null, null, null, null,
    ],
    endgame: {
      weeklyChampionKills: 0,
      weeklyWeekKey: '',
      lastClaimedWeekKey: '',
      lifetimeChampionKills: 0,
      renown: 0,
    },
    tutorial: {
      v: 1,
      active: false,
      step: 0,
      completed: true,
      skipped: false,
    },
  };
}

/** Espera boot completo (scripts legados + I18n + AuthEngine). */
export async function waitForGameBoot(page: Page) {
  await page.waitForFunction(() => {
    return (
      window.__L2MINI_BOOT_READY === true &&
      typeof window.t === 'function' &&
      typeof window.InventoryManager === 'object' &&
      typeof window.ItemSecurity === 'object' &&
      typeof window.AuthEngine === 'object' &&
      typeof window.carregarJogo === 'function'
    );
  });
}

/** Carrega personagem de teste no runtime (localStorage + carregarJogo + tela de jogo). */
export async function bootstrapSmokeHero(page: Page, charName = SMOKE_HERO_NAME) {
  const key = charName.toLowerCase();
  const save = buildMinimalSave(charName);

  await page.evaluate(
    ({ storageKey, payload }) => {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    },
    { storageKey: `l2mini_save_${key}`, payload: save },
  );

  await page.evaluate(async (name) => {
    const ok = await window.carregarJogo(name);
    if (!ok) throw new Error(`carregarJogo failed for ${name}`);
    window.mudarTela('screen-game');
    window.calcularStatusGlobais();
    window.atualizar();
  }, charName);
}
