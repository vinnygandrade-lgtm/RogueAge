/**
 * UI — Missions Hub (Daily + Weekly)
 * Evolução de missões diárias: pool alargado, skip=reroll 1×, missões semanais ISO.
 */

import type {
  DailyBossGradeTier,
  DailyMissionGroup,
  DailyMissionId,
  DailyMissionInstance,
  DailyMissionReward,
  DailyMissionRewardPackage,
  DailyMissionRotationRecord,
  DailyMissionTemplate,
  DailyMissionsSaveData,
  MissionsHubTab,
  WeeklyMissionsSaveData,
} from '../types/game';
import { htmlMissionRewardIcons } from './ui_reward_icons';
import { scrollClaimableIntoView, showMissionReadyToast, sortMissionEntries, paintHubTabNotif } from './ui_mission_toasts';
import type { MissionSortState } from './ui_mission_toasts';

let missoesDiariasData: DailyMissionsSaveData | null = null;
let missoesSemanaisData: WeeklyMissionsSaveData | null = null;
let missoesHubTab: MissionsHubTab = 'daily';

const GRADES_L2_OFICIAIS: readonly DailyBossGradeTier[] = ['No-Grade', 'D', 'C', 'B', 'A', 'S'];
const MAX_HISTORICO_ROTACOES = 12;
const WEEKLY_TARGET_SCALE = 5;
const WEEKLY_REWARD_SCALE = 2.75;

function dailyMissionT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function tituloMissaoDiaria(m: Pick<DailyMissionInstance, 'id' | 'titulo'> | null | undefined): string {
  if (m && m.id && typeof window.t === 'function') {
    const k = 'game.daily.missions.' + m.id + '.title';
    const s = window.t(k);
    if (s && s !== k) return s;
  }
  return (m && m.titulo) ? m.titulo : '';
}

function descMissaoDiaria(m: Pick<DailyMissionInstance, 'id' | 'desc'> | null | undefined): string {
  if (m && m.id && typeof window.t === 'function') {
    const k = 'game.daily.missions.' + m.id + '.desc';
    const s = window.t(k);
    if (s && s !== k) return s;
  }
  return (m && m.desc) ? m.desc : '';
}

function hintMissaoDiaria(m: Pick<DailyMissionInstance, 'id'> | null | undefined): string {
  if (m && m.id && typeof window.t === 'function') {
    const k = 'game.daily.missions.' + m.id + '.hint';
    const s = window.t(k);
    if (s && s !== k) return s;
  }
  return '';
}

const GRUPOS_MISSAO: Record<DailyMissionGroup, DailyMissionId[]> = {
  farm: ['hunt_pack', 'champion_hunter', 'zone_ranger'],
  economy: ['forge_minter', 'adena_farmer', 'coin_collector', 'enchant_seeker', 'craft_hand'],
  challenge: ['arena_blood', 'olympiad_grinder', 'daily_boss_slayer', 'battle_alchemist', 'skill_sparks'],
};

/** @deprecated alias — prefer GRUPOS_MISSAO */
const GRUPOS_MISSAO_DIARIA = GRUPOS_MISSAO;

function grupoDaMissao(id: DailyMissionId): DailyMissionGroup | null {
  const grupos: DailyMissionGroup[] = ['farm', 'economy', 'challenge'];
  for (let i = 0; i < grupos.length; i++) {
    const g = grupos[i];
    if (GRUPOS_MISSAO[g].indexOf(id) >= 0) return g;
  }
  return null;
}

