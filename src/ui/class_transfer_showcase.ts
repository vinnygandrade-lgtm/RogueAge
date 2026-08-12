/**
 * Class-transfer paperdoll showcase — archetypal armor/weapon by path.
 * Missing PNGs simply hide those layers (body-only / “naked” is OK).
 *
 * Visual rules (only IDs with art under common presets today):
 * - Tank  → Heavy plate (a4/a7) + mace / holy blade
 * - Hybrid → Medium chain (arm_ng_f_chain) or duelist leather + sword / hammer
 * - Rogue / Archer / Mage / Support / Fist → own lines
 */

export type ClassShowcaseGear = {
  armorId: string | null;
  weaponId: string | null;
};

type ShowcaseRole =
  | 'tank'
  | 'hybrid'
  | 'dagger'
  | 'archer'
  | 'mage'
  | 'support'
  | 'fist';

type GearTier = 'd' | 'c';

function tierFromReqLvl(reqLvl: number): GearTier {
  return reqLvl >= 40 ? 'c' : 'd';
}

function inferShowcaseRole(className: string): ShowcaseRole {
  const n = String(className || '').toLowerCase();

  if (/hawkeye|sagittarius|ranger|sentinel|archer|bow|silver ranger|moonlight|phantom ranger|ghost sentinel|palus ranger/.test(n)) {
    return 'archer';
  }
  if (
    /assassin|rogue|treasure|abyss walker|adventurer|ghost hunter|plains walker|wind rider|bladedancer|spectral dancer|scavenger|bounty|fortune/.test(
      n,
    )
  ) {
    return 'dagger';
  }
  if (/monk|tyrant|khavatari|fist|knuckle/.test(n)) {
    return 'fist';
  }
  if (
    /cleric|bishop|prophet|cardinal|hierophant|oracle|elder|saint|shaman|warcryer|overlord|dominator|doomcryer|swordsinger|sword muse/.test(
      n,
    )
  ) {
    return 'support';
  }
  if (
    /wizard|mage|sorcer|necro|archmage|soultaker|spellhowler|storm screamer|warlock|arcane|summon|spellsinger|elemental|dark wizard|phantom summoner|spectral master/.test(
      n,
    )
  ) {
    return 'mage';
  }
  // Tanks / shield knights — before generic warrior hybrids
  if (
    /knight|paladin|avenger|templar|phoenix|hell knight|shillien knight|temple knight|eva'?s templar|dark avenger|human knight|palus knight|elven knight/.test(
      n,
    )
  ) {
    // Palus Knight is dual-blade hybrid in lore, but name matches "knight" —
    // handled via CLASS_GEAR_BY_NAME below.
    if (/palus knight/.test(n)) return 'hybrid';
    return 'tank';
  }
  if (
    /warrior|gladiator|warlord|dreadnought|duelist|destroyer|titan|raider|warsmith|maestro|artisan|orc raider/.test(
      n,
    )
  ) {
    return 'hybrid';
  }
  if (typeof window.isClasseMagica === 'function' && window.isClasseMagica(className)) {
    return 'mage';
  }
  return 'hybrid';
}

/**
 * Role defaults — tank ≠ hybrid (plate+mace vs chain/leather+sword).
 * Prefer IDs that exist under human_fighter/equips (and siblings) today.
 */
const ROLE_GEAR: Record<ShowcaseRole, Record<GearTier, ClassShowcaseGear>> = {
  tank: {
    d: { armorId: 'a4', weaponId: 'wpn_ng_mace' },
    c: { armorId: 'a7', weaponId: 'wpn_ng_mace' },
  },
  hybrid: {
    // Only NG chain has paperdoll art today — still reads as “medium” vs plate.
    d: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_d_heavy_sword' },
    c: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_c_stormbringer' },
  },
  dagger: {
    d: { armorId: 'a5', weaponId: 'wpn_d_stiletto' },
    c: { armorId: 'a8', weaponId: 'wpn_c_dark_screamer' },
  },
  archer: {
    d: { armorId: 'a5', weaponId: 'wpn_d_hunters_bow' },
    c: { armorId: 'a8', weaponId: 'wpn_c_akat_bow' },
  },
  mage: {
    d: { armorId: 'a6', weaponId: 'wpn_d_wizard_staff' },
    c: { armorId: 'a9', weaponId: 'wpn_c_sorcerer_staff' },
  },
  support: {
    d: { armorId: 'a6', weaponId: 'wpn_d_m_wand' },
    c: { armorId: 'a9', weaponId: 'wpn_ng_m_scepter' },
  },
  fist: {
    d: { armorId: 'a5', weaponId: 'wpn_d_iron_knuckle' },
    c: { armorId: 'a8', weaponId: 'wpn_c_knuckle' },
  },
};

