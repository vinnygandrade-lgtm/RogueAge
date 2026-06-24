/**
 * Grade UI — cores e classes partilhadas (loja, mercado, tooltips, bloqueio de nível).
 * Progressão: NG cinza → D aço → C jade → B âmbar → A ouro → S rosa-arcano.
 */
import type { GradeSlug, GradeUiInfo } from '../types/game';

const SLUG: Record<string, GradeSlug> = {
  'NO-GRADE': 'ng',
  'NO GRADE': 'ng',
  NG: 'ng',
  D: 'd',
  C: 'c',
  B: 'b',
  A: 'a',
  S: 's',
};

const TOKENS: Record<
  GradeSlug,
  { color: string; border: string; glow: string; bg: string }
> = {
  ng: {
    color: 'var(--l2-grade-ng-color)',
    border: 'var(--l2-grade-ng-border)',
    glow: 'var(--l2-grade-ng-glow)',
    bg: 'var(--l2-grade-ng-bg)',
  },
  d: {
    color: 'var(--l2-grade-d-color)',
    border: 'var(--l2-grade-d-border)',
    glow: 'var(--l2-grade-d-glow)',
    bg: 'var(--l2-grade-d-bg)',
  },
  c: {
    color: 'var(--l2-grade-c-color)',
    border: 'var(--l2-grade-c-border)',
    glow: 'var(--l2-grade-c-glow)',
    bg: 'var(--l2-grade-c-bg)',
  },
  b: {
    color: 'var(--l2-grade-b-color)',
    border: 'var(--l2-grade-b-border)',
    glow: 'var(--l2-grade-b-glow)',
    bg: 'var(--l2-grade-b-bg)',
  },
  a: {
    color: 'var(--l2-grade-a-color)',
    border: 'var(--l2-grade-a-border)',
    glow: 'var(--l2-grade-a-glow)',
    bg: 'var(--l2-grade-a-bg)',
  },
  s: {
    color: 'var(--l2-grade-s-color)',
    border: 'var(--l2-grade-s-border)',
    glow: 'var(--l2-grade-s-glow)',
    bg: 'var(--l2-grade-s-bg)',
  },
};

const HEX: Record<GradeSlug, string> = {
  ng: '#b5b3ae',
  d: '#6eb5d4',
  c: '#7fd4a8',
  b: '#f0a060',
  a: '#f5d76e',
  s: '#ffc8e8',
};

function normalizeL2GradeSlug(grade: unknown): GradeSlug {
  const key = String(grade == null ? '' : grade)
    .trim()
    .toUpperCase();
  return SLUG[key] ?? 'ng';
}

function getGradeUi(grade: unknown): GradeUiInfo {
  const slug = normalizeL2GradeSlug(grade);
  return {
    slug,
    color: HEX[slug],
    cssColor: TOKENS[slug].color,
    cssBorder: TOKENS[slug].border,
    cssGlow: TOKENS[slug].glow,
    cssBg: TOKENS[slug].bg,
  };
}

function getGradeColor(grade: unknown): string {
  return getGradeUi(grade).color;
}

function buildGradeTagHtml(grade: unknown, label?: unknown): string {
  const slug = normalizeL2GradeSlug(grade);
  const text =
    label != null && String(label).trim() !== ''
      ? String(label)
      : String(grade == null ? '' : grade);
  return `<span class="l2-grade-tag l2-grade-tag--${slug}">[${text}]</span>`;
}

const ACCENT_CLASS_RE = /\bl2-grade-accent--\w+\b/g;

function applyGradeAccentToElement(el: Element | null, grade: unknown): void {
  if (!el || !('classList' in el) || !el.classList) return;
  const slug = normalizeL2GradeSlug(grade);
  el.className = String(el.className || '')
    .replace(ACCENT_CLASS_RE, '')
    .trim();
  el.classList.add(`l2-grade-accent--${slug}`);
}

function applyShopGradeChrome(grade: unknown): void {
  const loja = document.getElementById('janela-loja');
  const titulo = document.getElementById('titulo-loja-span');
  const header = loja ? loja.querySelector('.store-header') : null;
  if (loja) {
    loja.className = String(loja.className || '')
      .replace(ACCENT_CLASS_RE, '')
      .trim();
    loja.classList.add(`l2-grade-accent--${normalizeL2GradeSlug(grade)}`);
  }
  applyGradeAccentToElement(header, grade);
  applyGradeAccentToElement(titulo, grade);
}

function clearShopGradeChrome(): void {
  const loja = document.getElementById('janela-loja');
  const titulo = document.getElementById('titulo-loja-span');
  const header = loja ? loja.querySelector('.store-header') : null;
  [loja, header, titulo].forEach((el) => {
    if (!el || !('classList' in el) || !el.classList) return;
    el.className = String(el.className || '')
      .replace(ACCENT_CLASS_RE, '')
      .trim();
  });
}

window.normalizeL2GradeSlug = normalizeL2GradeSlug;
window.getGradeUi = getGradeUi;
window.getGradeColor = getGradeColor;
window.getCorGrade = getGradeColor;
window.buildGradeTagHtml = buildGradeTagHtml;
window.applyGradeAccentToElement = applyGradeAccentToElement;
window.applyShopGradeChrome = applyShopGradeChrome;
window.clearShopGradeChrome = clearShopGradeChrome;

export {};
