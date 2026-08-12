/**
 * Class-transfer paperdoll showcase — archetypal armor/weapon by path.
 * Missing PNGs simply hide those layers (body-only / “naked” is OK).
 */

export type ClassShowcaseGear = {
  armorId: string | null;
  weaponId: string | null;
};

type ShowcaseRole = 'heavy' | 'dagger' | 'archer' | 'mage' | 'support';

type GearTier = 'd' | 'c';

function tierFromReqLvl(reqLvl: number): GearTier {
  return reqLvl >= 40 ? 'c' : 'd';
}

function inferShowcaseRole(className: string): ShowcaseRole {
  const n = String(className || '').toLowerCase();

  if (
    /hawkeye|sagittarius|ranger|sentinel|archer|bow|silver ranger|moonlight/.test(n)
  ) {
    return 'archer';
  }
  if (
    /assassin|rogue|treasure|abyss walker|adventurer|ghost hunter|plains walker|wind rider|bladedancer|spectral dancer|scavenger|bounty|fortune/.test(
      n,
    )
  ) {
    return 'dagger';
  }
  if (
    /cleric|bishop|prophet|cardinal|hierophant|oracle|elder|saint|shaman|warcryer|overlord|dominator|doomcryer/.test(
      n,
    )
  ) {
    return 'support';
  }
  if (
    /wizard|mage|sorcer|necro|archmage|soultaker|spellhowler|storm screamer|warlock|arcane|summon|spellsinger|elemental|dark wizard/.test(
      n,
    )
  ) {
    return 'mage';
  }
  if (typeof window.isClasseMagica === 'function' && window.isClasseMagica(className)) {
    return 'mage';
  }
  return 'heavy';
}

/** Prefer IDs that exist under human_fighter/equips today; higher grades fall back gracefully. */
const ROLE_GEAR: Record<ShowcaseRole, Record<GearTier, ClassShowcaseGear>> = {
  heavy: {
    d: { armorId: 'a4', weaponId: 'wpn_d_heavy_sword' },
    c: { armorId: 'a7', weaponId: 'wpn_c_stormbringer' },
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
};

/** Per-class overrides when the generic role pick is wrong (dual blades, hammer tanks, etc.). */
const CLASS_GEAR_OVERRIDES: Record<string, Partial<Record<GearTier, ClassShowcaseGear>>> = {
  Bladedancer: {
    d: { armorId: 'a5', weaponId: 'wpn_c_sabre' },
    c: { armorId: 'a8', weaponId: 'wpn_c_sabre' },
  },
  'Spectral Dancer': {
    c: { armorId: 'a8', weaponId: 'wpn_c_sabre' },
  },
  Warlord: {
    d: { armorId: 'a4', weaponId: 'wpn_d_war_hammer' },
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Dreadnought: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Destroyer: {
    d: { armorId: 'a4', weaponId: 'wpn_d_war_hammer' },
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Titan: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Warsmith: {
    d: { armorId: 'a4', weaponId: 'wpn_d_war_hammer' },
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
  Maestro: {
    c: { armorId: 'a7', weaponId: 'wpn_d_war_hammer' },
  },
};

export function resolveClassShowcaseGear(className: string, reqLvl: number): ClassShowcaseGear {
  const tier = tierFromReqLvl(reqLvl);
  const override = CLASS_GEAR_OVERRIDES[className]?.[tier];
  if (override) return { armorId: override.armorId ?? null, weaponId: override.weaponId ?? null };
  const role = inferShowcaseRole(className);
  const row = ROLE_GEAR[role][tier];
  return { armorId: row.armorId, weaponId: row.weaponId };
}

function catalogStub(id: string | null, tipo: 'armor' | 'weapon'): { uid: string; tipo: string; base: { id: string; nome: string }; enchant: number } | null {
  if (!id) return null;
  return {
    uid: `showcase-${tipo}-${id}`,
    tipo,
    base: { id, nome: id },
    enchant: 0,
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
  return {
    charRace: String(window.charRace || 'Human'),
    charClass: className,
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
    } catch {
      /* ignore single paint failure */
    }
  });
}

export {};