function mostrarToastMissaoConcluida(title: string, weekly = false): void {
  if (typeof window.showMissionReadyToast === 'function') {
    window.showMissionReadyToast(weekly ? 'weekly' : 'daily', title || '', 'missions');
    return;
  }
  const container = document.getElementById('toast-container');
  if (!container) return;
  if (container.children.length >= 2 && container.firstElementChild) {
    container.removeChild(container.firstElementChild);
  }
  const key = weekly ? 'game.weekly.toastMissionComplete' : 'game.daily.toastMissionComplete';
  const msg = dailyMissionT(key, { title: title || '' });
  const toast = document.createElement('div');
  toast.className = 'toast-msg toast-msg--mission';
  toast.innerHTML = '✨ ' + msg;
  container.appendChild(toast);
  setTimeout(function () {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
}

function missionCardSortState(m: DailyMissionInstance): MissionSortState {
  if (m.reivindicada) return 'done';
  if (m.concluida) return 'claimable';
  return 'progress';
}

function obterGradeAtualPorNivel(): DailyBossGradeTier {
  if (window.nivel >= 76) return 'S';
  if (window.nivel >= 61) return 'A';
  if (window.nivel >= 52) return 'B';
  if (window.nivel >= 40) return 'C';
  if (window.nivel >= 20) return 'D';
  return 'No-Grade';
}

function normalizarGradeParaRecompensa(grade: DailyBossGradeTier | string): DailyBossGradeTier | string {
  return grade;
}

function obterModificadorGrade(grade: DailyBossGradeTier | string): number {
  const g = normalizarGradeParaRecompensa(grade);
  const map: Record<DailyBossGradeTier, number> = {
    'No-Grade': 1.0,
    D: 1.45,
    C: 2.1,
    B: 3.0,
    A: 4.3,
    S: 6.0,
  };
  return map[g as DailyBossGradeTier] || 1.0;
}

function montarRecompensaPorGrade(
  grade: DailyBossGradeTier | string,
  pacote: DailyMissionRewardPackage = 'base',
  scale = 1,
): DailyMissionReward {
  const g = normalizarGradeParaRecompensa(grade);
  const gradeLabel = g === 'No-Grade' ? 'NG' : g;
  const shotMap: Record<DailyBossGradeTier, { fisico: string; magico: string }> = {
    'No-Grade': { fisico: 'Soulshot (NG)', magico: 'B. Spiritshot (NG)' },
    D: { fisico: 'Soulshot (D)', magico: 'B. Spiritshot (D)' },
    C: { fisico: 'Soulshot (C)', magico: 'B. Spiritshot (C)' },
    B: { fisico: 'Soulshot (B)', magico: 'B. Spiritshot (B)' },
    A: { fisico: 'Soulshot (A)', magico: 'B. Spiritshot (A)' },
    S: { fisico: 'Soulshot (S)', magico: 'B. Spiritshot (S)' },
  };
  const shots = shotMap[g as DailyBossGradeTier];
  const itemFisico = shots ? shots.fisico : null;
  const itemMagico = shots ? shots.magico : null;
  const scrollW = `Enchant Weapon (${gradeLabel})`;
  const scrollA = `Enchant Armor (${gradeLabel})`;

  const isMage = typeof window.isClasseMagica === 'function' && typeof window.charClass !== 'undefined'
    ? window.isClasseMagica(window.charClass)
    : false;
  const shotRecompensa = isMage ? itemMagico : itemFisico;
  const mod = obterModificadorGrade(grade) * scale;

  if (pacote === 'farm') {
    return {
      adenas: Math.floor(2800 * mod),
      ancientCoins: 0,
      itens: shotRecompensa
        ? { [shotRecompensa]: Math.floor(48 * mod) }
        : { [scrollA]: Math.max(1, Math.floor(scale)) },
    };
  }

  if (pacote === 'champion') {
    const itens: Record<string, number> = { [scrollA]: Math.max(1, Math.floor(scale)) };
    if (shotRecompensa && scale > 1) itens[shotRecompensa] = Math.floor(20 * mod);
    return {
      adenas: Math.floor(4800 * mod),
      ancientCoins: 0,
      itens,
    };
  }

  if (pacote === 'arena') {
    const itens: Record<string, number> = { [scrollW]: Math.max(1, Math.floor(scale)) };
    if (shotRecompensa) itens[shotRecompensa] = Math.floor(22 * mod);
    if (scale > 1) itens[scrollA] = Math.max(1, Math.floor(scale));
    return {
      adenas: Math.floor(7000 * mod),
      ancientCoins: 0,
      itens,
    };
  }

  if (pacote === 'pocao') {
    return {
      adenas: Math.floor(3400 * mod),
      ancientCoins: 0,
      itens: {
        'HP Potion': Math.floor(7 * mod),
        'Mana Potion': Math.floor(5 * mod),
      },
    };
  }

  return {
    adenas: Math.floor(4000 * mod),
    ancientCoins: 0,
    itens: { [scrollA]: Math.max(1, Math.floor(scale)) },
  };
}

function getChaveMissoesDiarias(): string | null {
  if (!window.charName) return null;
  return `l2mini_daily_${window.charName.toLowerCase()}`;
}

function getChaveMissoesSemanais(): string | null {
  if (!window.charName) return null;
  return `l2mini_weekly_${window.charName.toLowerCase()}`;
}

function getDataHojeStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO week key (UTC) — alinhado a Ascensão / endgame_pursuits. */
function getIsoWeekKey(d?: Date): string {
  const date = d ?? new Date();
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const yb = new Date(Date.UTC(y, 0, 1));
  const w = Math.ceil(((t.getTime() - yb.getTime()) / 86400000 + 1) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function randomBySeed(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function gerarPoolMissoes(
  seedBase: number,
  gradeAtual: DailyBossGradeTier,
  opts?: { targetScale?: number; rewardScale?: number },
): DailyMissionTemplate[] {
  const baseSeed = seedBase || 1;
  const mod = obterModificadorGrade(gradeAtual);
  const tScale = opts?.targetScale ?? 1;
  const rScale = opts?.rewardScale ?? 1;

  function alvo(base: number, jitter: number, seedOff: number, min = 1): number {
    const raw = (base + Math.floor(randomBySeed(baseSeed + seedOff) * jitter)) * (1 + (mod * 0.12));
    return Math.max(min, Math.floor(raw * tScale));
  }

  return [
    {
      id: 'hunt_pack',
      titulo: 'Ambush Slayer',
      desc: 'Defeat common mobs while hunting.',
      tipo: 'matar_monstros',
      alvo: alvo(26, 20, 11),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'farm', rScale),
      icone: '🗡️',
      grupo: 'farm',
    },
    {
      id: 'champion_hunter',
      titulo: 'Champion Hunter',
      desc: 'Slay golden champions in hunting zones.',
      tipo: 'matar_champions',
      alvo: Math.max(2, Math.floor((2 + Math.floor(randomBySeed(baseSeed + 21) * 3)) * (1 + (mod * 0.08)) * tScale)),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'champion', rScale),
      icone: '👑',
      grupo: 'farm',
    },
    {
      id: 'zone_ranger',
      titulo: 'Zone Ranger',
      desc: 'Clear a long hunt — defeat many common mobs.',
      tipo: 'matar_monstros',
      alvo: alvo(55, 30, 71),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'farm', rScale),
      icone: '🗺️',
      grupo: 'farm',
    },
    {
      id: 'forge_minter',
      titulo: 'Rogue Mint',
      desc: 'Try minting an Ancient Coin at the forge (Materials tab).',
      tipo: 'tentar_mint',
      alvo: Math.max(1, Math.floor((1 + randomBySeed(baseSeed + 31) * 2) * Math.max(1, Math.ceil(tScale * 0.6)))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'base', rScale),
      icone: '🔥',
      grupo: 'economy',
    },
    {
      id: 'adena_farmer',
      titulo: 'Adena Pouch',
      desc: 'Earn Adena from combat and events.',
      tipo: 'ganhar_adena',
      alvo: Math.floor((9000 + Math.floor(randomBySeed(baseSeed + 41) * 14000)) * (1 + (mod * 0.25)) * tScale),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'base', rScale),
      icone: '💰',
      grupo: 'economy',
    },
    {
      id: 'coin_collector',
      titulo: 'Ancient Hoard',
      desc: 'Gather Ancient Coins in battle.',
      tipo: 'coletar_coins',
      alvo: Math.max(1, Math.floor((2 + Math.floor(randomBySeed(baseSeed + 81) * 4)) * Math.max(1, tScale * 0.8))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'base', rScale),
      icone: '🪙',
      grupo: 'economy',
    },
    {
      id: 'enchant_seeker',
      titulo: 'Scroll Seeker',
      desc: 'Attempt to enchant gear at the Blacksmith.',
      tipo: 'tentar_enchant',
      alvo: Math.max(1, Math.floor((2 + Math.floor(randomBySeed(baseSeed + 91) * 3)) * Math.max(1, Math.ceil(tScale * 0.5)))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'base', rScale),
      icone: '✨',
      grupo: 'economy',
    },
    {
      id: 'craft_hand',
      titulo: 'Forge Hand',
      desc: 'Craft items at the forge.',
      tipo: 'craft_item',
      alvo: Math.max(1, Math.floor((2 + Math.floor(randomBySeed(baseSeed + 101) * 3)) * Math.max(1, Math.ceil(tScale * 0.5)))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'farm', rScale),
      icone: '🛠️',
      grupo: 'economy',
    },
    {
      id: 'arena_blood',
      titulo: 'Blood on the Sand',
      desc: 'Win Grand Olympiad duels.',
      tipo: 'vencer_olympiad',
      alvo: Math.max(1, Math.floor((1 + Math.floor(randomBySeed(baseSeed + 51) * 2)) * Math.max(1, Math.min(tScale, 4)))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'arena', rScale),
      icone: '⚔️',
      grupo: 'challenge',
    },
    {
      id: 'olympiad_grinder',
      titulo: 'Arena Grinder',
      desc: 'Win several Grand Olympiad duels this period.',
      tipo: 'vencer_olympiad',
      alvo: Math.max(2, Math.floor((2 + Math.floor(randomBySeed(baseSeed + 111) * 2)) * Math.max(1, Math.min(tScale, 5)))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'arena', rScale),
      icone: '🏟️',
      grupo: 'challenge',
    },
    {
      id: 'daily_boss_slayer',
      titulo: 'Lord of the Day',
      desc: 'Clear your grade’s Daily Boss (WORLD).',
      tipo: 'derrotar_daily_boss',
      alvo: Math.max(1, tScale >= 4 ? 3 : 1),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'champion', rScale),
      icone: '👹',
      grupo: 'challenge',
    },
    {
      id: 'battle_alchemist',
      titulo: 'Battle Alchemist',
      desc: 'Use potions in combat to stay alive.',
      tipo: 'usar_pocoes',
      alvo: alvo(8, 10, 61),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'pocao', rScale),
      icone: '🧪',
      grupo: 'challenge',
    },
    {
      id: 'skill_sparks',
      titulo: 'Skill Sparks',
      desc: 'Cast class skills in combat.',
      tipo: 'usar_skills',
      alvo: alvo(12, 12, 121),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'arena', rScale * 0.85),
      icone: '⚡',
      grupo: 'challenge',
    },
  ];
}

