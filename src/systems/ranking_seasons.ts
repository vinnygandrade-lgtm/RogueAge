/**
 * Temporadas mensais da Olympiad — reset de MMR e recompensas via correio.
 * Migrado: js/systems/ranking_seasons.js — Fase 4: tipos explícitos.
 */
import type {
  CharacterSave,
  ItemCatalogBase,
  LastSeasonData,
  RankingSeasonsApi,
  SeasonRewardBundle,
} from '../types/game';
import { registerGlobal } from '../runtime/register-global';

const SEASON_REWARDS: Record<string, SeasonRewardBundle> = {
  Paper: { adena: 25000, coins: 50, items: [{ id: 'Life Stone', qtd: 1 }] },
  Wood: { adena: 75000, coins: 100, items: [{ id: 'Life Stone', qtd: 2 }] },
  Copper: {
    adena: 200000,
    coins: 250,
    items: [
      { id: 'Life Stone', qtd: 5 },
      { id: 'Enchant Armor (D)', qtd: 1 },
    ],
  },
  Silver: {
    adena: 500000,
    coins: 600,
    items: [
      { id: 'Life Stone', qtd: 10 },
      { id: 'Enchant Weapon (C)', qtd: 1 },
    ],
  },
  Gold: {
    adena: 1500000,
    coins: 1500,
    items: [
      { id: 'Life Stone', qtd: 20 },
      { id: 'Enchant Weapon (B)', qtd: 1 },
    ],
  },
  Platinum: {
    adena: 5000000,
    coins: 4000,
    items: [
      { id: 'Life Stone', qtd: 40 },
      { id: 'Enchant Weapon (A)', qtd: 1 },
    ],
  },
  Diamond: {
    adena: 15000000,
    coins: 10000,
    items: [
      { id: 'Life Stone', qtd: 80 },
      { id: 'Enchant Weapon (S)', qtd: 1 },
    ],
  },
  Legendary: {
    adena: 50000000,
    coins: 25000,
    items: [
      { id: 'Life Stone', qtd: 150 },
      { id: 'Enchant Weapon (S)', qtd: 3 },
      { id: 'Enchant Armor (S)', qtd: 5 },
    ],
  },
  Mythic: {
    adena: 200000000,
    coins: 100000,
    items: [
      { id: 'Life Stone', qtd: 300 },
      { id: 'Enchant Weapon (S)', qtd: 10 },
      { id: 'Enchant Armor (S)', qtd: 20 },
    ],
  },
};

function readLocalSave(charName: string): CharacterSave {
  const raw = localStorage.getItem(`l2mini_save_${charName.toLowerCase()}`);
  if (!raw) return {} as CharacterSave;
  try {
    return JSON.parse(raw) as CharacterSave;
  } catch {
    return {} as CharacterSave;
  }
}

function writeLocalSave(charName: string, data: CharacterSave): void {
  localStorage.setItem(`l2mini_save_${charName.toLowerCase()}`, JSON.stringify(data));
}

function catalogList(): ItemCatalogBase[][] {
  return [
    window.catalogoMateriais ?? [],
    window.catalogoArmas ?? [],
    window.catalogoArmaduras ?? [],
    window.catalogoJoias ?? [],
    window.catalogoConsumiveis ?? [],
    window.catalogoScrolls ?? [],
  ] as ItemCatalogBase[][];
}