/**
 * Explicit per-class looks so sibling paths never share the same silhouette.
 * Partial tier maps fall through to ROLE_GEAR for missing tiers.
 */
const CLASS_GEAR_BY_NAME: Record<string, Partial<Record<GearTier, ClassShowcaseGear>>> = {
  // Human Fighter 20
  Warrior: {
    d: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_d_heavy_sword' },
  },
  'Human Knight': {
    d: { armorId: 'a4', weaponId: 'wpn_ng_mace' },
  },
  Rogue: {
    d: { armorId: 'a5', weaponId: 'wpn_d_stiletto' },
  },

  // Warrior 40 / 76
  Gladiator: {
    c: { armorId: 'a8', weaponId: 'wpn_c_stormbringer' },
  },
  Warlord: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Duelist: {
    c: { armorId: 'a8', weaponId: 'wpn_c_stormbringer' },
  },
  Dreadnought: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },

  // Knight 40 / 76
  Paladin: {
    c: { armorId: 'a7', weaponId: 'wpn_d_elven_sword' },
  },
  'Dark Avenger': {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  'Phoenix Knight': {
    c: { armorId: 'a7', weaponId: 'wpn_d_elven_sword' },
  },
  'Hell Knight': {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },

  // Rogue 40 / 76
  'Treasure Hunter': {
    c: { armorId: 'a8', weaponId: 'wpn_c_dark_screamer' },
  },
  Hawkeye: {
    c: { armorId: 'a8', weaponId: 'wpn_c_akat_bow' },
  },
  Adventurer: {
    c: { armorId: 'a8', weaponId: 'wpn_c_dark_screamer' },
  },
  Sagittarius: {
    c: { armorId: 'a8', weaponId: 'wpn_c_akat_bow' },
  },

  // Dark Elf fighter
  Assassin: {
    d: { armorId: 'a5', weaponId: 'wpn_d_stiletto' },
  },
  'Palus Ranger': {
    d: { armorId: 'a5', weaponId: 'wpn_d_hunters_bow' },
  },
  'Palus Knight': {
    d: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_c_sabre' },
  },
  Bladedancer: {
    c: { armorId: 'a8', weaponId: 'wpn_c_sabre' },
  },
  'Shillien Knight': {
    c: { armorId: 'a7', weaponId: 'wpn_d_elven_sword' },
  },
  'Spectral Dancer': {
    c: { armorId: 'a8', weaponId: 'wpn_c_sabre' },
  },
  'Shillien Templar': {
    c: { armorId: 'a7', weaponId: 'wpn_d_elven_sword' },
  },

  // Elf fighter
  'Elven Knight': {
    d: { armorId: 'a4', weaponId: 'wpn_d_elven_sword' },
  },
  'Elven Scout': {
    d: { armorId: 'a5', weaponId: 'wpn_d_stiletto' },
  },
  'Temple Knight': {
    c: { armorId: 'a7', weaponId: 'wpn_d_elven_sword' },
  },
  Swordsinger: {
    c: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_c_sabre' },
  },
  'Plains Walker': {
    c: { armorId: 'a8', weaponId: 'wpn_c_dark_screamer' },
  },
  'Silver Ranger': {
    c: { armorId: 'a8', weaponId: 'wpn_c_akat_bow' },
  },
  "Eva's Templar": {
    c: { armorId: 'a7', weaponId: 'wpn_d_elven_sword' },
  },
  'Sword Muse': {
    c: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_c_sabre' },
  },

  // Orc
  'Orc Raider': {
    d: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_d_heavy_sword' },
  },
  Monk: {
    d: { armorId: 'a5', weaponId: 'wpn_d_iron_knuckle' },
  },
  Destroyer: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Tyrant: {
    c: { armorId: 'a8', weaponId: 'wpn_c_knuckle' },
  },
  Titan: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  'Grand Khavatari': {
    c: { armorId: 'a8', weaponId: 'wpn_c_knuckle' },
  },

  // Dwarf
  Scavenger: {
    d: { armorId: 'a5', weaponId: 'wpn_d_stiletto' },
  },
  Artisan: {
    d: { armorId: 'arm_ng_f_chain', weaponId: 'wpn_d_war_hammer' },
  },
  'Bounty Hunter': {
    c: { armorId: 'a8', weaponId: 'wpn_c_dark_screamer' },
  },
  Warsmith: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  'Fortune Seeker': {
    c: { armorId: 'a8', weaponId: 'wpn_c_dark_screamer' },
  },
  Maestro: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
};

export function resolveClassShowcaseGear(className: string, reqLvl: number): ClassShowcaseGear {
  const tier = tierFromReqLvl(reqLvl);
  const named = CLASS_GEAR_BY_NAME[className]?.[tier];
  if (named) return { armorId: named.armorId ?? null, weaponId: named.weaponId ?? null };

  const role = inferShowcaseRole(className);
  const row = ROLE_GEAR[role][tier];
  return { armorId: row.armorId, weaponId: row.weaponId };
}