function escolherTresMissoes(
  seed: number,
  pool: DailyMissionTemplate[],
): DailyMissionInstance[] {
  const escolhidas: DailyMissionInstance[] = [];
  const ordemGrupos: DailyMissionGroup[] = ['farm', 'economy', 'challenge'];

  ordemGrupos.forEach(function (grupo, gi) {
    const ids = GRUPOS_MISSAO[grupo] || [];
    const candidatos = pool.filter(function (m) { return ids.indexOf(m.id) >= 0; });
    if (!candidatos.length) return;
    const pos = Math.floor(randomBySeed(seed + (gi * 13) + 3) * candidatos.length);
    const missao = candidatos[pos];
    escolhidas.push({
      ...missao,
      grupo,
      progresso: 0,
      concluida: false,
      reivindicada: false,
      skippedOnce: false,
    });
  });

  let idx = 0;
  while (escolhidas.length < 3 && idx < 24) {
    const pos = Math.floor(randomBySeed(seed + (idx * 7)) * pool.length);
    const missao = pool[pos];
    if (!escolhidas.find(function (m) { return m.id === missao.id; })) {
      escolhidas.push({
        ...missao,
        grupo: missao.grupo || grupoDaMissao(missao.id) || 'farm',
        progresso: 0,
        concluida: false,
        reivindicada: false,
        skippedOnce: false,
      });
    }
    idx++;
  }

  return escolhidas;
}

function gerarMissoesDoDia(): DailyMissionsSaveData {
  const dia = getDataHojeStr();
  const gradeAtual = obterGradeAtualPorNivel();
  const seed = hashString(`${window.charName}_${dia}`);
  const pool = gerarPoolMissoes(seed, gradeAtual);
  return {
    data: dia,
    gradeRef: gradeAtual,
    bonusReivindicado: false,
    missoes: escolherTresMissoes(seed, pool),
    historicoEncerrado: [],
  };
}

function gerarMissoesDaSemana(): WeeklyMissionsSaveData {
  const weekKey = getIsoWeekKey();
  const gradeAtual = obterGradeAtualPorNivel();
  const seed = hashString(`${window.charName}_${weekKey}_weekly`);
  const pool = gerarPoolMissoes(seed, gradeAtual, {
    targetScale: WEEKLY_TARGET_SCALE,
    rewardScale: WEEKLY_REWARD_SCALE,
  });
  return {
    weekKey,
    gradeRef: gradeAtual,
    bonusReivindicado: false,
    missoes: escolherTresMissoes(seed, pool),
    historicoEncerrado: [],
  };
}

function salvarMissoesDiarias(): void {
  const key = getChaveMissoesDiarias();
  if (!key || !missoesDiariasData) return;
  localStorage.setItem(key, JSON.stringify(missoesDiariasData));
}

function salvarMissoesSemanais(): void {
  const key = getChaveMissoesSemanais();
  if (!key || !missoesSemanaisData) return;
  localStorage.setItem(key, JSON.stringify(missoesSemanaisData));
}

function garantirEstruturaMissoesDiarias(): void {
  if (!missoesDiariasData) return;
  if (!Array.isArray(missoesDiariasData.missoes)) missoesDiariasData.missoes = [];
  if (!Array.isArray(missoesDiariasData.historicoEncerrado)) missoesDiariasData.historicoEncerrado = [];
  if (!missoesDiariasData.gradeRef) missoesDiariasData.gradeRef = obterGradeAtualPorNivel();
  missoesDiariasData.missoes.forEach(function (m) {
    if (m.skippedOnce == null) m.skippedOnce = false;
    if (!m.grupo) m.grupo = grupoDaMissao(m.id) || undefined;
    if (m.recompensa) m.recompensa.ancientCoins = 0;
  });
}

function garantirEstruturaMissoesSemanais(): void {
  if (!missoesSemanaisData) return;
  if (!Array.isArray(missoesSemanaisData.missoes)) missoesSemanaisData.missoes = [];
  if (!Array.isArray(missoesSemanaisData.historicoEncerrado)) missoesSemanaisData.historicoEncerrado = [];
  if (!missoesSemanaisData.gradeRef) missoesSemanaisData.gradeRef = obterGradeAtualPorNivel();
  missoesSemanaisData.missoes.forEach(function (m) {
    if (m.skippedOnce == null) m.skippedOnce = false;
    if (!m.grupo) m.grupo = grupoDaMissao(m.id) || undefined;
    if (m.recompensa) m.recompensa.ancientCoins = 0;
  });
}

function cloneSeguro<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch {
    return null;
  }
}

function arquivarRotacaoDeGradeDaily(gradeDestino: DailyBossGradeTier): void {
  garantirEstruturaMissoesDiarias();
  if (!missoesDiariasData || !missoesDiariasData.missoes.length) return;

  const registro: DailyMissionRotationRecord = {
    em: new Date().toISOString(),
    gradeAnterior: missoesDiariasData.gradeRef || 'No-Grade',
    gradeNova: gradeDestino,
    missoes: cloneSeguro(missoesDiariasData.missoes) || [],
  };

  missoesDiariasData.historicoEncerrado.unshift(registro);
  if (missoesDiariasData.historicoEncerrado.length > MAX_HISTORICO_ROTACOES) {
    missoesDiariasData.historicoEncerrado.length = MAX_HISTORICO_ROTACOES;
  }
}

function arquivarRotacaoDeGradeWeekly(gradeDestino: DailyBossGradeTier): void {
  garantirEstruturaMissoesSemanais();
  if (!missoesSemanaisData || !missoesSemanaisData.missoes.length) return;

  const registro: DailyMissionRotationRecord = {
    em: new Date().toISOString(),
    gradeAnterior: missoesSemanaisData.gradeRef || 'No-Grade',
    gradeNova: gradeDestino,
    missoes: cloneSeguro(missoesSemanaisData.missoes) || [],
  };

  missoesSemanaisData.historicoEncerrado.unshift(registro);
  if (missoesSemanaisData.historicoEncerrado.length > MAX_HISTORICO_ROTACOES) {
    missoesSemanaisData.historicoEncerrado.length = MAX_HISTORICO_ROTACOES;
  }
}

