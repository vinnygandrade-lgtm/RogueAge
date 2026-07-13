/**
 * CORE INVENTORY LOGIC (SAFE ENGINE)
 * Migrado: js/core_inventory_logic.js
 * Centraliza equipamentos para evitar duplicação e perda de dados.
 */
import type { EquipBodySlot, EquipInstance, EquipRawInput, ItemCatalogBase } from '../types/game';

const JEWEL_TYPES = ['neck', 'ear', 'ring'] as const;
const WEAPON_TYPES = ['Sword', 'Dagger', 'Bow', 'Fist', 'Mace', 'Magic Sword', 'Wand', 'Scepter', 'weapon'] as const;
const ARMOR_TYPES = ['Heavy', 'Light', 'Medium', 'Robe', 'Mage Light', 'Mage Heavy', 'armor'] as const;

function catalogFromItem(item: EquipInstance | EquipRawInput | null): ItemCatalogBase | null {
  if (!item) return null;
  const base = item.base;
  if (base && typeof base === 'object') return base;
  return null;
}

function equippedSlots(): Array<EquipInstance | null | undefined> {
  return [
    window.armaEquipadaBase,
    window.armaduraEquipada,
    window.colarEquipado,
    window.brincoEquipado1,
    window.brincoEquipado2,
    window.anelEquipado1,
    window.anelEquipado2,
  ];
}

