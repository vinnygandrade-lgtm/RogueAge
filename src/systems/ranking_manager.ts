/**
 * Ranking híbrido: bots locais + jogadores reais da nuvem + jogador local.
 * Migrado: js/systems/ranking_manager.js — Fase 4: tipos explícitos.
 */
import { buscarRankingGlobalReal } from './cloud_sync';
import type {
  BotRankingSeed,
  CloudRankingPlayer,
  MergedRankingEntry,
  RankingManagerApi,
} from '../types/game';
import { registerGlobal } from '../runtime/register-global';

function readBotRankingSeed(): BotRankingSeed[] {
  const oly = window.OlympiadEngine;
  if (oly?.dbRanking && oly.dbRanking.length > 0) {
    return oly.dbRanking as BotRankingSeed[];
  }
  if (Array.isArray(window.dbBotsRanking)) {
    return window.dbBotsRanking as BotRankingSeed[];
  }
  return [];
}

function localAscensionTitle(renown: number): string {
  if (window.EndgamePursuits?.getAscensionTitleForRenown) {
    return window.EndgamePursuits.getAscensionTitleForRenown(renown);
  }
  if (renown >= 200) return 'Paragon';
  if (renown >= 100) return 'Warlord';
  if (renown >= 40) return 'Veteran';
  return 'Ascendant';
}

export const RankingManager: RankingManagerApi = {
  realPlayers: [],
  lastFetch: 0,
  CACHE_DURATION: 30_000,

  async getMergedRanking(): Promise<MergedRankingEntry[]> {
    const now = Date.now();
    if (now - this.lastFetch > this.CACHE_DURATION || this.realPlayers.length === 0) {
      const cloudPlayers = await buscarRankingGlobalReal();
      if (cloudPlayers) {
        this.realPlayers = cloudPlayers;
        this.lastFetch = now;
      }
    }

    let todosJogadores: MergedRankingEntry[] = readBotRankingSeed().map((bot) => ({
      nome: bot.nome || bot.farmBot1 || 'Bot',
      classe: bot.classe ?? 'Fighter',
      nivel: bot.nivel ?? 1,
      olympiadPoints: bot.olympiadPoints ?? 0,
      isBot: true,
    }));

    const charName = window.charName;
    this.realPlayers.forEach((rp: CloudRankingPlayer) => {
      if (rp.nome === charName) return;
      todosJogadores = todosJogadores.filter((j) => j.nome !== rp.nome);
      todosJogadores.push({
        nome: rp.nome,
        classe: rp.charClass || rp.classe || 'Unknown',
        nivel: rp.nivel ?? 1,
        olympiadPoints: rp.olympiadPoints ?? 0,
        isBot: false,
        isRealPlayer: true,
        renown: typeof rp.renown === 'number' ? rp.renown : undefined,
        ascensionTitle: typeof rp.ascensionTitle === 'string' ? rp.ascensionTitle : undefined,
      });
    });

    todosJogadores = todosJogadores.filter((j) => j.nome !== charName);

    const localRenown =
      window.endgameData && typeof window.endgameData.renown === 'number'
        ? window.endgameData.renown
        : 0;

    todosJogadores.push({
      nome: charName || 'You',
      classe: window.charClass || 'Fighter',
      nivel: window.nivel ?? 1,
      olympiadPoints: window.olympiadPoints ?? 0,
      isBot: false,
      isLocalPlayer: true,
      renown: localRenown,
      ascensionTitle: localAscensionTitle(localRenown),
    });

    todosJogadores.sort((a, b) => {
      if (b.olympiadPoints !== a.olympiadPoints) {
        return b.olympiadPoints - a.olympiadPoints;
      }
      return b.nivel - a.nivel;
    });

    return todosJogadores;
  },
};

registerGlobal('RankingManager', RankingManager);

export {};