function resgatarPendenciasLista(lista: DailyMissionInstance[]): { qtd: number; itens: number } {
  let qtdMissoes = 0;
  let qtdItens = 0;
  lista.forEach((m) => {
    if (m.concluida && !m.reivindicada) {
      aplicarRecompensa(m.recompensa);
      m.reivindicada = true;
      qtdMissoes++;
      if (m.recompensa && m.recompensa.itens) {
        Object.keys(m.recompensa.itens).forEach((nome) => {
          qtdItens += (m.recompensa.itens![nome] || 0);
        });
      }
    }
  });
  return { qtd: qtdMissoes, itens: qtdItens };
}

function precisaRotacionarPorGrade(gradeRef: string | DailyBossGradeTier | undefined): boolean {
  const gradeAtual = obterGradeAtualPorNivel();
  return gradeRef !== gradeAtual;
}

function aplicarRotacaoPorGradeSeNecessario(): void {
  if (!missoesDiariasData) return;
  if (!precisaRotacionarPorGrade(missoesDiariasData.gradeRef)) return;
  const gradeAntes = missoesDiariasData.gradeRef || 'No-Grade';
  const gradeNova = obterGradeAtualPorNivel();

  const pendencias = resgatarPendenciasLista(missoesDiariasData.missoes);
  if (pendencias.qtd > 0) {
    aplicarHudMissoesBadge();
    if (typeof window.atualizar === 'function') window.atualizar();
    if (typeof window.salvarJogo === 'function') window.salvarJogo();
    if (typeof window.escreverLog === 'function') {
      const msg = dailyMissionT('game.daily.logSafetyAutoClaim', { count: pendencias.qtd });
      window.escreverLog(`<span style="color:#facc15;">${msg}</span>`);
    }
  }

  arquivarRotacaoDeGradeDaily(gradeNova);
  const historicoPrevio = cloneSeguro(missoesDiariasData.historicoEncerrado) || [];
  missoesDiariasData = gerarMissoesDoDia();
  missoesDiariasData.historicoEncerrado = historicoPrevio;
  salvarMissoesDiarias();
  aplicarHudMissoesBadge();
  if (typeof window.escreverLog === 'function') {
    const msg = dailyMissionT('game.daily.logGradeUpdated', { prev: gradeAntes, next: missoesDiariasData.gradeRef });
    window.escreverLog(`<span style="color:#60a5fa; font-weight:bold;">${msg}</span>`);
  }
}

function aplicarRotacaoPorGradeSemanalSeNecessario(): void {
  if (!missoesSemanaisData) return;
  if (!precisaRotacionarPorGrade(missoesSemanaisData.gradeRef)) return;
  const gradeAntes = missoesSemanaisData.gradeRef || 'No-Grade';
  const gradeNova = obterGradeAtualPorNivel();

  const pendencias = resgatarPendenciasLista(missoesSemanaisData.missoes);
  if (pendencias.qtd > 0) {
    aplicarHudMissoesBadge();
    if (typeof window.atualizar === 'function') window.atualizar();
    if (typeof window.salvarJogo === 'function') window.salvarJogo();
    if (typeof window.escreverLog === 'function') {
      const msg = dailyMissionT('game.weekly.logSafetyAutoClaim', { count: pendencias.qtd });
      window.escreverLog(`<span style="color:#facc15;">${msg}</span>`);
    }
  }

  arquivarRotacaoDeGradeWeekly(gradeNova);
  const historicoPrevio = cloneSeguro(missoesSemanaisData.historicoEncerrado) || [];
  missoesSemanaisData = gerarMissoesDaSemana();
  missoesSemanaisData.historicoEncerrado = historicoPrevio;
  salvarMissoesSemanais();
  aplicarHudMissoesBadge();
  if (typeof window.escreverLog === 'function') {
    const msg = dailyMissionT('game.weekly.logGradeUpdated', { prev: gradeAntes, next: missoesSemanaisData.gradeRef });
    window.escreverLog(`<span style="color:#60a5fa; font-weight:bold;">${msg}</span>`);
  }
}

function inicializarMissoesDiarias(): void {
  if (!window.charName) return;
  const key = getChaveMissoesDiarias();
  const hoje = getDataHojeStr();
  const salvo = key ? localStorage.getItem(key) : null;

  if (!salvo) {
    missoesDiariasData = gerarMissoesDoDia();
    salvarMissoesDiarias();
  } else {
    try {
      const data = JSON.parse(salvo) as DailyMissionsSaveData;
      if (!data || data.data !== hoje || !Array.isArray(data.missoes)) {
        missoesDiariasData = gerarMissoesDoDia();
        salvarMissoesDiarias();
      } else {
        missoesDiariasData = data;
        garantirEstruturaMissoesDiarias();
        aplicarRotacaoPorGradeSeNecessario();
      }
    } catch {
      missoesDiariasData = gerarMissoesDoDia();
      salvarMissoesDiarias();
    }
  }

  inicializarMissoesSemanais();
  aplicarHudMissoesBadge();
}

function inicializarMissoesSemanais(): void {
  if (!window.charName) return;
  const key = getChaveMissoesSemanais();
  const weekKey = getIsoWeekKey();
  const salvo = key ? localStorage.getItem(key) : null;

  if (!salvo) {
    missoesSemanaisData = gerarMissoesDaSemana();
    salvarMissoesSemanais();
    return;
  }

  try {
    const data = JSON.parse(salvo) as WeeklyMissionsSaveData;
    if (!data || data.weekKey !== weekKey || !Array.isArray(data.missoes)) {
      missoesSemanaisData = gerarMissoesDaSemana();
      salvarMissoesSemanais();
      return;
    }
    missoesSemanaisData = data;
    garantirEstruturaMissoesSemanais();
    aplicarRotacaoPorGradeSemanalSeNecessario();
  } catch {
    missoesSemanaisData = gerarMissoesDaSemana();
    salvarMissoesSemanais();
  }
}

function aplicarProgressoEmLista(
  lista: DailyMissionInstance[],
  tipoEvento: string,
  valor: number,
  weekly: boolean,
): boolean {
  let houveMudanca = false;
  lista.forEach((m) => {
    if (m.reivindicada || m.concluida || m.tipo !== tipoEvento) return;
    const antes = m.progresso;
    m.progresso += valor;
    if (m.progresso >= m.alvo) {
      m.progresso = m.alvo;
      if (!m.concluida) {
        m.concluida = true;
        const title = tituloMissaoDiaria(m);
        if (typeof window.escreverLog === 'function') {
          const msg = dailyMissionT(
            weekly ? 'game.weekly.logMissionComplete' : 'game.daily.logMissionComplete',
            { title },
          );
          window.escreverLog('<span style="color:#34d399; font-weight:bold;">' + msg + '</span>');
        }
        mostrarToastMissaoConcluida(title, weekly);
      }
    }
    if (m.progresso !== antes) houveMudanca = true;
  });
  return houveMudanca;
}

