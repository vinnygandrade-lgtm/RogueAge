/**
 * Rich class-transfer decision UI — stats, skills, and future path previews.
 */

import { classEvolutionDisplayDesc, classEvolutionDisplayName } from '../i18n/polish12_display';

type ClassMod = {
  hp?: number;
  mp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  crit?: number;
};

type ClassOption = {
  nome: string;
  reqLvl: number;
  desc?: string;
  cor?: string;
};

type SkillTreeRow = { lvl?: number; nome: string };

function t(key: string, params?: Record<string, string | number>): string {
  if (typeof window.t === 'function') {
    const out = window.t(key, params || {});
    if (out && out !== key) return out;
  }
  return key;
}

function esc(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getMod(className: string): ClassMod {
  const table = (window.classModifiers || {}) as Record<string, ClassMod>;
  return table[className] || { hp: 1, mp: 1, atk: 1, def: 1, spd: 1, crit: 0 };
}

function fmtMult(v: number | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n * 100)}%`;
}

function fmtCrit(v: number | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `+${Math.round(n)}`;
}

/** spd is attack interval multiplier — lower = faster. Show as relative speed feel. */
function fmtSpdLabel(v: number | undefined): string {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const faster = 1 / n;
  return `${Math.round(faster * 100)}%`;
}

function deltaClass(curr: number, next: number, invertBetter = false): 'up' | 'down' | 'same' {
  const d = next - curr;
  if (Math.abs(d) < 0.02) return 'same';
  if (invertBetter) return d < 0 ? 'up' : 'down';
  return d > 0 ? 'up' : 'down';
}

function inferRoleKey(mod: ClassMod): string {
  const hp = Number(mod.hp) || 1;
  const mp = Number(mod.mp) || 1;
  const atk = Number(mod.atk) || 1;
  const def = Number(mod.def) || 1;
  const crit = Number(mod.crit) || 0;
  const spd = Number(mod.spd) || 1;

  if (def >= 1.4 && hp >= 1.3) return 'tank';
  if (mp >= 1.4 && atk >= 1.3 && def < 1.1) return 'mage';
  if (mp >= 1.4 && atk < 1.5) return 'support';
  if (crit >= 12 || spd <= 0.9) return 'dps';
  return 'hybrid';
}

function roleLabel(mod: ClassMod): string {
  const key = inferRoleKey(mod);
  return t(`game.classes.role.${key}`);
}

function skillsForClass(className: string): SkillTreeRow[] {
  const tree = (window.arvoreDeSkills || {}) as Record<string, SkillTreeRow[]>;
  const rows = tree[className];
  return Array.isArray(rows) ? rows.slice(0, 6) : [];
}

function futurePathHtml(className: string, accent: string): string {
  const evo = (window.classEvolutions || {}) as Record<string, ClassOption[]>;
  const next = evo[className];
  if (!Array.isArray(next) || next.length === 0) {
    return `<div class="class-path-card__path-empty">${esc(t('game.classes.pathEnd'))}</div>`;
  }

  const branches = next
    .map((opt) => {
      const third = evo[opt.nome];
      const thirdBits =
        Array.isArray(third) && third.length
          ? third
              .map(
                (t3) =>
                  `<span class="class-path-chip class-path-chip--tier3" style="--class-accent:${esc(t3.cor || accent)}">${esc(classEvolutionDisplayName(t3.nome))} <em>Lv.${esc(t3.reqLvl)}</em></span>`,
              )
              .join('')
          : '';
      return `
        <div class="class-path-branch">
          <span class="class-path-chip class-path-chip--tier2" style="--class-accent:${esc(opt.cor || accent)}">${esc(classEvolutionDisplayName(opt.nome))} <em>Lv.${esc(opt.reqLvl)}</em></span>
          ${thirdBits ? `<div class="class-path-branch__kids">${thirdBits}</div>` : ''}
        </div>`;
    })
    .join('');

  return `
    <div class="class-path-card__section-label">${esc(t('game.classes.pathAhead'))}</div>
    <div class="class-path-branches">${branches}</div>`;
}

function skillIconsHtml(className: string): string {
  const rows = skillsForClass(className);
  if (!rows.length) {
    return `<div class="class-path-card__skills-empty">${esc(t('game.classes.noNewSkillsListed'))}</div>`;
  }
  const banco = (window.bancoDeSkills || {}) as Record<string, { icone?: string; cor?: string }>;
  const pills = rows
    .map((row) => {
      const skill = banco[row.nome];
      const label =
        typeof window.skillDisplayName === 'function'
          ? window.skillDisplayName(row.nome, row.nome)
          : row.nome;
      const icon =
        typeof window.spellbookIconInnerHtml === 'function'
          ? window.spellbookIconInnerHtml(skill?.icone, 28)
          : skill?.icone || '✦';
      return `
        <div class="class-path-skill" title="${esc(label)} · Lv.${esc(row.lvl || '?')}">
          <div class="class-path-skill__icon">${icon}</div>
          <span class="class-path-skill__lvl">${esc(row.lvl || '?')}</span>
        </div>`;
    })
    .join('');
  return `
    <div class="class-path-card__section-label">${esc(t('game.classes.unlockSkills'))}</div>
    <div class="class-path-skills">${pills}</div>`;
}

function statsCompareHtml(currentClass: string, targetClass: string): string {
  const cur = getMod(currentClass);
  const nxt = getMod(targetClass);
  const rows: Array<{ key: string; label: string; cur: string; next: string; trend: 'up' | 'down' | 'same' }> = [
    {
      key: 'hp',
      label: t('game.classes.stat.hp'),
      cur: fmtMult(cur.hp),
      next: fmtMult(nxt.hp),
      trend: deltaClass(Number(cur.hp) || 1, Number(nxt.hp) || 1),
    },
    {
      key: 'mp',
      label: t('game.classes.stat.mp'),
      cur: fmtMult(cur.mp),
      next: fmtMult(nxt.mp),
      trend: deltaClass(Number(cur.mp) || 1, Number(nxt.mp) || 1),
    },
    {
      key: 'atk',
      label: t('game.classes.stat.atk'),
      cur: fmtMult(cur.atk),
      next: fmtMult(nxt.atk),
      trend: deltaClass(Number(cur.atk) || 1, Number(nxt.atk) || 1),
    },
    {
      key: 'def',
      label: t('game.classes.stat.def'),
      cur: fmtMult(cur.def),
      next: fmtMult(nxt.def),
      trend: deltaClass(Number(cur.def) || 1, Number(nxt.def) || 1),
    },
    {
      key: 'spd',
      label: t('game.classes.stat.spd'),
      cur: fmtSpdLabel(cur.spd),
      next: fmtSpdLabel(nxt.spd),
      // lower interval = better → invert
      trend: deltaClass(Number(cur.spd) || 1, Number(nxt.spd) || 1, true),
    },
    {
      key: 'crit',
      label: t('game.classes.stat.crit'),
      cur: fmtCrit(cur.crit),
      next: fmtCrit(nxt.crit),
      trend: deltaClass(Number(cur.crit) || 0, Number(nxt.crit) || 0),
    },
  ];

  const arrowFor = (trend: 'up' | 'down' | 'same') =>
    trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•';

  const chips = rows
    .map(
      (r) => `
      <div class="class-path-stat class-path-stat--${r.trend}" title="${esc(r.label)}: ${esc(r.cur)} → ${esc(r.next)}">
        <span class="class-path-stat__l">${esc(r.label)}<span class="class-path-stat__arrow">${arrowFor(r.trend)}</span></span>
        <span class="class-path-stat__v"><b>${esc(r.next)}</b><small>${esc(r.cur)}</small></span>
      </div>`,
    )
    .join('');

  return `
    <div class="class-path-card__section-label">${esc(t('game.classes.statsCompare'))}</div>
    <div class="class-path-stats">${chips}</div>`;
}

function portraitHtml(targetClass: string): string {
  const race = String(window.charRace || 'Human');
  const gender = window.charGender;
  if (typeof window.portraitImgHtml === 'function') {
    return window.portraitImgHtml(
      race,
      gender,
      targetClass,
      'width:100%;height:100%;object-fit:cover;object-position:center top;',
    );
  }
  return '';
}

export function buildClassPathCardHtml(
  opcao: ClassOption,
  opts: { currentClass: string; playerLevel: number },
): string {
  const accent = opcao.cor || '#10b981';
  const can = opts.playerLevel >= opcao.reqLvl;
  const mod = getMod(opcao.nome);
  const name = classEvolutionDisplayName(opcao.nome);
  const desc = classEvolutionDisplayDesc(opcao.nome, opcao.desc || '');
  const status = can
    ? `<span class="class-path-card__status class-path-card__status--ok">${esc(t('game.classes.available'))}</span>`
    : `<span class="class-path-card__status class-path-card__status--lock">${esc(t('game.classes.requiresLevel', { level: opcao.reqLvl }))}</span>`;

  const safeId = esc(opcao.nome);

  return `
    <article class="class-path-card${can ? '' : ' class-path-card--locked'}" style="--class-accent:${esc(accent)}" data-class-option="${safeId}">
      <header class="class-path-card__head">
        <div class="class-path-card__portrait">${portraitHtml(opcao.nome)}</div>
        <div class="class-path-card__titles">
          <div class="class-path-card__title-row">
            <h3 class="class-path-card__name">${esc(name)}</h3>
            <span class="class-path-card__role">${esc(roleLabel(mod))}</span>
          </div>
          <p class="class-path-card__desc">${esc(desc)}</p>
          <div class="class-path-card__meta">${status}</div>
        </div>
      </header>
      <div class="class-path-card__body">
        ${statsCompareHtml(opts.currentClass, opcao.nome)}
        ${skillIconsHtml(opcao.nome)}
        ${futurePathHtml(opcao.nome, accent)}
      </div>
      <footer class="class-path-card__foot">
        <button type="button" class="btn-l2 class-path-card__btn" data-class-pick="${safeId}" ${can ? '' : 'disabled'}>
          ${esc(t('game.classes.changeBtn'))}
        </button>
      </footer>
    </article>`;
}

export function renderClassTransferOptions(
  container: HTMLElement,
  opcoes: ClassOption[],
  opts: { currentClass: string; playerLevel: number },
): void {
  container.innerHTML = opcoes
    .map((op) => buildClassPathCardHtml(op, opts))
    .join('');

  container.querySelectorAll<HTMLButtonElement>('[data-class-pick]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const nome = btn.getAttribute('data-class-pick');
      if (!nome || btn.disabled) return;
      if (typeof window.confirmarTrocaClasse === 'function') {
        window.confirmarTrocaClasse(nome);
      }
    });
  });
}

export {};