window.InventoryManager = {
  /** Catálogo `tipoItem` (neck/ear/ring) tem prioridade sobre instância genérica `tipo: jewel`. */
  resolveEquipSubTipo(item: EquipInstance | EquipRawInput | null): string {
    if (!item) return 'misc';
    const base = catalogFromItem(item) ?? ({} as ItemCatalogBase);

    const fromBaseItem = String(base.tipoItem || '');
    if (JEWEL_TYPES.includes(fromBaseItem as (typeof JEWEL_TYPES)[number])) return fromBaseItem;

    const fromBaseTipo = String(base.tipo || '');
    if (JEWEL_TYPES.includes(fromBaseTipo as (typeof JEWEL_TYPES)[number])) return fromBaseTipo;
    if (ARMOR_TYPES.includes(fromBaseTipo as (typeof ARMOR_TYPES)[number])) return fromBaseTipo;
    if (WEAPON_TYPES.includes(fromBaseTipo as (typeof WEAPON_TYPES)[number])) return fromBaseTipo;

    const fromInst = String(item.tipo || '');
    if (JEWEL_TYPES.includes(fromInst as (typeof JEWEL_TYPES)[number])) return fromInst;
    if (fromInst === 'jewel' && fromBaseItem) return fromBaseItem;
    if (ARMOR_TYPES.includes(fromInst as (typeof ARMOR_TYPES)[number])) return fromInst;
    if (WEAPON_TYPES.includes(fromInst as (typeof WEAPON_TYPES)[number])) return fromInst;

    return fromInst || fromBaseTipo || fromBaseItem || 'misc';
  },

  /** Brinco/anel: slot explícito ou primeiro vazio (ear1/ring1, depois ear2/ring2). */
  pickDualJewelSlot(subTipo: string, slotExplicito?: string): EquipBodySlot | '' {
    const slotLado = String(slotExplicito || '').trim();
    if (subTipo === 'ear') {
      if (slotLado === 'ear1' || slotLado === 'ear2') return slotLado;
      if (!window.brincoEquipado1) return 'ear1';
      if (!window.brincoEquipado2) return 'ear2';
      return 'ear1';
    }
    if (subTipo === 'ring') {
      if (slotLado === 'ring1' || slotLado === 'ring2') return slotLado;
      if (!window.anelEquipado1) return 'ring1';
      if (!window.anelEquipado2) return 'ring2';
      return 'ring1';
    }
    return '';
  },

  /**
   * Adiciona um item ao inventário de forma segura.
   * O item DEVE ser um objeto { tipo, base, enchant, augmented, uid }
   */
  adicionarEquipamento(item: EquipInstance | EquipRawInput | null | undefined): boolean {
    if (!item || !item.base) return false;

    let itemSeguro: EquipInstance | null = item as EquipInstance;
    if (!window.ItemSecurity.isValidInstance(item)) {
      itemSeguro = window.ItemSecurity.createInstance(item.tipo || 'misc', item.base, {
        enchant: item.enchant,
        augmented: item.augmented,
        origin: item.origin || 'System',
      });
    }

    if (!itemSeguro) return false;

    const existeNaBolsa = window.inventarioEquips.some((i) => i.uid === itemSeguro!.uid);
    if (existeNaBolsa) {
      console.warn('[InventoryManager] Tentativa de duplicar item na bolsa bloqueada:', itemSeguro.uid);
      return false;
    }

    if (this.estaEquipado(itemSeguro.uid)) {
      console.warn('[InventoryManager] Tentativa de adicionar item equipado à bolsa bloqueada:', itemSeguro.uid);
      return false;
    }

    window.inventarioEquips.unshift(itemSeguro);
    if (typeof window.InventarioRecent !== 'undefined') {
      window.InventarioRecent.touchEquip(itemSeguro.uid);
    }
    return true;
  },

  /** Adiciona stack à bolsa e marca como recente (exceto moedas). */
  adicionarStack(nome: string, qtd: number): void {
    if (!nome || qtd <= 0) return;
    if (!window.inventario || typeof window.inventario !== 'object') {
      window.inventario = {};
    }

    if (
      typeof window.InventoryStackKeys !== 'undefined' &&
      typeof window.InventoryStackKeys.normalizarInventarioStackKeys === 'function'
    ) {
      window.InventoryStackKeys.normalizarInventarioStackKeys(window.inventario);
    }

    const resolveKey =
      typeof window.InventoryStackKeys !== 'undefined' &&
      typeof window.InventoryStackKeys.resolveInventarioStackKey === 'function'
        ? window.InventoryStackKeys.resolveInventarioStackKey.bind(window.InventoryStackKeys)
        : (k: string) => k;

    const canonical = resolveKey(nome);
    if (!canonical) return;

    window.inventario[canonical] = (Number(window.inventario[canonical]) || 0) + qtd;

    if (typeof window.InventarioRecent !== 'undefined') {
      if (typeof window.InventoryStackKeys?.remapInventarioRecentStackAliases === 'function') {
        window.InventoryStackKeys.remapInventarioRecentStackAliases();
      }
      window.InventarioRecent.touchStack(canonical);
    }
  },

  estaEquipado(uid: string | null | undefined): boolean {
    if (!uid) return false;
    return equippedSlots().some((e) => e && e.uid === uid);
  },

  /**
   * Remove equip por UID da bolsa e/ou slots equipados (ex.: cristalização no encantamento).
   * Não move o item destruído para a bolsa.
   */
  removerEquipamentoPorUid(uid: string | null | undefined): boolean {
    if (!uid) return false;
    if (Array.isArray(window.inventarioEquips)) {
      window.inventarioEquips = window.inventarioEquips.filter((i) => i && i.uid !== uid);
    }
    if (window.armaEquipadaBase?.uid === uid) window.armaEquipadaBase = null;
    if (window.armaduraEquipada?.uid === uid) window.armaduraEquipada = null;
    if (window.colarEquipado?.uid === uid) window.colarEquipado = null;
    if (window.brincoEquipado1?.uid === uid) window.brincoEquipado1 = null;
    if (window.brincoEquipado2?.uid === uid) window.brincoEquipado2 = null;
    if (window.anelEquipado1?.uid === uid) window.anelEquipado1 = null;
    if (window.anelEquipado2?.uid === uid) window.anelEquipado2 = null;
    return true;
  },

  /** Move um item da bolsa para o corpo. */
  equiparGarantido(indexBolsa: number, slotAlvoExplicito?: string): boolean {
    const item = window.inventarioEquips[indexBolsa];
    if (!item) return false;

    if (typeof window.validarEquipPorGrade === 'function') {
      const val = window.validarEquipPorGrade(item);
      if (!val.permitido) {
        const forModal = item.base && typeof item.base === 'object' ? item.base : item;
        if (typeof window.fecharJanelaAcao === 'function') window.fecharJanelaAcao();
        if (typeof window.abrirJanelaBloqueioGrade === 'function') {
          window.abrirJanelaBloqueioGrade(forModal, val.nivelMinimo ?? 0, val.grade ?? '');
        } else if (typeof window.mostrarAviso === 'function') {
          window.mostrarAviso(
            typeof window.t === 'function'
              ? window.t('game.inventory.needLevelToEquip', { level: val.nivelMinimo ?? 0 })
              : `You need level ${val.nivelMinimo ?? 0} to equip this item.`,
          );
        }
        return false;
      }
    }

    const subTipo = this.resolveEquipSubTipo(item);
    let slot: EquipBodySlot | '' = '';
    const slotLado = String(slotAlvoExplicito || '').trim();

    if (WEAPON_TYPES.includes(subTipo as (typeof WEAPON_TYPES)[number])) slot = 'weapon';
    else if (ARMOR_TYPES.includes(subTipo as (typeof ARMOR_TYPES)[number])) slot = 'armor';
    else if (subTipo === 'neck') slot = 'neck';
    else if (subTipo === 'ear' || subTipo === 'ring') {
      slot = this.pickDualJewelSlot(subTipo, slotLado);
    }

    if (!slot) return false;

    if (slot === 'armor' && typeof window.armorMatchesClass === 'function') {
      const base = catalogFromItem(item) ?? ({} as ItemCatalogBase);
      const isMage = typeof window.isClasseMagica === 'function' && window.isClasseMagica(window.charClass);
      if (!window.armorMatchesClass(base, isMage)) {
        if (typeof window.mostrarAviso === 'function') {
          window.mostrarAviso(
            typeof window.t === 'function'
              ? window.t('game.inventory.wrongArmorArchetype')
              : 'This armor does not match your class archetype.',
          );
        }
        return false;
      }
    }

    const itemParaEquipar = window.inventarioEquips.splice(indexBolsa, 1)[0];
    this.desequiparGarantido(slot);

    switch (slot) {
      case 'weapon':
        window.armaEquipadaBase = itemParaEquipar;
        break;
      case 'armor':
        window.armaduraEquipada = itemParaEquipar;
        break;
      case 'neck':
        window.colarEquipado = itemParaEquipar;
        break;
      case 'ear1':
        window.brincoEquipado1 = itemParaEquipar;
        break;
      case 'ear2':
        window.brincoEquipado2 = itemParaEquipar;
        break;
      case 'ring1':
        window.anelEquipado1 = itemParaEquipar;
        break;
      case 'ring2':
        window.anelEquipado2 = itemParaEquipar;
        break;
    }

    this.sincronizarStatus();
    return true;
  },

  /** Move um item do corpo para a bolsa. */
  desequiparGarantido(slot: EquipBodySlot | string): boolean {
    let itemParaBolsa: EquipInstance | null = null;

    switch (slot) {
      case 'weapon':
        if (window.armaEquipadaBase?.base) {
          itemParaBolsa = window.armaEquipadaBase;
          window.armaEquipadaBase = null;
        }
        break;
      case 'armor':
        if (window.armaduraEquipada) {
          itemParaBolsa = window.armaduraEquipada;
          window.armaduraEquipada = null;
        }
        break;
      case 'neck':
        if (window.colarEquipado) {
          itemParaBolsa = window.colarEquipado;
          window.colarEquipado = null;
        }
        break;
      case 'ear1':
        if (window.brincoEquipado1) {
          itemParaBolsa = window.brincoEquipado1;
          window.brincoEquipado1 = null;
        }
        break;
      case 'ear2':
        if (window.brincoEquipado2) {
          itemParaBolsa = window.brincoEquipado2;
          window.brincoEquipado2 = null;
        }
        break;
      case 'ring1':
        if (window.anelEquipado1) {
          itemParaBolsa = window.anelEquipado1;
          window.anelEquipado1 = null;
        }
        break;
      case 'ring2':
        if (window.anelEquipado2) {
          itemParaBolsa = window.anelEquipado2;
          window.anelEquipado2 = null;
        }
        break;
    }

    if (itemParaBolsa) {
      this.adicionarEquipamento(itemParaBolsa);
    }

    this.sincronizarStatus();
    return true;
  },

  /** Sincroniza interfaces e globais legados. */
  sincronizarStatus(): void {
    window.enchant = window.armaEquipadaBase?.enchant || 0;
    window.enchantArmor = window.armaduraEquipada?.enchant || 0;
    window.isAugmented =
      !!(window.armaEquipadaBase && (window.armaEquipadaBase.augmented || window.armaEquipadaBase.augmented === true));

    if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
    if (typeof window.atualizar === 'function') window.atualizar();
    if (typeof window.renderizarPerfil === 'function') window.renderizarPerfil();
    if (typeof window.renderizarInventario === 'function') window.renderizarInventario();
    if (typeof window.salvarJogo === 'function') window.salvarJogo();
  },
};

export {};