function registrarProgressoMissao(tipoEvento: string, valor = 1): void {
  if (typeof window.registrarProgressoConquista === 'function') {
    window.registrarProgressoConquista(tipoEvento, valor);
  }
  aplicarRotacaoPorGradeSeNecessario();
  aplicarRotacaoPorGradeSemanalSeNecessario();
  if (!missoesDiariasData) inicializarMissoesDiarias();
  if (!missoesSemanaisData) inicializarMissoesSemanais();

  let houveMudanca = false;
  if (missoesDiariasData && missoesDiariasData.missoes) {
    if (aplicarProgressoEmLista(missoesDiariasData.missoes, tipoEvento, valor, false)) {
      houveMudanca = true;
      salvarMissoesDiarias();
    }
  }
  if (missoesSemanaisData && missoesSemanaisData.missoes) {
    if (aplicarProgressoEmLista(missoesSemanaisData.missoes, tipoEvento, valor, true)) {
      houveMudanca = true;
      salvarMissoesSemanais();
    }
  }

  if (houveMudanca) {
    aplicarHudMissoesBadge();
    const aberta = document.getElementById('janela-missoes-diarias');
    if (aberta && aberta.style.display === 'flex') renderizarMissoesHub();
  }

  if (typeof window.RetentionEngine?.onGameEvent === 'function') {
    window.RetentionEngine.onGameEvent(tipoEvento, valor);
  }
}

function registrarProgressoMissaoDiaria(tipoEvento: string, valor = 1): void {
  registrarProgressoMissao(tipoEvento, valor);
}

function aplicarRecompensa(recompensa: DailyMissionReward | null | undefined): void {
  if (!recompensa) return;
  if (recompensa.adenas) window.adenas += recompensa.adenas;
  // Ancient Coins are craft-only — missions never grant AC
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => {
      const qty = recompensa.itens![nome];
      if (window.InventoryManager && typeof window.InventoryManager.adicionarStack === 'function') {
        window.InventoryManager.adicionarStack(nome, qty);
      } else {
        window.inventario[nome] = (window.inventario[nome] || 0) + qty;
      }
    });
  }
}

function textoRecompensa(recompensa: DailyMissionReward): string {
  const partes: string[] = [];
  if (recompensa.adenas) partes.push(`+${recompensa.adenas}a`);
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => partes.push(`${recompensa.itens![nome]}x ${nome}`));
  }
  return partes.join(' | ');
}

function todasMissoesReivindicadas(lista: DailyMissionInstance[] | undefined): boolean {
  if (!lista || !lista.length) return false;
  return lista.every((m) => m.reivindicada);
}

function contarPendenciasLista(data: { missoes: DailyMissionInstance[]; bonusReivindicado: boolean } | null): number {
  if (!data || !Array.isArray(data.missoes)) return 0;
  let n = 0;
  data.missoes.forEach(function (m) {
    if (m.concluida && !m.reivindicada) n++;
  });
  const todasResgatadas = data.missoes.length > 0
    && data.missoes.every(function (m) { return m.reivindicada; });
  if (todasResgatadas && !data.bonusReivindicado) n++;
  return n;
}

function contarPendenciasMissoesHud(): number {
  return contarPendenciasLista(missoesDiariasData) + contarPendenciasLista(missoesSemanaisData);
}

function syncMissoesHubTabNotifs(): void {
  paintHubTabNotif('missoes-tab-daily', contarPendenciasLista(missoesDiariasData));
  paintHubTabNotif('missoes-tab-weekly', contarPendenciasLista(missoesSemanaisData));
}

function aplicarHudMissoesBadge(): void {
  syncMissoesHubTabNotifs();
  const n = contarPendenciasMissoesHud();
  window.refreshNavMenuNotifications?.({ missions: n });
}

function trackMissionClaimed(): void {
  if (typeof window.registrarProgressoMissaoDiaria === 'function') {
    window.registrarProgressoMissaoDiaria('missao_resgatada', 1);
  }
}

function reivindicarMissaoDiaria(index: number): void {
  if (!missoesDiariasData || !missoesDiariasData.missoes[index]) return;
  const m = missoesDiariasData.missoes[index];
  if (!m.concluida || m.reivindicada) return;

  m.reivindicada = true;
  aplicarRecompensa(m.recompensa);
  salvarMissoesDiarias();
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    const title = tituloMissaoDiaria(m);
    const msg = dailyMissionT('game.daily.logRewardClaimed', { title });
    window.escreverLog(`<span style="color:#facc15;">${msg}</span>`);
  }

  renderizarMissoesHub();
  aplicarHudMissoesBadge();
  trackMissionClaimed();
}

function reivindicarMissaoSemanal(index: number): void {
  if (!missoesSemanaisData || !missoesSemanaisData.missoes[index]) return;
  const m = missoesSemanaisData.missoes[index];
  if (!m.concluida || m.reivindicada) return;

  m.reivindicada = true;
  aplicarRecompensa(m.recompensa);
  salvarMissoesSemanais();
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    const title = tituloMissaoDiaria(m);
    const msg = dailyMissionT('game.weekly.logRewardClaimed', { title });
    window.escreverLog(`<span style="color:#facc15;">${msg}</span>`);
  }

  renderizarMissoesHub();
  aplicarHudMissoesBadge();
  trackMissionClaimed();
}

function montarBonusDiario(gradeAtual: DailyBossGradeTier | string): DailyMissionReward {
  const mod = obterModificadorGrade(gradeAtual);
  const baseBonus = montarRecompensaPorGrade(gradeAtual, 'arena');
  return {
    adenas: (baseBonus.adenas || 0) + Math.floor(18000 * mod),
    ancientCoins: 0,
    itens: {
      ...(baseBonus.itens || {}),
      'Mana Potion': 8 + Math.floor(4 * mod),
      'HP Potion': 6 + Math.floor(3 * mod),
    },
  };
}

function montarBonusSemanal(gradeAtual: DailyBossGradeTier | string): DailyMissionReward {
  const mod = obterModificadorGrade(gradeAtual);
  const baseBonus = montarRecompensaPorGrade(gradeAtual, 'arena', WEEKLY_REWARD_SCALE);
  const gradeLabel = gradeAtual === 'No-Grade' ? 'NG' : gradeAtual;
  const scrollA = `Enchant Armor (${gradeLabel})`;
  return {
    adenas: (baseBonus.adenas || 0) + Math.floor(95000 * mod),
    ancientCoins: 0,
    itens: {
      ...(baseBonus.itens || {}),
      [scrollA]: Math.max(1, (baseBonus.itens && baseBonus.itens[scrollA]) || 0) + 1,
      'Mana Potion': 18 + Math.floor(8 * mod),
      'HP Potion': 16 + Math.floor(6 * mod),
    },
  };
}

