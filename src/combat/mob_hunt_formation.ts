/**
 * Scenic hunt slots — cards sit on the painted ground (not a row).
 * Survivors keep their slot. D = moonlit courtyard; No-Grade = dusk trail.
 *
 * Ground stain (`.mob-hunt-foot-shadow`) is on **every** hunt grade.
 * Cast follows zone light: NG/B stretch right; D/C/A/S stretch left.
 */

export type HuntGroundShadow = {
  /** Shift from sprite center. Negative = left (D moonlight); positive = right (NG sun). */
  dx: string;
  blur: string;
  w: string;
  h: string;
  a: string;
  rgb: string;
  rot: string;
};

export type HuntSlot = {
  id: string;
  /** Center X as % of `#mobs-container`. */
  x: number;
  /** Feet Y from the bottom as % of `#mobs-container`. */
  y: number;
  scale: number;
  z: number;
  shadow: HuntGroundShadow;
};

type HuntMobSlotHost = {
  idUnico?: string;
  huntSlot?: string;
};

const D_SLOTS: HuntSlot[] = [
  {
    id: 'path-near',
    x: 46,
    y: 11,
    scale: 1.1,
    z: 4,
    shadow: { dx: '-62%', blur: '1.8px', w: '78%', h: '8px', a: '0.55', rgb: '6, 10, 20', rot: '-8deg' },
  },
  {
    id: 'earth-left',
    x: 16,
    y: 21,
    scale: 0.96,
    z: 3,
    shadow: { dx: '-70%', blur: '3.6px', w: '90%', h: '11px', a: '0.4', rgb: '8, 12, 16', rot: '-5deg' },
  },
  {
    id: 'mound-right',
    x: 80,
    y: 25,
    scale: 0.94,
    z: 3,
    shadow: { dx: '-48%', blur: '2.8px', w: '68%', h: '8px', a: '0.34', rgb: '10, 16, 28', rot: '-16deg' },
  },
  {
    id: 'path-far',
    x: 56,
    y: 40,
    scale: 0.74,
    z: 2,
    shadow: { dx: '-56%', blur: '4.8px', w: '62%', h: '7px', a: '0.26', rgb: '18, 30, 52', rot: '-6deg' },
  },
];

/** Which courtyard spots to use for a pack of N (1–4). */
const D_PACKS: Record<number, string[]> = {
  1: ['path-near'],
  2: ['earth-left', 'mound-right'],
  3: ['earth-left', 'path-near', 'mound-right'],
  4: ['earth-left', 'path-near', 'mound-right', 'path-far'],
};

/** Dusk trail — painted light is top-left, CSS cast falls right. */
const NG_SLOTS: HuntSlot[] = [
  {
    id: 'path-near',
    x: 48,
    y: 12,
    scale: 1.1,
    z: 4,
    shadow: { dx: '58%', blur: '2px', w: '76%', h: '8px', a: '0.48', rgb: '28, 18, 10', rot: '8deg' },
  },
  {
    id: 'berm-left',
    x: 18,
    y: 22,
    scale: 0.96,
    z: 3,
    shadow: { dx: '50%', blur: '3.2px', w: '70%', h: '9px', a: '0.36', rgb: '20, 24, 12', rot: '6deg' },
  },
  {
    id: 'fence-right',
    x: 78,
    y: 24,
    scale: 0.94,
    z: 3,
    shadow: { dx: '66%', blur: '3.4px', w: '86%', h: '10px', a: '0.42', rgb: '30, 16, 8', rot: '10deg' },
  },
];

const NG_PACKS: Record<number, string[]> = {
  1: ['path-near'],
  2: ['berm-left', 'fence-right'],
  3: ['berm-left', 'path-near', 'fence-right'],
};

const FORMATIONS: Record<string, { slots: HuntSlot[]; packs: Record<number, string[]> }> = {
  'No-Grade': { slots: NG_SLOTS, packs: NG_PACKS },
  D: { slots: D_SLOTS, packs: D_PACKS },
};

/** CSS contact stain — one look, cast side matches the painted key light. */
export type HuntGroundStain = {
  /** `right` = sun/fire from the left; `left` = moon/sky from the right. */
  cast: 'left' | 'right';
  stainX: string;
  stainXMid: string;
  stainRot: string;
};