/** Valid 4-segment UID so ItemSecurity.isValidInstance accepts inspect stubs. */
function showcaseUid(tipo: 'armor' | 'weapon', id: string): string {
  const prefix = tipo === 'weapon' ? 'WPN' : 'ARM';
  const safe =
    String(id || 'x')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .slice(0, 10)
      .toUpperCase() || 'X';
  return `${prefix}-SHOW-${safe}-0`;
}

function catalogStub(
  id: string | null,
  tipo: 'armor' | 'weapon',
): { uid: string; tipo: string; base: { id: string; nome: string }; enchant: number; origin: string } | null {
  if (!id) return null;
  return {
    uid: showcaseUid(tipo, id),
    tipo,
    base: { id, nome: id },
    enchant: 0,
    origin: 'Showcase',
  };
}

export function buildClassTransferShowcaseCharData(
  className: string,
  reqLvl: number,
): {
  charRace: string;
  charClass: string;
  charGender: string;
  armaduraEquipada: ReturnType<typeof catalogStub>;
  armaEquipadaBase: ReturnType<typeof catalogStub>;
} {
  const gear = resolveClassShowcaseGear(className, reqLvl);
  // Body/preset = player's race + gender + current archetype (not the target class),
  // so Human Fighter Male always sees human_fighter — even when previewing a mage path.
  return {
    charRace: String(window.charRace || 'Human'),
    charClass: String(window.charClass || className || 'Fighter'),
    charGender: window.charGender === 'Female' ? 'Female' : 'Male',
    armaduraEquipada: catalogStub(gear.armorId, 'armor'),
    armaEquipadaBase: catalogStub(gear.weaponId, 'weapon'),
  };
}

const PD_BLANK =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export function slugClassTransferId(className: string): string {
  return (
    String(className || 'class')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'class'
  );
}

/** Mini paperdoll shell — black stage, no scenery. */
export function buildClassTransferPaperdollHtml(className: string, size: 'sm' | 'lg'): string {
  const slug = slugClassTransferId(className);
  const idPrefix = `ct-${size}-${slug}`;
  return `
    <div class="l2-paperdoll l2-paperdoll--class-transfer l2-paperdoll--class-transfer-${size}"
         id="${idPrefix}-root"
         data-class-transfer-pd="${slug}"
         data-class-name="${String(className).replace(/"/g, '&quot;')}"
         role="img"
         aria-hidden="true">
      <div class="paperdoll-character-stack" aria-hidden="true">
        <div class="paperdoll-foot-shadow" aria-hidden="true"></div>
        <img data-pd-layer="base" id="${idPrefix}-base" class="char-layer char-base-layer" src="${PD_BLANK}" alt="" hidden>
        <img data-pd-layer="armor" id="${idPrefix}-armor" class="char-layer" src="${PD_BLANK}" alt="" hidden>
        <img data-pd-layer="weaponGlow" id="${idPrefix}-weapon-glow" class="char-layer paperdoll-weapon-glow-img" src="${PD_BLANK}" alt="" hidden>
        <img data-pd-layer="weapon" id="${idPrefix}-weapon" class="char-layer" src="${PD_BLANK}" alt="" hidden>
        <img data-pd-layer="weaponGrip" id="${idPrefix}-weapon-grip" class="char-layer char-weapon-grip-layer" src="${PD_BLANK}" alt="" hidden>
        <img data-pd-layer="hands" id="${idPrefix}-hands" class="char-layer char-hands-layer" src="${PD_BLANK}" alt="" hidden>
      </div>
    </div>`;
}

export function paintClassTransferPaperdolls(
  container: HTMLElement | null,
  optionsByClass: Map<string, { reqLvl: number }>,
): void {
  if (!container || typeof window.atualizarPaperdollInspect !== 'function') return;
  const roots = container.querySelectorAll<HTMLElement>('.l2-paperdoll--class-transfer');
  roots.forEach((root) => {
    const className = root.getAttribute('data-class-name') || '';
    if (!className) return;
    const meta = optionsByClass.get(className);
    const reqLvl = meta?.reqLvl ?? 20;
    const charData = buildClassTransferShowcaseCharData(className, reqLvl);
    try {
      window.atualizarPaperdollInspect(root, charData as never);
      // Mini frame centers the stack in CSS; neutralize profile stage offsets.
      root.style.setProperty('--pd-stack-bottom', '0%');
      root.style.setProperty('--pd-figure-w', '100%');
      root.style.setProperty('--pd-char-scale', '1');
    } catch {
      /* ignore single paint failure */
    }
  });
}

export {};