function htmlRecompensaMissao(
  recompensa: DailyMissionReward,
  weekly: boolean,
): string {
  const prefix = weekly ? 'game.weekly' : 'game.daily';
  const icons = htmlMissionRewardIcons(recompensa, {
    adena: dailyMissionT('game.achievements.rowAdena'),
    ac: dailyMissionT('game.achievements.rowAc'),
  });
  const fallback = escapeHtmlDaily(textoRecompensa(recompensa));
  if (!icons) {
    return '<div class="daily-mission-card__reward">' + escapeHtmlDaily(dailyMissionT(prefix + '.reward')) + ' ' + fallback + '</div>';
  }
  return '<div class="daily-mission-card__reward" aria-label="' + fallback + '">'
    + '<span class="daily-mission-card__reward-label">' + escapeHtmlDaily(dailyMissionT(prefix + '.reward')) + '</span>'
    + icons
    + '</div>';
}

function reivindicarBonusMissaoDiaria(): void {
  if (!missoesDiariasData || missoesDiariasData.bonusReivindicado || !todasMissoesReivindicadas(missoesDiariasData.missoes)) return;
  const gradeAtual = missoesDiariasData.gradeRef || obterGradeAtualPorNivel();
  const bonus = montarBonusDiario(gradeAtual);
  aplicarRecompensa(bonus);
  missoesDiariasData.bonusReivindicado = true;
  salvarMissoesDiarias();
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    const msg = dailyMissionT('game.daily.logBonusClaimed');
    window.escreverLog(`<span style="color:#a855f7; font-weight:bold;">${msg}</span>`);
  }
  renderizarMissoesHub();
  aplicarHudMissoesBadge();
  trackMissionClaimed();
}

function reivindicarBonusMissaoSemanal(): void {
  if (!missoesSemanaisData || missoesSemanaisData.bonusReivindicado || !todasMissoesReivindicadas(missoesSemanaisData.missoes)) return;
  const gradeAtual = missoesSemanaisData.gradeRef || obterGradeAtualPorNivel();
  const bonus = montarBonusSemanal(gradeAtual);
  aplicarRecompensa(bonus);
  missoesSemanaisData.bonusReivindicado = true;
  salvarMissoesSemanais();
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    const msg = dailyMissionT('game.weekly.logBonusClaimed');
    window.escreverLog(`<span style="color:#a855f7; font-weight:bold;">${msg}</span>`);
  }
  renderizarMissoesHub();
  aplicarHudMissoesBadge();
  trackMissionClaimed();
}

function encontrarCandidatoReroll(
  seedBase: number,
  grade: DailyBossGradeTier | string,
  grupo: DailyMissionGroup,
  idsOcupados: DailyMissionId[],
  weekly: boolean,
): DailyMissionTemplate | null {
  const pool = gerarPoolMissoes(seedBase, grade as DailyBossGradeTier, weekly
    ? { targetScale: WEEKLY_TARGET_SCALE, rewardScale: WEEKLY_REWARD_SCALE }
    : undefined);
  const idsGrupo = GRUPOS_MISSAO[grupo] || [];
  const candidatos = pool.filter(function (m) {
    return idsGrupo.indexOf(m.id) >= 0 && idsOcupados.indexOf(m.id) < 0;
  });
  if (!candidatos.length) return null;
  const pos = Math.floor(randomBySeed(seedBase + Date.now() % 997 + 17) * candidatos.length);
  return candidatos[pos] || null;
}

function executarRerollMissao(
  lista: DailyMissionInstance[],
  index: number,
  seedKey: string,
  gradeRef: DailyBossGradeTier | string,
  weekly: boolean,
): boolean {
  const m = lista[index];
  if (!m || m.concluida || m.reivindicada || m.skippedOnce) return false;
  const grupo = m.grupo || grupoDaMissao(m.id);
  if (!grupo) return false;
  const idsOcupados = lista.map(function (x) { return x.id; });
  const seed = hashString(seedKey + '_skip_' + index + '_' + (m.id || ''));
  const nova = encontrarCandidatoReroll(seed, gradeRef, grupo, idsOcupados, weekly);
  if (!nova) {
    if (typeof window.l2Alert === 'function') {
      window.l2Alert(dailyMissionT('game.missions.skipNoAlternative'));
    }
    return false;
  }
  lista[index] = {
    ...nova,
    grupo,
    progresso: 0,
    concluida: false,
    reivindicada: false,
    skippedOnce: true,
  };
  return true;
}

function pularMissaoDiaria(index: number): void {
  if (!missoesDiariasData || !missoesDiariasData.missoes[index]) return;
  const m = missoesDiariasData.missoes[index];
  if (m.concluida || m.reivindicada || m.skippedOnce) return;

  const title = tituloMissaoDiaria(m);
  const confirmMsg = dailyMissionT('game.missions.skipConfirm', { title });
  const doSkip = function () {
    const ok = executarRerollMissao(
      missoesDiariasData!.missoes,
      index,
      `${window.charName}_${missoesDiariasData!.data}`,
      missoesDiariasData!.gradeRef || obterGradeAtualPorNivel(),
      false,
    );
    if (!ok) return;
    salvarMissoesDiarias();
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(
        '<span style="color:#93c5fd;">' + dailyMissionT('game.missions.logSkipped', { title }) + '</span>',
      );
    }
    renderizarMissoesHub();
    aplicarHudMissoesBadge();
  };

  if (typeof window.l2Confirm === 'function') {
    void Promise.resolve(window.l2Confirm(confirmMsg)).then(function (yes) {
      if (yes) doSkip();
    });
  } else {
    doSkip();
  }
}

function pularMissaoSemanal(index: number): void {
  if (!missoesSemanaisData || !missoesSemanaisData.missoes[index]) return;
  const m = missoesSemanaisData.missoes[index];
  if (m.concluida || m.reivindicada || m.skippedOnce) return;

  const title = tituloMissaoDiaria(m);
  const confirmMsg = dailyMissionT('game.missions.skipConfirm', { title });
  const doSkip = function () {
    const ok = executarRerollMissao(
      missoesSemanaisData!.missoes,
      index,
      `${window.charName}_${missoesSemanaisData!.weekKey}`,
      missoesSemanaisData!.gradeRef || obterGradeAtualPorNivel(),
      true,
    );
    if (!ok) return;
    salvarMissoesSemanais();
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(
        '<span style="color:#93c5fd;">' + dailyMissionT('game.missions.logSkipped', { title }) + '</span>',
      );
    }
    renderizarMissoesHub();
    aplicarHudMissoesBadge();
  };

  if (typeof window.l2Confirm === 'function') {
    void Promise.resolve(window.l2Confirm(confirmMsg)).then(function (yes) {
      if (yes) doSkip();
    });
  } else {
    doSkip();
  }
}

