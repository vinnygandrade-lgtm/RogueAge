/**
 * UI — Missões Diárias
 * Migrado: js/ui_daily_missions.js — Fase 4: tipos explícitos.
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
} from '../types/game';

let missoesDiariasData: DailyMissionsSaveData | null = null;

const GRADES_L2_OFICIAIS: readonly DailyBossGradeTier[] = ['No-Grade', 'D', 'C', 'B', 'A', 'S'];
const MAX_HISTORICO_ROTACOES = 12;

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

const GRUPOS_MISSAO_DIARIA: Record<DailyMissionGroup, DailyMissionId[]> = {
  farm: ['hunt_pack', 'champion_hunter'],
  economy: ['forge_minter', 'adena_farmer'],
  challenge: ['arena_blood', 'daily_boss_slayer', 'battle_alchemist'],
};

function mostrarToastMissaoConcluida(title: string): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  if (container.children.length >= 2 && container.firstElementChild) {
    container.removeChild(container.firstElementChild);
  }
  const msg = dailyMissionT('game.daily.toastMissionComplete', { title: title || '' });
  const toast = document.createElement('div');
  toast.className = 'toast-msg toast-msg--mission';
  toast.innerHTML = '✨ ' + msg;
  container.appendChild(toast);
  setTimeout(function () {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
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
  const mod = obterModificadorGrade(grade);

  if (pacote === 'farm') {
    return {
      adenas: Math.floor(2500 * mod),
      ancientCoins: 0,
      itens: shotRecompensa ? { [shotRecompensa]: Math.floor(40 * mod) } : { [scrollA]: 1 },
    };
  }

  if (pacote === 'champion') {
    return {
      adenas: Math.floor(4200 * mod),
      ancientCoins: 0,
      itens: { [scrollA]: 1 },
    };
  }

  if (pacote === 'arena') {
    const itens: Record<string, number> = { [scrollW]: 1 };
    if (shotRecompensa) itens[shotRecompensa] = Math.floor(15 * mod);
    return {
      adenas: Math.floor(6000 * mod),
      ancientCoins: 0,
      itens,
    };
  }

  if (pacote === 'pocao') {
    return {
      adenas: Math.floor(3000 * mod),
      ancientCoins: 0,
      itens: {
        'HP Potion': Math.floor(5 * mod),
        'Mana Potion': Math.floor(3 * mod),
      },
    };
  }

  return {
    adenas: Math.floor(3500 * mod),
    ancientCoins: 0,
    itens: { [scrollA]: 1 },
  };
}

function getChaveMissoesDiarias(): string | null {
  if (!window.charName) return null;
  return `l2mini_daily_${window.charName.toLowerCase()}`;
}

function getDataHojeStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

function gerarPoolMissoes(seedBase: number, gradeAtual: DailyBossGradeTier): DailyMissionTemplate[] {
  const baseSeed = seedBase || 1;
  const mod = obterModificadorGrade(gradeAtual);
  return [
    {
      id: 'hunt_pack',
      titulo: 'Ambush Slayer',
      desc: 'Defeat common mobs while hunting.',
      tipo: 'matar_monstros',
      alvo: Math.floor((26 + Math.floor(randomBySeed(baseSeed + 11) * 20)) * (1 + (mod * 0.12))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'farm'),
      icone: '🗡️',
    },
    {
      id: 'champion_hunter',
      titulo: 'Champion Hunter',
      desc: 'Slay golden champions in hunting zones.',
      tipo: 'matar_champions',
      alvo: Math.max(2, Math.floor((2 + Math.floor(randomBySeed(baseSeed + 21) * 3)) * (1 + (mod * 0.08)))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'champion'),
      icone: '👑',
    },
    {
      id: 'forge_minter',
      titulo: 'Iron Gate Mint',
      desc: 'Try minting an Ancient Coin at the forge (Materials tab).',
      tipo: 'tentar_mint',
      alvo: Math.max(1, Math.floor(1 + randomBySeed(baseSeed + 31) * 2)),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'base'),
      icone: '🔥',
    },
    {
      id: 'adena_farmer',
      titulo: 'Adena Pouch',
      desc: 'Earn Adena from combat and events.',
      tipo: 'ganhar_adena',
      alvo: Math.floor((9000 + Math.floor(randomBySeed(baseSeed + 41) * 14000)) * (1 + (mod * 0.25))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'base'),
      icone: '💰',
    },
    {
      id: 'arena_blood',
      titulo: 'Blood on the Sand',
      desc: 'Win Grand Olympiad duels.',
      tipo: 'vencer_olympiad',
      alvo: 1 + Math.floor(randomBySeed(baseSeed + 51) * 2),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'arena'),
      icone: '⚔️',
    },
    {
      id: 'daily_boss_slayer',
      titulo: 'Lord of the Day',
      desc: 'Clear your grade’s Daily Boss (WORLD).',
      tipo: 'derrotar_daily_boss',
      alvo: 1,
      recompensa: montarRecompensaPorGrade(gradeAtual, 'champion'),
      icone: '👹',
    },
    {
      id: 'battle_alchemist',
      titulo: 'Battle Alchemist',
      desc: 'Use potions in combat to stay alive.',
      tipo: 'usar_pocoes',
      alvo: Math.floor((8 + Math.floor(randomBySeed(baseSeed + 61) * 10)) * (1 + (mod * 0.10))),
      recompensa: montarRecompensaPorGrade(gradeAtual, 'pocao'),
      icone: '🧪',
    },
  ];
}

function gerarMissoesDoDia(): DailyMissionsSaveData {
  const dia = getDataHojeStr();
  const gradeAtual = obterGradeAtualPorNivel();
  const seed = hashString(`${window.charName}_${dia}`);
  const pool = gerarPoolMissoes(seed, gradeAtual);
  const escolhidas: DailyMissionInstance[] = [];
  const ordemGrupos: DailyMissionGroup[] = ['farm', 'economy', 'challenge'];

  ordemGrupos.forEach(function (grupo, gi) {
    const ids = GRUPOS_MISSAO_DIARIA[grupo] || [];
    const candidatos = pool.filter(function (m) { return ids.indexOf(m.id) >= 0; });
    if (!candidatos.length) return;
    const pos = Math.floor(randomBySeed(seed + (gi * 13) + 3) * candidatos.length);
    const missao = candidatos[pos];
    escolhidas.push({
      ...missao,
      progresso: 0,
      concluida: false,
      reivindicada: false,
    });
  });

  let idx = 0;
  while (escolhidas.length < 3 && idx < 24) {
    const pos = Math.floor(randomBySeed(seed + (idx * 7)) * pool.length);
    const missao = pool[pos];
    if (!escolhidas.find(function (m) { return m.id === missao.id; })) {
      escolhidas.push({
        ...missao,
        progresso: 0,
        concluida: false,
        reivindicada: false,
      });
    }
    idx++;
  }

  return {
    data: dia,
    gradeRef: gradeAtual,
    bonusReivindicado: false,
    missoes: escolhidas,
    historicoEncerrado: [],
  };
}

function salvarMissoesDiarias(): void {
  const key = getChaveMissoesDiarias();
  if (!key || !missoesDiariasData) return;
  localStorage.setItem(key, JSON.stringify(missoesDiariasData));
}

function garantirEstruturaMissoesDiarias(): void {
  if (!missoesDiariasData) return;
  if (!Array.isArray(missoesDiariasData.missoes)) missoesDiariasData.missoes = [];
  if (!Array.isArray(missoesDiariasData.historicoEncerrado)) missoesDiariasData.historicoEncerrado = [];
  if (!missoesDiariasData.gradeRef) missoesDiariasData.gradeRef = obterGradeAtualPorNivel();
}

function cloneSeguro<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch {
    return null;
  }
}

function arquivarRotacaoDeGrade(gradeDestino: DailyBossGradeTier): void {
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

function resgatarPendenciasConcluidasAntesRotacao(): { qtd: number; itens: number } {
  garantirEstruturaMissoesDiarias();
  if (!missoesDiariasData) return { qtd: 0, itens: 0 };

  let qtdMissoes = 0;
  let qtdItens = 0;
  missoesDiariasData.missoes.forEach((m) => {
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

function precisaRotacionarPorGrade(data: DailyMissionsSaveData | null): boolean {
  if (!data) return true;
  const gradeAtual = obterGradeAtualPorNivel();
  return data.gradeRef !== gradeAtual;
}

function aplicarRotacaoPorGradeSeNecessario(): void {
  if (!missoesDiariasData) return;
  if (!precisaRotacionarPorGrade(missoesDiariasData)) return;
  const gradeAntes = missoesDiariasData.gradeRef || 'No-Grade';
  const gradeNova = obterGradeAtualPorNivel();

  const pendencias = resgatarPendenciasConcluidasAntesRotacao();
  if (pendencias.qtd > 0) {
    aplicarHudMissoesBadge();
    if (typeof window.atualizar === 'function') window.atualizar();
    if (typeof window.salvarJogo === 'function') window.salvarJogo();
    if (typeof window.escreverLog === 'function') {
      const msg = dailyMissionT('game.daily.logSafetyAutoClaim', { count: pendencias.qtd });
      window.escreverLog(`<span style="color:#facc15;">${msg}</span>`);
    }
  }

  arquivarRotacaoDeGrade(gradeNova);
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

function inicializarMissoesDiarias(): void {
  if (!window.charName) return;
  const key = getChaveMissoesDiarias();
  const hoje = getDataHojeStr();
  const salvo = key ? localStorage.getItem(key) : null;

  if (!salvo) {
    missoesDiariasData = gerarMissoesDoDia();
    salvarMissoesDiarias();
    aplicarHudMissoesBadge();
    return;
  }

  try {
    const data = JSON.parse(salvo) as DailyMissionsSaveData;
    if (!data || data.data !== hoje || !Array.isArray(data.missoes)) {
      missoesDiariasData = gerarMissoesDoDia();
      salvarMissoesDiarias();
      aplicarHudMissoesBadge();
      return;
    }
    missoesDiariasData = data;
    garantirEstruturaMissoesDiarias();
    aplicarRotacaoPorGradeSeNecessario();
  } catch {
    missoesDiariasData = gerarMissoesDoDia();
    salvarMissoesDiarias();
  }
  aplicarHudMissoesBadge();
}

function registrarProgressoMissaoDiaria(tipoEvento: string, valor = 1): void {
  aplicarRotacaoPorGradeSeNecessario();
  if (!missoesDiariasData || !missoesDiariasData.missoes) return;
  let houveMudanca = false;

  missoesDiariasData.missoes.forEach((m) => {
    if (m.reivindicada || m.concluida || m.tipo !== tipoEvento) return;
    const antes = m.progresso;
    m.progresso += valor;
    if (m.progresso >= m.alvo) {
      m.progresso = m.alvo;
      if (!m.concluida) {
        m.concluida = true;
        const title = tituloMissaoDiaria(m);
        if (typeof window.escreverLog === 'function') {
          const msg = dailyMissionT('game.daily.logMissionComplete', { title });
          window.escreverLog('<span style="color:#34d399; font-weight:bold;">' + msg + '</span>');
        }
        mostrarToastMissaoConcluida(title);
      }
    }
    if (m.progresso !== antes) houveMudanca = true;
  });

  if (houveMudanca) {
    salvarMissoesDiarias();
    aplicarHudMissoesBadge();
    const aberta = document.getElementById('janela-missoes-diarias');
    if (aberta && aberta.style.display === 'flex') renderizarMissoesDiarias();
  }
}

function aplicarRecompensa(recompensa: DailyMissionReward | null | undefined): void {
  if (!recompensa) return;
  if (recompensa.adenas) window.adenas += recompensa.adenas;
  if (recompensa.ancientCoins) window.ancientCoins += recompensa.ancientCoins;
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
  if (recompensa.ancientCoins) partes.push(`+${recompensa.ancientCoins} AC`);
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => partes.push(`${recompensa.itens![nome]}x ${nome}`));
  }
  return partes.join(' | ');
}

function todasMissoesConcluidas(): boolean {
  if (!missoesDiariasData || !missoesDiariasData.missoes) return false;
  return missoesDiariasData.missoes.every((m) => m.reivindicada);
}

function contarPendenciasMissoesHud(): number {
  if (!missoesDiariasData || !Array.isArray(missoesDiariasData.missoes)) return 0;
  let n = 0;
  missoesDiariasData.missoes.forEach(function (m) {
    if (m.concluida && !m.reivindicada) n++;
  });
  const todasResgatadas = missoesDiariasData.missoes.length > 0
    && missoesDiariasData.missoes.every(function (m) { return m.reivindicada; });
  if (todasResgatadas && !missoesDiariasData.bonusReivindicado) n++;
  return n;
}

function aplicarHudMissoesBadge(): void {
  const btn = document.getElementById('btn-hud-missoes');
  const badge = document.getElementById('missoes-notif-badge');
  if (!btn || !badge) return;

  const n = contarPendenciasMissoesHud();
  if (n > 0) {
    btn.classList.add('notif-icon-flashing');
    badge.style.display = 'flex';
    badge.innerText = n > 9 ? '9+' : String(n);
  } else {
    btn.classList.remove('notif-icon-flashing');
    badge.style.display = 'none';
    badge.innerText = '';
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

  renderizarMissoesDiarias();
  aplicarHudMissoesBadge();
}

function reivindicarBonusMissaoDiaria(): void {
  if (!missoesDiariasData || missoesDiariasData.bonusReivindicado || !todasMissoesConcluidas()) return;
  const gradeAtual = missoesDiariasData.gradeRef || obterGradeAtualPorNivel();
  const mod = obterModificadorGrade(gradeAtual);
  const baseBonus = montarRecompensaPorGrade(gradeAtual, 'arena');
  const bonus: DailyMissionReward = {
    adenas: (baseBonus.adenas || 0) + Math.floor(12000 * mod),
    ancientCoins: (baseBonus.ancientCoins || 0) + Math.floor(10 * mod),
    itens: {
      ...(baseBonus.itens || {}),
      'Mana Potion': 6 + Math.floor(3 * mod),
    },
  };
  aplicarRecompensa(bonus);
  missoesDiariasData.bonusReivindicado = true;
  salvarMissoesDiarias();
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.escreverLog === 'function') {
    const msg = dailyMissionT('game.daily.logBonusClaimed');
    window.escreverLog(`<span style="color:#a855f7; font-weight:bold;">${msg}</span>`);
  }
  renderizarMissoesDiarias();
  aplicarHudMissoesBadge();
}

function escapeHtmlDaily(str: unknown): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderizarMissoesDiarias(): void {
  const container = document.getElementById('missoes-diarias-container');
  const bonusBox = document.getElementById('missoes-bonus-box');
  const summaryEl = document.getElementById('missoes-progress-summary');
  if (!container || !bonusBox || !missoesDiariasData) return;
  aplicarRotacaoPorGradeSeNecessario();
  const gradeAtual = missoesDiariasData.gradeRef || obterGradeAtualPorNivel();
  const lista = missoesDiariasData.missoes || [];
  const total = lista.length;
  const done = lista.filter(function (m) { return m.concluida; }).length;
  const pending = lista.filter(function (m) { return m.concluida && !m.reivindicada; }).length;

  if (summaryEl) {
    summaryEl.textContent = dailyMissionT('game.daily.progressLine', { done, total, pending });
  }

  container.innerHTML = '';
  const labClaimed = dailyMissionT('game.daily.claimed');
  const labClaim = dailyMissionT('game.daily.claim');
  const labProgress = dailyMissionT('game.daily.inProgress');
  const labReward = dailyMissionT('game.daily.reward');
  const labWhere = dailyMissionT('game.daily.whereTo');

  lista.forEach(function (m, idx) {
    const pct = m.alvo > 0 ? Math.min(100, Math.floor((m.progresso / m.alvo) * 100)) : 0;
    const cardClass = m.reivindicada
      ? 'daily-mission-card daily-mission-card--claimed'
      : m.concluida
        ? 'daily-mission-card daily-mission-card--claimable'
        : 'daily-mission-card';
    const btn = m.reivindicada
      ? '<button type="button" class="btn-l2 daily-mission-card__btn daily-mission-card__btn--claimed" disabled>' + escapeHtmlDaily(labClaimed) + '</button>'
      : m.concluida
        ? '<button type="button" class="btn-l2 daily-mission-card__btn daily-mission-card__btn--claim" onclick="reivindicarMissaoDiaria(' + idx + ')">' + escapeHtmlDaily(labClaim) + '</button>'
        : '<button type="button" class="btn-l2 daily-mission-card__btn" disabled>' + escapeHtmlDaily(labProgress) + '</button>';
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
      + '<div class="daily-mission-card__desc">' + mdesc + '</div>'
      + hintBlock
      + '<div class="daily-mission-card__reward">' + escapeHtmlDaily(labReward) + ' ' + escapeHtmlDaily(textoRecompensa(m.recompensa)) + '</div>'
      + '</div>'
      + btn
      + '</div>'
      + '<div class="daily-mission-card__bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + m.alvo + '" aria-valuenow="' + m.progresso + '">'
      + '<div class="daily-mission-card__bar-fill" style="width:' + pct + '%;"></div>'
      + '</div>'
      + '<div class="daily-mission-card__nums">' + m.progresso + '/' + m.alvo + ' <span class="daily-mission-card__pct">(' + pct + '%)</span></div>'
      + '</article>';
  });

  const bonusPronto = todasMissoesConcluidas();
  const temPendenteResgate = pending > 0;
  const bonusResgatado = !!missoesDiariasData.bonusReivindicado;
  const mod = obterModificadorGrade(gradeAtual);
  const bonusPreview = {
    adenas: Math.floor(12000 * mod),
    ancientCoins: Math.floor(10 * mod),
  };
  const ultimoHistorico = (missoesDiariasData.historicoEncerrado && missoesDiariasData.historicoEncerrado[0])
    ? missoesDiariasData.historicoEncerrado[0]
    : null;
  const txtHistorico = ultimoHistorico
    ? dailyMissionT('game.daily.historyGradeChange', { prev: ultimoHistorico.gradeAnterior, next: ultimoHistorico.gradeNova })
    : dailyMissionT('game.daily.historyNone');

  const gradeEncant = normalizarGradeParaRecompensa(gradeAtual) === 'No-Grade' ? 'NG' : normalizarGradeParaRecompensa(gradeAtual);
  const linhaExtras = dailyMissionT('game.daily.bonusPreviewExtras', { grade: gradeEncant });

  const titBonus = dailyMissionT('game.daily.finalBonusTitle');
  const linhaGrade = dailyMissionT('game.daily.activeGradeLine', { grade: gradeAtual, tiers: GRADES_L2_OFICIAIS.join(' > ') });
  const btnBonusClaimed = dailyMissionT('game.daily.bonusClaimed');
  const btnClaimFinal = dailyMissionT('game.daily.claimFinalBonus');
  const btnCompleteAll = dailyMissionT('game.daily.completeAllMissions');
  const btnClaimPending = dailyMissionT('game.daily.claimPendingFirst');

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
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn daily-bonus__btn--ready" onclick="reivindicarBonusMissaoDiaria()">' + escapeHtmlDaily(btnClaimFinal) + '</button>';
  } else if (temPendenteResgate) {
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn" disabled>' + escapeHtmlDaily(btnClaimPending) + '</button>';
  } else {
    bonusBtn = '<button type="button" class="btn-l2 daily-bonus__btn" disabled>' + escapeHtmlDaily(btnCompleteAll) + '</button>';
  }

  bonusBox.innerHTML = ''
    + '<div class="daily-bonus__title">' + escapeHtmlDaily(titBonus) + '</div>'
    + '<div class="daily-bonus-pips" aria-hidden="true">' + pips + '</div>'
    + '<div class="daily-bonus__grade">' + escapeHtmlDaily(linhaGrade) + '</div>'
    + '<div class="daily-bonus__preview">+' + bonusPreview.adenas + 'a | +' + bonusPreview.ancientCoins + ' AC | ' + escapeHtmlDaily(linhaExtras) + '</div>'
    + '<div class="daily-bonus__history">' + escapeHtmlDaily(txtHistorico) + '</div>'
    + bonusBtn;
}

function abrirMissoesDiarias(): void {
  if (!window.charName) return;
  if (!missoesDiariasData) inicializarMissoesDiarias();
  aplicarRotacaoPorGradeSeNecessario();
  renderizarMissoesDiarias();
  const root = document.getElementById('janela-missoes-diarias');
  if (root && window.I18n && typeof window.I18n.refreshDom === 'function') {
    try { window.I18n.refreshDom(root); } catch { /* ignore */ }
  }
  window.abrirModal('janela-missoes-diarias', 1500);
}

function fecharMissoesDiarias(): void {
  window.fecharModal('janela-missoes-diarias');
}

window.inicializarMissoesDiarias = inicializarMissoesDiarias;
window.registrarProgressoMissaoDiaria = registrarProgressoMissaoDiaria;
window.aplicarHudMissoesBadge = aplicarHudMissoesBadge;
window.reivindicarMissaoDiaria = reivindicarMissaoDiaria;
window.reivindicarBonusMissaoDiaria = reivindicarBonusMissaoDiaria;
window.renderizarMissoesDiarias = renderizarMissoesDiarias;
window.abrirMissoesDiarias = abrirMissoesDiarias;
window.fecharMissoesDiarias = fecharMissoesDiarias;

export {};