const ZONE_STAIN: Record<string, HuntGroundStain> = {
  'No-Grade': { cast: 'right', stainX: '-42%', stainXMid: '-38%', stainRot: '5deg' },
  D: { cast: 'left', stainX: '-62%', stainXMid: '-68%', stainRot: '-5deg' },
  C: { cast: 'left', stainX: '-58%', stainXMid: '-64%', stainRot: '-4deg' },
  B: { cast: 'right', stainX: '-40%', stainXMid: '-36%', stainRot: '6deg' },
  A: { cast: 'left', stainX: '-60%', stainXMid: '-66%', stainRot: '-6deg' },
  S: { cast: 'left', stainX: '-58%', stainXMid: '-64%', stainRot: '-5deg' },
};

function stainForZone(zoneId: string): HuntGroundStain {
  return ZONE_STAIN[zoneId] || ZONE_STAIN['No-Grade'];
}

/** Stamp stain CSS vars on every hunt grade (formation or row). */
export function applyHuntGroundShadow(container: HTMLElement, zoneId: string): void {
  const stain = stainForZone(zoneId);
  container.setAttribute('data-hunt-cast', stain.cast);
  container.setAttribute('data-hunt-zone', zoneId.toLowerCase());
  container.style.setProperty('--hunt-stain-x', stain.stainX);
  container.style.setProperty('--hunt-stain-x-mid', stain.stainXMid);
  container.style.setProperty('--hunt-stain-rot', stain.stainRot);
}

function slotById(slots: HuntSlot[], id: string): HuntSlot | undefined {
  return slots.find((s) => s.id === id);
}

export function zoneUsesHuntFormation(zoneId: string): boolean {
  return !!FORMATIONS[zoneId];
}

export function isHuntFormationActive(container?: HTMLElement | null): boolean {
  return !!container?.classList.contains('mob-hunt-formation');
}

/** Stamp slot ids once at spawn so deaths do not reshuffle the pack. */
export function assignHuntFormationSlots(zoneId: string, mobs: HuntMobSlotHost[]): void {
  const spec = FORMATIONS[zoneId];
  if (!spec) {
    mobs.forEach((m) => {
      delete m.huntSlot;
    });
    return;
  }
  const keys = Object.keys(spec.packs).map(Number);
  const cap = Math.max(...keys);
  const n = Math.max(1, Math.min(cap, mobs.length));
  const pack = spec.packs[n] || spec.packs[cap];
  mobs.forEach((m, i) => {
    m.huntSlot = pack[i] || pack[pack.length - 1];
  });
}

export function applyHuntFormationLayout(
  container: HTMLElement,
  zoneId: string,
  mobs: HuntMobSlotHost[],
): void {
  const spec = FORMATIONS[zoneId];
  applyHuntGroundShadow(container, zoneId);
  if (!spec) {
    container.classList.remove('mob-hunt-formation');
    container.removeAttribute('data-hunt-formation');
    return;
  }

  container.classList.add('mob-hunt-formation');
  container.setAttribute('data-hunt-formation', zoneId.toLowerCase());

  mobs.forEach((mob) => {
    if (!mob.idUnico || !mob.huntSlot) return;
    const card = container.querySelector<HTMLElement>(`#mob-card-${mob.idUnico}`);
    const slot = slotById(spec.slots, mob.huntSlot);
    if (!card || !slot) return;
    card.style.setProperty('--hunt-x', `${slot.x}%`);
    card.style.setProperty('--hunt-y', `${slot.y}%`);
    card.style.setProperty('--hunt-scale', String(slot.scale));
    card.style.setProperty('--hunt-z', String(slot.z));
    card.style.setProperty('--hunt-shadow-dx', slot.shadow.dx);
    card.style.setProperty('--hunt-shadow-blur', slot.shadow.blur);
    card.style.setProperty('--hunt-shadow-w', slot.shadow.w);
    card.style.setProperty('--hunt-shadow-h', slot.shadow.h);
    card.style.setProperty('--hunt-shadow-a', slot.shadow.a);
    card.style.setProperty('--hunt-shadow-rgb', slot.shadow.rgb);
    card.style.setProperty('--hunt-shadow-rot', slot.shadow.rot);
    card.dataset.huntSlot = slot.id;
  });
}