function escapeHtmlDaily(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderizarListaMissoes(
  container: HTMLElement,
  lista: DailyMissionInstance[],
  claimFn: string,
  skipFn: string,
  weekly = false,
): void {
  container.innerHTML = '';
  const labClaimed = dailyMissionT('game.daily.claimed');
  const labClaim = dailyMissionT('game.daily.claim');
  const labProgress = dailyMissionT('game.daily.inProgress');
  const labWhere = dailyMissionT('game.daily.whereTo');
  const labSkip = dailyMissionT('game.missions.skipBtn');
  const labSkipped = dailyMissionT('game.missions.skipUsed');

  const indexed = lista.map((m, originalIndex) => ({ m, originalIndex }));
  const sorted = sortMissionEntries(
    indexed,
    ({ m }) => missionCardSortState(m),
    ({ originalIndex }) => originalIndex,
  );

  sorted.forEach(function ({ m, originalIndex }) {
    const idx = originalIndex;
    const pct = m.alvo > 0 ? Math.min(100, Math.floor((m.progresso / m.alvo) * 100)) : 0;
    const cardClass = m.reivindicada
      ? 'daily-mission-card daily-mission-card--claimed'
      : m.concluida
        ? 'daily-mission-card daily-mission-card--claimable'
        : 'daily-mission-card';
    const btn = m.reivindicada
      ? '<button type="button" class="btn-l2 daily-mission-card__btn daily-mission-card__btn--claimed" disabled>' + escapeHtmlDaily(labClaimed) + '</button>'
      : m.concluida
        ? '<button type="button" class="btn-l2 daily-mission-card__btn daily-mission-card__btn--claim" onclick="' + claimFn + '(' + idx + ')">' + escapeHtmlDaily(labClaim) + '</button>'
        : '<button type="button" class="btn-l2 daily-mission-card__btn" disabled>' + escapeHtmlDaily(labProgress) + '</button>';

    let skipBtn = '';
    if (!m.concluida && !m.reivindicada) {
      if (m.skippedOnce) {
        skipBtn = '<button type="button" class="btn-l2 daily-mission-card__skip daily-mission-card__skip--used" disabled>' + escapeHtmlDaily(labSkipped) + '</button>';
      } else {
        skipBtn = '<button type="button" class="btn-l2 daily-mission-card__skip" onclick="' + skipFn + '(' + idx + ')">' + escapeHtmlDaily(labSkip) + '</button>';
      }
    }

    const mtit = escapeHtmlDaily(tituloMissaoDiaria(m));
    const mdesc = escapeHtmlDaily(descMissaoDiaria(m));
    const mhint = escapeHtmlDaily(hintMissaoDiaria(m));
    const hintBlock = mhint
      ? '<div class="daily-mission-card__hint"><span class="daily-mission-card__hint-label">' + escapeHtmlDaily(labWhere) + '</span> ' + mhint + '</div>'
      : '';

    container.innerHTML += ''
      + '<article class="' + cardClass + '">'
      + '<div class="daily-mission-card__head">'
      + '<div class="daily-mission-card__info">'
      + '<div class="daily-mission-card__title">' + escapeHtmlDaily(m.icone) + ' ' + mtit + '</div>'
      + '<div class="daily-mission-card__desc"' + (mdesc ? ' title="' + escapeHtmlDaily(mdesc) + '"' : '') + '>' + escapeHtmlDaily(mdesc) + '</div>'
      + hintBlock
      + htmlRecompensaMissao(m.recompensa, weekly)
      + '</div>'
      + '<div class="daily-mission-card__actions">'
      + btn
      + skipBtn
      + '</div>'
      + '</div>'
      + '<div class="daily-mission-card__track">'
      + '<div class="daily-mission-card__bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + m.alvo + '" aria-valuenow="' + m.progresso + '">'
      + '<div class="daily-mission-card__bar-fill" style="width:' + pct + '%;"></div>'
      + '</div>'
      + '<div class="daily-mission-card__nums">' + m.progresso + '/' + m.alvo + ' <span class="daily-mission-card__pct">(' + pct + '%)</span></div>'
      + '</div>'
      + '</article>';
  });
}

function renderizarBonusBox(
  bonusBox: HTMLElement,
  data: DailyMissionsSaveData | WeeklyMissionsSaveData,
  weekly: boolean,
): void {
  const lista = data.missoes || [];
  const pending = lista.filter(function (m) { return m.concluida && !m.reivindicada; }).length;
  const gradeAtual = data.gradeRef || obterGradeAtualPorNivel();
  const bonusPronto = todasMissoesReivindicadas(lista);
  const temPendenteResgate = pending > 0;
  const bonusResgatado = !!data.bonusReivindicado;
  const bonusPreview = weekly
    ? montarBonusSemanal(gradeAtual)
    : montarBonusDiario(gradeAtual);
  const bonusIcons = htmlMissionRewardIcons(bonusPreview, {
    adena: dailyMissionT('game.achievements.rowAdena'),
    ac: dailyMissionT('game.achievements.rowAc'),
  });
  const ultimoHistorico = (data.historicoEncerrado && data.historicoEncerrado[0])
    ? data.historicoEncerrado[0]
    : null;
  const prefix = weekly ? 'game.weekly' : 'game.daily';
  const txtHistorico = ultimoHistorico
    ? dailyMissionT(prefix + '.historyGradeChange', { prev: ultimoHistorico.gradeAnterior, next: ultimoHistorico.gradeNova })
    : dailyMissionT(prefix + '.historyNone');

  const titBonus = dailyMissionT(prefix + '.finalBonusTitle');
  const linhaGrade = dailyMissionT(prefix + '.activeGradeLine', { grade: gradeAtual, tiers: GRADES_L2_OFICIAIS.join(' > ') });
  const btnBonusClaimed = dailyMissionT(prefix + '.bonusClaimed');
  const btnClaimFinal = dailyMissionT(prefix + '.claimFinalBonus');
  const btnCompleteAll = dailyMissionT(prefix + '.completeAllMissions');
  const btnClaimPending = dailyMissionT(prefix + '.claimPendingFirst');
  const claimFn = weekly ? 'reivindicarBonusMissaoSemanal()' : 'reivindicarBonusMissaoDiaria()';

  let pips = '';
  lista.forEach(function (m) {
    const pipClass = m.reivindicada ? 'daily-bonus-pip daily-bonus-pip--claimed'
      : m.concluida ? 'daily-bonus-pip daily-bonus-pip--ready' : 'daily-bonus-pip';
    pips += '<span class="' + pipClass + '" aria-hidden="true"></span>';
  });

  let bonusBtn: string;
  if (bonusResgatado) {
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn daily-bonus__btn--claimed" disabled>' + escapeHtmlDaily(btnBonusClaimed) + '</button>';
  } else if (bonusPronto) {
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn daily-bonus__btn--ready" onclick="' + claimFn + '">' + escapeHtmlDaily(btnClaimFinal) + '</button>';
  } else if (temPendenteResgate) {
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn" disabled>' + escapeHtmlDaily(btnClaimPending) + '</button>';
  } else {
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn" disabled>' + escapeHtmlDaily(btnCompleteAll) + '</button>';
  }

  bonusBox.innerHTML = ''
    + '<div class="daily-bonus__title">' + escapeHtmlDaily(titBonus) + '</div>'
    + '<div class="daily-bonus-pips" aria-hidden="true">' + pips + '</div>'
    + '<div class="daily-bonus__grade">' + escapeHtmlDaily(linhaGrade) + '</div>'
    + '<div class="daily-bonus__preview">' + (bonusIcons || '') + '</div>'
    + '<div class="daily-bonus__history">' + escapeHtmlDaily(txtHistorico) + '</div>'
    + bonusBtn;
}

function syncMissoesHubTabsUi(): void {
  const tabDaily = document.getElementById('missoes-tab-daily');
  const tabWeekly = document.getElementById('missoes-tab-weekly');
  const panelDaily = document.getElementById('missoes-panel-daily');
  const panelWeekly = document.getElementById('missoes-panel-weekly');
  const hint = document.getElementById('missoes-hub-hint');
  const isDaily = missoesHubTab === 'daily';

  if (tabDaily) {
    tabDaily.classList.toggle('missoes-hub-tab--active', isDaily);
    tabDaily.setAttribute('aria-selected', isDaily ? 'true' : 'false');
  }
  if (tabWeekly) {
    tabWeekly.classList.toggle('missoes-hub-tab--active', !isDaily);
    tabWeekly.setAttribute('aria-selected', !isDaily ? 'true' : 'false');
  }
  if (panelDaily) panelDaily.style.display = isDaily ? 'flex' : 'none';
  if (panelWeekly) panelWeekly.style.display = isDaily ? 'none' : 'flex';
  if (hint) {
    hint.textContent = dailyMissionT(isDaily ? 'game.daily.modalHint' : 'game.weekly.modalHint');
  }
}

function setMissoesHubTab(tab: MissionsHubTab): void {
  missoesHubTab = tab === 'weekly' ? 'weekly' : 'daily';
  syncMissoesHubTabsUi();
  renderizarMissoesHub();
}

function renderizarMissoesDiarias(): void {
  const container = document.getElementById('missoes-diarias-container');
  const bonusBox = document.getElementById('missoes-bonus-box');
  const summaryEl = document.getElementById('missoes-progress-summary');
  if (!container || !bonusBox || !missoesDiariasData) return;
  aplicarRotacaoPorGradeSeNecessario();
  const lista = missoesDiariasData.missoes || [];
  const total = lista.length;
  const done = lista.filter(function (m) { return m.concluida; }).length;
  const pending = lista.filter(function (m) { return m.concluida && !m.reivindicada; }).length;

  if (summaryEl) {
    summaryEl.textContent = dailyMissionT('game.daily.progressLine', { done, total, pending });
  }

  renderizarListaMissoes(container, lista, 'reivindicarMissaoDiaria', 'pularMissaoDiaria', false);
  renderizarBonusBox(bonusBox, missoesDiariasData, false);
  scrollClaimableIntoView(container, '.daily-mission-card--claimable');
}

function renderizarMissoesSemanais(): void {
  const container = document.getElementById('missoes-semanais-container');
  const bonusBox = document.getElementById('missoes-bonus-box-weekly');
  const summaryEl = document.getElementById('missoes-progress-summary-weekly');
  if (!container || !bonusBox || !missoesSemanaisData) return;
  aplicarRotacaoPorGradeSemanalSeNecessario();
  const lista = missoesSemanaisData.missoes || [];
  const total = lista.length;
  const done = lista.filter(function (m) { return m.concluida; }).length;
  const pending = lista.filter(function (m) { return m.concluida && !m.reivindicada; }).length;

  if (summaryEl) {
    summaryEl.textContent = dailyMissionT('game.weekly.progressLine', {
      done,
      total,
      pending,
      week: missoesSemanaisData.weekKey || getIsoWeekKey(),
    });
  }

  renderizarListaMissoes(container, lista, 'reivindicarMissaoSemanal', 'pularMissaoSemanal', true);
  renderizarBonusBox(bonusBox, missoesSemanaisData, true);
  scrollClaimableIntoView(container, '.daily-mission-card--claimable');
}

function renderizarMissoesHub(): void {
  syncMissoesHubTabsUi();
  if (missoesHubTab === 'weekly') {
    renderizarMissoesSemanais();
  } else {
    renderizarMissoesDiarias();
  }
}

function abrirMissoesDiarias(): void {
  abrirMissoes();
}

function abrirMissoes(): void {
  if (!window.charName) return;
  if (!missoesDiariasData) inicializarMissoesDiarias();
  if (!missoesSemanaisData) inicializarMissoesSemanais();
  aplicarRotacaoPorGradeSeNecessario();
  aplicarRotacaoPorGradeSemanalSeNecessario();
  renderizarMissoesHub();
  aplicarHudMissoesBadge();
  const root = document.getElementById('janela-missoes-diarias');
  if (root && window.I18n && typeof window.I18n.refreshDom === 'function') {
    try { window.I18n.refreshDom(root); } catch { /* ignore */ }
  }
  window.abrirModal('janela-missoes-diarias', 1500);
  window.syncNavMenuActiveItem?.();
}

function fecharMissoesDiarias(): void {
  window.fecharModal('janela-missoes-diarias');
  window.syncNavMenuActiveItem?.();
}

window.inicializarMissoesDiarias = inicializarMissoesDiarias;
window.inicializarMissoesSemanais = inicializarMissoesSemanais;
window.registrarProgressoMissaoDiaria = registrarProgressoMissaoDiaria;
window.registrarProgressoMissao = registrarProgressoMissao;
window.aplicarHudMissoesBadge = aplicarHudMissoesBadge;
window.syncMissoesHubTabNotifs = syncMissoesHubTabNotifs;
window.reivindicarMissaoDiaria = reivindicarMissaoDiaria;
window.reivindicarBonusMissaoDiaria = reivindicarBonusMissaoDiaria;
window.reivindicarMissaoSemanal = reivindicarMissaoSemanal;
window.reivindicarBonusMissaoSemanal = reivindicarBonusMissaoSemanal;
window.pularMissaoDiaria = pularMissaoDiaria;
window.pularMissaoSemanal = pularMissaoSemanal;
window.setMissoesHubTab = setMissoesHubTab;
window.renderizarMissoesDiarias = renderizarMissoesDiarias;
window.renderizarMissoesSemanais = renderizarMissoesSemanais;
window.renderizarMissoesHub = renderizarMissoesHub;
window.abrirMissoesDiarias = abrirMissoesDiarias;
window.abrirMissoes = abrirMissoes;
window.fecharMissoesDiarias = fecharMissoesDiarias;

void GRUPOS_MISSAO_DIARIA;

export {};
