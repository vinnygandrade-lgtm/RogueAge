/**
 * CORE ITEM SECURITY SYSTEM (RG / UID)
 * Migrado: js/core_security.js
 */
import type { EquipInstance, ItemCatalogBase } from '../types/game';

type CreateOverrides = Partial<EquipInstance> & {
  enchantArmor?: number;
  enchantJewel?: number;
};

const WEAPON_TYPES = ['weapon', 'Sword', 'Dagger', 'Bow', 'Fist', 'Mace', 'Magic Sword'];
const ARMOR_TYPES = ['armor', 'Heavy', 'Light', 'Robe'];
const JEWEL_TYPES = ['jewel', 'neck', 'ear', 'ring'];

function uidPrefixFor(tipo: string, base: ItemCatalogBase): string {
  if (WEAPON_TYPES.includes(tipo) || base.atk) return 'WPN';
  if (ARMOR_TYPES.includes(tipo) || base.pDef) return 'ARM';
  if (JEWEL_TYPES.includes(tipo) || base.mDef) return 'JWL';
  return 'MISC';
}

window.ItemSecurity = {
  generateUID(prefix = 'ITEM'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    const entropy = Math.floor(Math.random() * 1000000).toString(16);
    return `${prefix}-${timestamp}-${random}-${entropy}`.toUpperCase();
  },

  createInstance(
    tipo: string,
    base: ItemCatalogBase,
    overrides: CreateOverrides = {},
  ): EquipInstance | null {
    if (!base || !base.nome) {
      console.error('[Security] Tentativa de criar item sem base válida.');
      return null;
    }

    const prefix = uidPrefixFor(tipo, base);
    const enchantFallback = overrides.enchantArmor ?? overrides.enchantJewel ?? 0;

    const instance: EquipInstance = {
      uid: overrides.uid || this.generateUID(prefix),
      tipo: tipo || base.tipoItem || base.tipo || 'misc',
      base: JSON.parse(JSON.stringify(base)) as ItemCatalogBase,
      enchant: overrides.enchant !== undefined ? overrides.enchant : enchantFallback,
      augmented: overrides.augmented || false,
      origin: overrides.origin || 'System',
      owner: overrides.owner || window.charName || 'Unknown',
      createdAt: overrides.createdAt || new Date().toISOString(),
    };

    console.log(`[Security] Novo item registrado: ${instance.base.nome} [RG: ${instance.uid}]`);
    return instance;
  },

  isValidInstance(item: unknown): item is EquipInstance {
    if (!item || typeof item !== 'object') return false;
    const inst = item as EquipInstance;
    if (!inst.uid || !inst.base || !inst.base.nome) return false;
    return inst.uid.split('-').length === 4;
  },

  registerDestruction(item: EquipInstance | null | undefined): void {
    if (!item) return;
    console.warn(
      `[Security] ITEM DESTRUÍDO: ${item.base.nome} [RG: ${item.uid}] - Removido do banco de dados do mundo.`,
    );
  },
};

export {};