export const RankingSeasons: RankingSeasonsApi = {
  initialized: false,
  SEASON_REWARDS,

  init() {
    if (this.initialized) return;
    if (!window.charName) return;

    this.initialized = true;
    console.log('📅 [Seasons] Monitor de Temporadas iniciado.');
    this.checkSeason();

    if (typeof window.renderizarSocial === 'function') window.renderizarSocial();
    if (typeof window.renderizarPremiosRanking === 'function') {
      window.renderizarPremiosRanking();
    }

    setInterval(() => this.checkSeason(), 3_600_000);
  },

  getTimeLeft() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = nextMonth.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours };
  },

  checkSeason() {
    if (!window.charName) return;

    const now = new Date();
    const currentSeasonKey = `${now.getMonth() + 1}-${now.getFullYear()}`;
    const lastResetKey = localStorage.getItem('l2mini_last_season_reset');

    if (lastResetKey && lastResetKey !== currentSeasonKey) {
      this.finalizeSeason(lastResetKey);
    }

    if (!lastResetKey || lastResetKey !== currentSeasonKey) {
      localStorage.setItem('l2mini_last_season_reset', currentSeasonKey);
    }
  },

  finalizeSeason(lastSeasonKey: string) {
    console.log(`[Seasons] Finalizando temporada ${lastSeasonKey}...`);

    const oly = window.OlympiadEngine;
    if (!oly?.getRank) return;

    const rankInfo = oly.getRank(window.olympiadPoints ?? 0);
    const charName = window.charName;
    if (!charName) return;

    const localSave = readLocalSave(charName);

    localSave.lastSeasonData = {
      seasonKey: lastSeasonKey,
      rankReached: rankInfo.nomeCompleto,
      tierReached: rankInfo.tier ?? 'Paper',
      claimed: false,
    };

    window.olympiadPoints = 0;
    localSave.olympiadPoints = 0;
    window.olympiadWins = 0;
    window.olympiadLosses = 0;
    localSave.olympiadWins = 0;
    localSave.olympiadLosses = 0;

    if (window.OlympiadEngine) window.OlympiadEngine.rewardsClaimed = [];
    localSave.olympiadRewardsClaimed = [];

    writeLocalSave(charName, localSave);
    window.salvarJogo();

    window.escreverLog(
      `<span style="color:#facc15; font-weight:bold;">[SEASON] The season ${lastSeasonKey} has ended! You finished as ${rankInfo.nomeCompleto}. Claim your rewards in the Olympiad menu!</span>`,
    );
  },

  async claimSeasonReward() {
    const charName = window.charName;
    if (!charName) return;

    const localSave = readLocalSave(charName);
    const data = localSave.lastSeasonData as LastSeasonData | undefined;
    if (!data || data.claimed) {
      window.l2Alert('No season rewards to claim.');
      return;
    }

    const rewards =
      this.SEASON_REWARDS[data.tierReached] ?? this.SEASON_REWARDS.Paper;

    data.claimed = true;
    localSave.lastSeasonData = data;
    writeLocalSave(charName, localSave);

    if (typeof window.enviarMail !== 'function') return;

    const recompensas: Array<{ id: string; nome: string; qtd: number }> = [];
    if (rewards.adena > 0) {
      recompensas.push({ id: 'Adena', nome: 'Adena', qtd: rewards.adena });
    }
    if (rewards.coins > 0) {
      recompensas.push({ id: 'Ancient Coin', nome: 'Ancient Coin', qtd: rewards.coins });
    }
    rewards.items.forEach((it) => {
      recompensas.push({ id: it.id, nome: it.nome ?? it.id, qtd: it.qtd });
    });

    await window.enviarMail(
      charName,
      'Olympiad Manager',
      `Season Reward: ${data.seasonKey}`,
      'system',
      {
        texto: `Congratulations! You finished the season ${data.seasonKey} as ${data.rankReached}. Here are your monthly rewards!`,
        recompensas,
      },
    );

    window.l2Alert('Season rewards sent to Mailbox!');
    if (typeof window.renderizarPremiosRanking === 'function') {
      window.renderizarPremiosRanking();
    }
  },

  findItemData(itemId: string): ItemCatalogBase | null {
    const key = String(itemId).trim();
    if (!key) return null;

    for (const catalog of catalogList()) {
      const item = catalog.find((i) => i.id === key || i.nome === key);
      if (!item) continue;

      const armas = window.catalogoArmas ?? [];
      const armaduras = window.catalogoArmaduras ?? [];
      const joias = window.catalogoJoias ?? [];
      if (armas.includes(item)) item.tipo = 'weapon';
      else if (armaduras.includes(item)) item.tipo = 'armor';
      else if (joias.includes(item)) item.tipo = 'jewel';
      return item;
    }
    return null;
  },
};

registerGlobal('RankingSeasons', RankingSeasons);

export {};
