/**
 * Tipos de domínio RogueAge — referência para migração TS.
 * Paridade com js/core_persistence.js (save v7) e js/core_globals.js.
 */

/** Versão actual do formato de save (js/core_persistence.js). */
export const L2MINI_SAVE_VERSION = 19 as const;

/** Atalhos visíveis na barra de ação (2 linhas × 6 colunas). */
export const L2MINI_HOTBAR_SLOT_COUNT = 12 as const;
export const L2MINI_HOTBAR_GRID_COLS = 6 as const;

/** Filtro activo na grelha da bolsa. */
export type InventarioBagFilter =
  | 'recent'
  | 'all'
  | 'equipment'
  | 'materials'
  | 'consumables'
  | 'recipes'
  | 'other';

/** Ledger de recência na bolsa (equip uid / stack id). */
export interface InventarioRecentEntry {
  k: 'e' | 's';
  id: string;
  ts: number;
}

export type UiLocale = 'en' | 'pt-BR';

/** Shell preference: Auto follows viewport; portrait = mobile; landscape = PC. */
export type UiLayoutMode = 'auto' | 'portrait' | 'landscape';

/** Slug normalizado de grade de item (NG → S). */
export type GradeSlug = 'ng' | 'd' | 'c' | 'b' | 'a' | 's';

export interface GradeUiInfo {
  slug: GradeSlug;
  color: string;
  cssColor: string;
  cssBorder: string;
  cssGlow: string;
  cssBg: string;
}

export type PaperdollPresetId =
  | 'human_fighter'
  | 'human_fighter_female'
  | 'human_mage'
  | 'human_mage_female'
  | 'dark_elf_fighter'
  | 'dark_elf_fighter_female'
  | 'dark_elf_mage'
  | 'dark_elf_mage_female'
  | 'elf_fighter'
  | 'elf_fighter_female'
  | 'elf_mage'
  | 'elf_mage_female'
  | 'orc_fighter'
  | 'orc_fighter_female'
  | 'orc_mage'
  | 'orc_mage_female'
  | 'dwarf_male'
  | 'dwarf_female';

export interface PaperdollLayerOffset {
  x?: number;
  y?: number;
}

export interface PaperdollConfig {
  art: {
    masterWidth: number;
    masterHeight: number;
    displayWidth: number;
    displayHeight: number;
    scale: number;
    aspectRatio: string;
  };
  presetsRoot: string;
  defaultPresetId: PaperdollPresetId;
  globalSceneryFile: string;
  charScale: number;
  charDropPercent: number;
  figureWidthPercent: number;
  sceneryPosY: string;
  sceneryShiftY: string;
  colGapPx: number;
  gearCloseInsetPx: number;
  footShadowTuckPx: number;
  footShadowHeightPx: number;
  footShadowHeightNorm: number;
  footShadowGroundBiasNorm: number;
  footShadowWidthBoost: number;
  footShadowWidthPadPx: number;
  footShadowWidthMinPct: number;
  footShadowWidthMaxPct: number;
  footShadowFallbackWidthPct: number;
  footShadowFallbackHeightPct: number;
  feetScanMaxWidth: number;
  feetAlphaMin: number;
  feetBandHeightRatio: number;
  charLayerFillStage: boolean;
  charLayerHeightPercent: number;
  charLayerMaxWidth: string;
  layerClipInset: string;
  baseClipInset: string;
  divinoStrength: number;
  weaponAuraKeyframe: string;
  weaponDivinoKeyframe: string;
  artAnchors: {
    feetX: number;
    feetY: number;
    stageLeft: number;
    stageRight: number;
    stageTop: number;
    stageBottom: number;
  };
  layerScreenOffset: {
    base?: PaperdollLayerOffset;
    armor?: PaperdollLayerOffset;
    weapon?: PaperdollLayerOffset;
    weaponGrip?: PaperdollLayerOffset;
    hands?: PaperdollLayerOffset;
  };
}

export type PaperdollLayerRole =
  | 'base'
  | 'armor'
  | 'weapon'
  | 'weaponGrip'
  | 'weaponGlow'
  | 'hands';

export interface PaperdollFeetScan {
  footBottomNorm: number;
  footLeftNorm: number;
  footRightNorm: number;
  feetFromBottomNorm: number;
  footCenterNorm: number;
  footWidthNorm: number;
}

export interface PaperdollLayoutNorm {
  feetFromBottomNorm: number;
  footCenterNorm: number;
  footWidthNorm: number;
}

export interface PaperdollRefreshOptions {
  presetId?: PaperdollPresetId | string;
  armaduraEquipada?: EquipInstance | null;
  armaEquipadaBase?: EquipInstance | null;
  syncProfileGlows?: boolean;
  syncWeaponGlow?: boolean;
}

export interface PaperdollCharSelectData {
  charRace?: string;
  charClass?: string;
  charGender?: string;
  armaduraEquipada?: EquipInstance | null;
  armaEquipadaBase?: EquipInstance | null;
}

export interface PlayerStats {
  maxHp: number;
  maxMp: number;
  maxCp: number;
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  critRate: number;
  atkSpeed: number;
  castSpeed: number;
  runSpeed: number;
}

/** Subconjunto usado em breakdown detalhado (`core_stats` + modal em `ui_inventory`). */
export interface StatBreakdownSection {
  [key: string]: number | string | boolean | null | undefined;
}

export interface PlayerStatBreakdown {
  nivel: number;
  charRace: string;
  charClass: string;
  isMage?: boolean;
  armorEnchant: number;
  weaponEnchant: number;
  perLevel?: StatBreakdownSection;
  cpMult: number;
  cpTotal: number;
  critRate: number;
  classMod: StatBreakdownSection & { atk: number; def: number };
  buffs: StatBreakdownSection & {
    fighter: boolean;
    mage: boolean;
    pAtkMult: number;
    pDefMult: number;
    mAtkMult: number;
    mDefMult: number;
  };
  clan: StatBreakdownSection & { pAtk: number; pDef: number; mAtk: number; hp?: number };
  castle: StatBreakdownSection & {
    pAtk: number;
    pDef: number;
    mAtk: number;
    mDef: number;
    castlesOwned?: number;
  };
  title?: {
    titleId: string | null;
    pAtk: number;
    mAtk: number;
    pDef: number;
    mDef: number;
    maxHp: number;
    maxMp: number;
    critRate: number;
    atkSpeedMs: number;
  };
  hp: StatBreakdownSection & {
    total: number;
    clanMultOnSum?: number;
    classHpMult?: number;
    raceBaseHp?: number;
    hpPerLevels?: number;
    augmentFromWeapon?: number;
    characterPool?: number;
    armor?: number;
    weapon?: number;
    jewels?: number;
    title?: number;
  };
  mp: StatBreakdownSection & {
    total: number;
    classMpMult?: number;
    mpBaseDaClasse?: number;
    raceBaseMp?: number;
    mpPerLevels?: number;
    armor?: number;
    weapon?: number;
    jewels?: number;
    title?: number;
  };
  pAtk: StatBreakdownSection & {
    total: number;
    raceBaseMelee?: number;
    weaponBase?: number;
    weaponEnchant?: number;
    augment?: number;
    levelPts?: number;
    atkTotalCore?: number;
    afterMultsNoEquip?: number;
    armorEquip?: number;
    jewelsEquip?: number;
    rawSumBeforeMult?: number;
    title?: number;
  };
  mAtk: StatBreakdownSection & {
    total: number;
    raceBaseMagic?: number;
    weaponBaseM?: number;
    weaponEnchantM?: number;
    augment?: number;
    levelPts?: number;
    matkTotalCore?: number;
    afterMultsNoEquip?: number;
    armorEquip?: number;
    jewelsEquip?: number;
    title?: number;
  };
  pDef: StatBreakdownSection & {
    total: number;
    flatMeleeBlock?: number;
    flatCore?: number;
    armorPDef?: number;
    levelPts?: number;
    augment?: number;
    rawSumBeforeMult?: number;
    afterClassBuffClanCastle?: number;
    title?: number;
  };
  mDef: StatBreakdownSection & {
    total: number;
    flatBase?: number;
    armorBonusMDef?: number;
    armorFlatMDef?: number;
    jewelsFlat?: number;
    levelPts?: number;
    augment?: number;
    rawSumBeforeMult?: number;
    afterClassBuffClanCastle?: number;
    title?: number;
  };
  critParts: StatBreakdownSection & { rawBeforeCap?: number; cap?: number; title?: number };
  atkSpeed: StatBreakdownSection & { totalMs: number; floored250?: boolean; reduceTitleMs?: number };
  joiasPorStat?: Array<{ value?: number; stat?: string; nome?: string; slot?: string }>;
}

export interface ItemCatalogBase {
  nome?: string;
  id?: string;
  tipo?: string;
  tipoItem?: string;
  atk?: number;
  pDef?: number;
  mDef?: number;
  img?: string;
  grade?: string;
  [key: string]: unknown;
}

/** Item de catálogo usado nas lojas NPC (Grocer + mega-shop). */
export interface ShopCatalogItem extends ItemCatalogBase {
  id: string;
  nome: string;
  preco?: number;
  desc?: string;
  img?: string;
  moeda?: string;
}

export type ShopCurrencyKind = 'adena' | 'ancient';
export type ShopCheckoutMode = 'buy' | 'sell';
export type ShopGrocerCategory = 'consumables' | 'scrolls';
export type ShopEquipTab = 'weapon' | 'armor' | 'jewel';

export interface ShopCheckoutSummaryOpts {
  mode?: ShopCheckoutMode;
  currencyKind?: ShopCurrencyKind;
  unitPrice?: number;
  quantity?: number;
  total?: number;
  showQuantity?: boolean;
}

export interface NpcShopBuyStackableResult {
  ok?: boolean | string;
  error?: string;
  adenas?: number | string;
  ancient_coins?: number | string;
  item_name?: string;
  qty_after?: number | string;
}

export type CraftCategory = 'special' | 'mats';

export interface CraftIngredient {
  id: string;
  qtd: number;
}

export interface CraftResultItem {
  tipoBase: string;
  idBase: string;
  gerado?: number;
}

export interface CraftResultChoice {
  idBase: string;
  tipoBase: string;
  label: string;
}

export interface CraftRecipe {
  idReceita: string;
  nome: string;
  img?: string;
  desc?: string;
  taxaSucesso?: number;
  itemResultado?: CraftResultItem;
  ingredientes: CraftIngredient[];
  escolhasResultado?: CraftResultChoice[];
}

export interface CraftItemRpcResult {
  success?: boolean;
  error?: string;
  adenas?: number | string;
  ancientCoins?: number | string;
  inventario?: Record<string, number>;
  inventarioEquips?: unknown;
  id_base_crafted?: string;
  tipo_crafted?: string;
}

export interface CraftCreditResult {
  nomeGerado: string;
  imgGerada: string | undefined;
}

export type EnchantEquipKind = 'weapon' | 'armor' | 'jewel';

export interface EnchantScrollCatalogEntry extends ShopCatalogItem {
  tipo?: string;
  abencoado?: boolean;
}

export interface EnchantScrollMeta {
  tipo: string | null;
  grade: string | null;
  abencoado: boolean;
}

export interface EnchantTargetEquip {
  idUnico: string;
  local: 'equipado' | 'bolsa';
  index?: number;
  tipo: string;
  base: ItemCatalogBase;
  lvl: number;
  isAugment: boolean;
  uid?: string;
  refOriginal: EquipInstance;
}

export interface EnchantItemRpcResult {
  success?: boolean;
  error?: string;
  enchant_success?: boolean;
  new_level?: number;
  crystallized?: boolean;
  crystals_gained?: number;
}

export interface AugmentStatPayload {
  txt?: string;
  val?: number;
}

export interface AugmentItemRpcResult {
  success?: boolean;
  error?: string;
  adenas?: number | string;
  ancientCoins?: number | string;
  inventario?: Record<string, number>;
  inventarioEquips?: unknown;
  armaEquipadaBase?: EquipInstance | Record<string, unknown> | null;
  item_updated?: EquipInstance | Record<string, unknown> | string | null;
  aug_level?: number | string;
  stat1?: AugmentStatPayload | string;
  stat2?: AugmentStatPayload | string;
}

/** Seleção de arma na UI de augment (equipada ou bolsa). */
export interface AugmentArmaSelection {
  base: ItemCatalogBase | EquipInstance;
  enchant?: number;
  augmented?: boolean;
  uid?: string;
  augLevel?: number;
  augPAtk?: number;
  augMAtk?: number;
  augPDef?: number;
  augMDef?: number;
  augSpd?: number;
  augCrit?: number;
  img?: string;
  nome?: string;
  atk?: number;
  matk?: number;
  grade?: string;
}

export type AugmentIndexArma = number | 'equipped' | null;

/** Instância única de equipamento (ItemSecurity.createInstance). */
export interface EquipInstance {
  uid: string;
  tipo: string;
  base: ItemCatalogBase;
  enchant: number;
  enchantArmor?: number;
  enchantJewel?: number;
  augmented?: boolean;
  origin?: string;
  owner?: string;
  createdAt?: string;
}

export type InventarioStack = Record<string, number>;

export type HotbarSlot = string | null;

/** Entrada do catálogo `bancoDeSkills` (js/skills.js). */
export interface SkillCatalogEntry {
  tipo: string;
  mp: number;
  cd: number;
  poder?: number;
  desc?: string;
  cor?: string;
  icone?: string;
  danoMult?: number;
  curaFixa?: number;
  curaMult?: number;
  executar?: () => void;
  [key: string]: unknown;
}

export interface SkillTreeEntry {
  lvl: number;
  nome: string;
}

export interface LearnedSkillMeta extends SkillCatalogEntry {
  idNome: string;
  _learnLvl?: number;
  /** Spellbook-only: skill visible but not yet unlocked. */
  _locked?: boolean;
  /** Class node that grants this skill (for locked preview labels). */
  _classNode?: string;
  /** Spellbook section bucket (ready / current-path upcoming / next-spec preview). */
  _spellbookGroup?: 'ready' | 'upcoming' | 'spec';
}

/** Grouped Spellbook list for sectioned UI. */
export interface SpellbookSection {
  id: string;
  kind: 'ready' | 'upcoming' | 'spec';
  /** Internal class id for specialization preview sections. */
  classNode?: string;
  /** Display level shown in section header (min learn / transfer req). */
  reqLvl?: number;
  skills: LearnedSkillMeta[];
}

export type ChatLogTab = 'combat' | 'chat' | 'clan';

export interface ChatHistoryEntry {
  autor: string;
  mensagem: string;
  tipo: string;
  timestamp: number;
  ascensionTitle?: string;
  /** ID em `global_chat_messages` — dedup local ↔ nuvem */
  cloudId?: string | number;
}

export interface GlobalChatRow {
  id?: string | number;
  char_name?: string;
  body?: string;
  tier?: string;
  ascension_title?: string;
  msg_kind?: string;
  i18n_key?: string;
  i18n_params?: Record<string, string | number> | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface ClanChatRow {
  id?: string | number;
  char_name?: string;
  body?: string;
  tier?: string;
  ascension_title?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface ChatInspectProfileData {
  nome: string;
  classe: string;
  _classKey?: string;
  nivel: number;
  olympiadPoints?: number;
  raca?: string;
  charGender?: string;
  isMage?: boolean;
  maxHp?: number;
  maxMp?: number;
  pAtk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  atkSpd?: number;
  critRate?: number;
  renown?: number;
  ascensionTitle?: string;
  isCloudPlayerInspection?: boolean;
  equipamentos?: {
    arma?: unknown;
    armadura?: unknown;
    joias?: unknown[];
    enchant?: number;
  };
  [key: string]: unknown;
}

export interface InspectionCacheEntry {
  data: ChatInspectProfileData;
  timestamp: number;
}

export interface InspectionCachePreview {
  nivel: number | null;
  classe: string | null;
  raca: string | null;
  charGender: string | null;
}

export interface EndgameData {
  weeklyChampionKills: number;
  weeklyWeekKey: string;
  lastClaimedWeekKey: string;
  lifetimeChampionKills: number;
  renown: number;
}

export interface EndgameKillRpcResult {
  success?: boolean;
  error?: string;
  endgame?: Partial<EndgameData>;
  weeklyChampionKills?: number;
  weeklyWeekKey?: string;
  lifetimeChampionKills?: number;
  renown?: number;
  [key: string]: unknown;
}

export interface EndgameClaimRpcResult {
  success?: boolean;
  error?: string;
  new_renown?: number;
  added_adena?: number;
  added_ancient?: number;
  endgame?: Partial<EndgameData>;
  [key: string]: unknown;
}

export interface EndgameRpcEnvelope<T = EndgameKillRpcResult | EndgameClaimRpcResult> {
  data?: T | null;
  error?: { message?: string } | null;
}

export interface EndgamePursuitsApi {
  SGRADE_LEVEL: number;
  WEEKLY_CHAMP_TARGET: number;
  WEEKLY_CHAMP_KILL_CAP: number;
  onChampionKill: () => void;
  normalizeAfterLoad: () => void;
  claimWeeklyEliteHunt: () => Promise<void>;
  openEndgamePursuits: () => void;
  closeEndgamePursuits: () => void;
  refreshEndgamePanelUI: () => void;
  refreshPublicAscensionHUD: () => void;
  getRenown: () => number;
  getRenownTitle: () => string;
  getAscensionTitleForRenown: (renown: number) => string;
  getIsoWeekKey: (d?: Date) => string;
  [key: string]: unknown;
}

export interface TutorialProgress {
  v?: number;
  active: boolean;
  step: number;
  completed: boolean;
  skipped: boolean;
}

export interface UiCoachSave {
  menuTownSeen?: boolean;
  mailboxTipSeen?: boolean;
  missionsTipSeen?: boolean;
}

/** Claimed level milestone rewards (Achievements hub). */
export interface LevelRewardsSave {
  claimed: number[];
}

/** Flat combat bonuses granted by an equipped Journey title. */
export type { TitleStatBonus } from '../game/gameplay_title_bonuses';

/** Lifetime gameplay achievements + chat titles (Journey tab). */
export interface GameplayAchievementsSave {
  /** Cumulative counters keyed by achievement stat id. */
  stats: Record<string, number>;
  /** Title ids the player has claimed/unlocked. */
  unlockedTitles: string[];
  /** Currently equipped title id, or null. */
  equippedTitleId: string | null;
}

/** 7-day newbie login calendar + monthly calendar + recruit journey + comeback. */
export interface RetentionSave {
  newbie: {
    startDayKey: string;
    claimedDays: number[];
    completed: boolean;
    day7WeaponId: string | null;
  };
  monthly: {
    monthKey: string;
    claimedDays: number[];
    lastClaimDayKey: string;
  };
  journey: {
    completedSteps: number[];
    claimedSteps: number[];
    completed: boolean;
  };
  comeback: {
    lastSeenAt: number;
    lastComebackDayKey: string;
  };
  clanPromptDismissed: boolean;
  clanJoinRewardClaimed: boolean;
}

export type RetentionHubTab = 'newbie' | 'monthly' | 'journey';

export interface RetentionWeaponChoice {
  id: string;
  styleKey: string;
}

export interface RetentionEngineApi {
  getSave: () => RetentionSave;
  afterCharacterLoad: () => void;
  onGameEvent: (event: string, value?: number) => void;
  countPending: () => number;
  getNewbieCurrentDay: () => number;
  getMonthlyCurrentDay: () => number;
  canClaimNewbieDay: (day: number) => boolean;
  canClaimMonthlyDay: (day: number) => boolean;
  claimNewbieDay: (day: number, weaponId?: string) => boolean;
  claimMonthlyDay: (day: number) => boolean;
  claimJourneyStep: (step: number) => boolean;
  hasComebackReady: () => boolean;
  claimComeback: () => boolean;
  getComebackPreview?: () => DailyMissionReward | null;
  getComebackTierKey?: () => string;
  getComebackHoursAway?: () => number;
  shouldShowClanPrompt: () => boolean;
  dismissClanPrompt: () => void;
  getWeaponChoices: () => RetentionWeaponChoice[];
  getJourneyProgress: (step: number) => number;
  touchLastSeen: () => void;
  [key: string]: unknown;
}

/** Mid-run Forest Expedition — persisted so leave/reload keeps the bag. */
export type ExpeditionPathTypeSave =
  | 'combat' | 'boss' | 'chest' | 'elite' | 'merchant' | 'forge'
  | 'scout' | 'patrol' | 'tracks' | 'warhorn' | 'ambush';

export type ExpeditionRareEventTypeSave = 'shrine' | 'gambler' | 'cache' | 'storm';
export type JourneyMobTraitSave = 'brutal' | 'swift' | 'lethal' | 'armored' | 'frenzied';
export type ExpeditionRunPanelTabSave = 'path' | 'stats' | 'builds' | 'gear';

export interface ExpeditionRunSave {
  v: 1;
  /** True when the player left Forest / closed the game mid-run (buffs paused). */
  suspended: boolean;
  zoneId: string;
  journey: number;
  pathChoices: Array<{ id: string; type: ExpeditionPathTypeSave }>;
  currentPath: ExpeditionPathTypeSave | null;
  /** True if the run was interrupted mid-fight — resume must re-enter the same path. */
  combatInterrupted?: boolean;
  combatOnlyNextJourney: boolean;
  combatOnlyThisJourney: boolean;
  /** Scout foresight pending for next journey (`fight` | `safe`). */
  nextPathBias?: 'fight' | 'safe' | null;
  /** Tracks foresight — guaranteed path type on next journey. */
  nextPathGuarantee?: string | null;
  /** Bias that shaped the current journey (UI banner). */
  pathBiasThisJourney?: 'fight' | 'safe' | null;
  runBuffs: Record<string, number>;
  /** Unlocked synergy build ids this run (optional — older saves may use activeBuildId). */
  unlockedBuildIds?: string[];
  /** @deprecated Prefer unlockedBuildIds — migrated on load. */
  activeBuildId?: string | null;
  runEnchantBonus: Record<string, number>;
  runStats: Record<string, number | string | null>;
  journeyTrait: JourneyMobTraitSave;
  nextJourneyTrait: JourneyMobTraitSave;
  luckLootMult: number;
  luckLegendaryNext: boolean;
  rareEventJourney: number;
  rareEventUsed: boolean;
  pendingRareEvent: boolean;
  rareEventType: ExpeditionRareEventTypeSave | null;
  runPanelTab: ExpeditionRunPanelTabSave;
  bag: { adenas: number; xp: number; drops: Record<string, number> };
  /** Vitals frozen for the run — restored when resuming the map (town heal does not carry in). */
  vitals: { hp: number; mp: number; cp: number };
  pendingUpgradeIds?: string[];
  lastCombatLoot?: { adenas: number; xp: number; drops: Record<string, number> } | null;
}

/** Between-run Forest Expedition ledger (persists across extracts). */
export type ExpeditionMetaOutcome = 'extract' | 'death';

export interface ExpeditionZoneMeta {
  bestJourney: number;
  extracts: number;
  deaths: number;
  runsStarted: number;
  /** Best Adena kept on a successful extract in this zone. */
  bestExtractAdena: number;
  lastOutcome: ExpeditionMetaOutcome | null;
  lastJourney: number;
  lastAdenaKept: number;
  lastAt: number;
}

export interface ExpeditionMetaSave {
  v: 1;
  totalExtracts: number;
  totalDeaths: number;
  totalRunsStarted: number;
  bestJourneyEver: number;
  bestExtractAdenaEver: number;
  byZone: Record<string, ExpeditionZoneMeta>;
}

/** Payload persistido (localStorage + characters.data JSONB). */
export interface CharacterSave {
  saveVersion?: number;
  charName: string;
  charRace: string;
  charGender: string;
  charClass: string;
  adenas: number;
  ancientCoins?: number;
  /** Legado */
  adena?: number;
  enchant: number;
  enchantArmor: number;
  nivel: number;
  xpAtual: number;
  xpNecessario?: number;
  isAugmented?: boolean;
  playerHP: number;
  playerMP: number;
  playerCP: number;
  inventario: InventarioStack;
  inventarioEquips: EquipInstance[];
  armaEquipadaBase: EquipInstance | null;
  armaduraEquipada: EquipInstance | null;
  colarEquipado?: EquipInstance | null;
  brincoEquipado1?: EquipInstance | null;
  brincoEquipado2?: EquipInstance | null;
  anelEquipado1?: EquipInstance | null;
  anelEquipado2?: EquipInstance | null;
  barraAtalhos: HotbarSlot[];
  tempoFimBuffGuerreiro?: number;
  tempoFimBuffMistico?: number;
  olympiadPoints?: number;
  olympiadWins?: number;
  olympiadLosses?: number;
  olympiadRewardsClaimed?: unknown[];
  lastSeasonData?: LastSeasonData;
  endgame?: EndgameData;
  uiLocale?: UiLocale;
  /** Shell layout preference (auto / portrait / landscape). */
  uiLayoutMode?: UiLayoutMode;
  tutorial?: TutorialProgress;
  uiCoach?: UiCoachSave;
  /** Level milestone rewards — claimed level numbers (1..N). */
  levelRewards?: LevelRewardsSave;
  /** Lifetime gameplay achievements + equipped chat title. */
  gameplayAchievements?: GameplayAchievementsSave;
  /** Login calendars, recruit journey, comeback rewards. */
  retention?: RetentionSave;
  /** Skill ids unlocked but not yet inspected in the Spellbook (UI badges). */
  unseenSkillUnlocks?: string[];
  /**
   * Mid-run Forest Expedition snapshot (bag, buffs, path). Null/absent = no active run.
   * Client-authoritative until extract RPC (§12.7).
   */
  expeditionRun?: ExpeditionRunSave | null;
  /** Between-run expedition ledger (PB journey, extracts, last run) — survives extract. */
  expeditionMeta?: ExpeditionMetaSave | null;
  playerClanId?: number | string | null;
  mailboxCloud?: unknown[];
  inventarioRecentLog?: InventarioRecentEntry[];
  [key: string]: unknown;
}

export interface SalvarJogoOptions {
  silent?: boolean;
  /** Ignora throttle de 2s em `SupabaseAPI.savePlayer` (ex.: resgate de encomenda). */
  forceCloud?: boolean;
}

export interface CarregarJogoOptions {
  forceOlympiadReset?: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export type I18nParams = Record<string, string | number>;

export type I18nLocaleTree = Record<string, unknown>;

export interface I18nSetLocaleOptions {
  persistDevice?: boolean;
  persistCharacter?: boolean;
}

export interface I18nApi {
  DEVICE_KEY: string;
  FALLBACK_LOCALE: UiLocale;
  SUPPORTED: UiLocale[];
  register: (locale: string, tree: I18nLocaleTree) => void;
  init: () => void;
  getLocale: () => UiLocale;
  setLocale: (code: string, opts?: I18nSetLocaleOptions) => void;
  cycleLocale: () => void;
  applyFromSave: (fromSave?: string | null) => void;
  t: (key: string, params?: I18nParams) => string;
  getArray: (key: string) => unknown[];
  refreshDom: (root?: ParentNode | Document | null) => void;
  normalizeLocale: (code: string) => UiLocale;
}

export interface ItemSecurityApi {
  generateUID: (prefix?: string) => string;
  createInstance: (
    tipo: string,
    base: ItemCatalogBase,
    overrides?: Partial<EquipInstance> & { enchantArmor?: number; enchantJewel?: number },
  ) => EquipInstance | null;
  isValidInstance: (item: unknown) => boolean;
  registerDestruction: (item: EquipInstance | null | undefined) => void;
}

export interface EconomyBalanceApi {
  NOVICE_LEVEL_CAP: number;
  shopLevelPriceMult: (level: number) => number;
  effectiveShopUnitPrice: (basePrice: number, level: number) => number;
  adenaLootMult: (level: number, zonaId?: string | null) => number;
  noviceXpGainMult: (level: number) => number;
  noviceXpRequiredMult: (level: number) => number;
  scaleNoviceXpGain: (baseXp: number, level: number) => number;
  scaleNoviceXpRequired: (baseRequired: number, level: number) => number;
  noviceIncomingDamageMult: (level: number, zoneId?: string | null, isChampion?: boolean) => number;
  resolveNoviceMobTune: (baseTune: ZonalMobTuneEntry, level: number, zoneId?: string | null) => ZonalMobTuneEntry;
  grandMasterBuffPrice: (level: number) => number;
  MINT_ANCIENT_ADENA_COST: number;
  MINT_ANCIENT_SUCCESS_PCT: number;
  allowAncientCoinWorldDrops: boolean;
  isAncientCoinWorldDropEnabled: () => boolean;
}

export type EquipBodySlot = 'weapon' | 'armor' | 'neck' | 'ear1' | 'ear2' | 'ring1' | 'ring2';

/** Entrada bruta (loja/craft) antes de ItemSecurity.createInstance. */
export interface EquipRawInput {
  tipo?: string;
  base: ItemCatalogBase;
  enchant?: number;
  augmented?: boolean;
  origin?: string;
  uid?: string;
}

export interface StatPerLevel {
  hp: number;
  mp: number;
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  atkSpdMs: number;
}

export interface ZonalMobTuneEntry {
  hp: number;
  atk: number;
  def: number;
  championChance?: number;
  championHpMult?: number;
  championAtkMult?: number;
  championOnePerPull?: boolean;
  packAtkMult?: number;
  mobAtkSpdMult?: number;
}

export interface BuffsAtivos {
  pAtkMult: number;
  pDefMult: number;
  mAtkMult: number;
  mDefMult: number;
}

export type GradeEquipKey = 'NO-GRADE' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface GradeEquipValidation {
  permitido: boolean;
  nivelMinimo?: number;
  grade?: string;
  motivo?: string;
  nivelAtual?: number;
}

export interface InventoryStackKeysApi {
  findStackCatalogEntry: (raw: string | null | undefined) => { id?: string; nome?: string; img?: string; tipo?: string } | null;
  resolveInventarioStackKey: (raw: string | null | undefined) => string;
  stackAliasKeys: (raw: string | null | undefined) => string[];
  collectStackQtyFromAliases: (inv: InventarioStack, raw: string) => number;
  removeStackAliasKeys: (inv: InventarioStack, raw: string, except?: string) => void;
  normalizarInventarioStackKeys: (inv: InventarioStack | null | undefined) => void;
  remapInventarioRecentStackAliases: () => void;
}

export interface InventarioRecentApi {
  isCurrencyStack: (nome: string) => boolean;
  touchEquip: (uid: string | null | undefined) => void;
  touchStack: (nome: string | null | undefined) => void;
  getTs: (k: 'e' | 's', id: string) => number;
  classifyStack: (nome: string) => 'currency' | 'material' | 'consumable' | 'recipe' | 'scroll' | 'other';
  passesFilter: (
    filter: InventarioBagFilter,
    kind: 'equip' | 'stack',
    stackName?: string,
  ) => boolean;
  buildDisplayPlan: (
    filter: InventarioBagFilter,
  ) => Array<
    | { kind: 'currency'; name: string }
    | { kind: 'equip'; index: number; ts: number }
    | { kind: 'stack'; name: string; ts: number }
  >;
  seedFromCurrentInventory: () => void;
  normalizeLogFromSave: (raw: unknown) => InventarioRecentEntry[];
  pruneMissing: () => void;
}

export interface InventoryManagerApi {
  resolveEquipSubTipo: (item: EquipInstance | EquipRawInput | null) => string;
  pickDualJewelSlot: (subTipo: string, slotExplicito?: string) => EquipBodySlot | '';
  adicionarEquipamento: (item: EquipInstance | EquipRawInput | null | undefined) => boolean;
  adicionarStack: (nome: string, qtd: number) => void;
  estaEquipado: (uid: string | null | undefined) => boolean;
  removerEquipamentoPorUid: (uid: string | null | undefined) => boolean;
  equiparGarantido: (indexBolsa: number, slotAlvoExplicito?: string) => boolean;
  desequiparGarantido: (slot: EquipBodySlot | string) => boolean;
  sincronizarStatus: () => void;
}

export interface AuthEngineApi {
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    confirmPassword: string,
    email: string,
    emailConfirm: string,
  ) => Promise<void>;
  logout: () => void;
  showLogin: () => void;
  showRegister: () => void;
  startNewCharacter: () => void;
  init: () => void;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  currentAccount: string | null;
  loading: boolean;
  availableCharacters?: unknown[];
  isValidName?: (name: string) => boolean;
  isNameTaken?: (name: string) => Promise<boolean>;
  linkCharacterToAccount?: (charName: string) => Promise<void>;
  getAvatarForClass?: (charClass: string, charRace: string, charGender: string) => string;
  onPasswordRecoverySession?: (session: unknown) => void;
  onLoginSuccess?: (username: string) => void;
  _passwordRecoveryMode?: boolean;
  _manualPasswordLoginInProgress?: boolean;
  _fromAuthStateSignedIn?: boolean;
  renderCharacterList?: () => void;
}

/** Superfície mínima do Olympiad usada por Realtime / SupabaseAPI. */
export interface OlympiadEngineApi {
  init?: () => void;
  reset?: () => void;
  rewardsClaimed?: unknown[];
  ativo?: boolean;
  softNavAway?: () => void;
  allRanks?: unknown[];
  viewedRankIndex?: number;
  rankRewards?: Record<string, unknown>;
  dbRanking?: unknown[];
  getRank?: (pts: number | string) => OlympiadRankInfo;
  countClaimableRankRewards?: () => number;
  refreshOlympiadClaimNotifs?: () => void;
  abrirOlympiad?: () => void;
  OLY_LOCAL_ONLY?: boolean;
  handleMultiplayerEvent?: (evento: string, dados: unknown) => void;
  rivalConfirmou?: boolean;
  atualizarStatusConfirmacao?: () => void;
  olyPairSessionId?: string | null;
  entrarNoDuelo?: () => void;
  inspecionarRanking?: (nome: string, isBot: boolean) => void;
  playerAtaca?: () => void;
  playerUsaSkill?: (nomeSkill: string) => void;
  [key: string]: unknown;
}

export interface OlympiadBotsApi {
  obterSkillsBot(classeBot: string, nivelBot: number): Array<Record<string, unknown>>;
  obterSkillsDaBarraSnapshot(barra: unknown): Array<Record<string, unknown>> | null;
  gerarBotCompleto(botData: Record<string, unknown>): OlympiadRival;
}

export interface RaidBossDrop {
  id: string;
  chance: number;
  min: number;
  max: number;
  epic?: boolean;
}

export interface RaidBossSkills {
  habilidade_area?: { nome?: string; msg?: string; [key: string]: unknown };
  ataque_basico?: { delay?: number; [key: string]: unknown };
  [key: string]: unknown;
}

export interface RaidBossData {
  id: string;
  nome: string;
  nivel?: number;
  img: string;
  hpMax: number;
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  drops: RaidBossDrop[];
  skills: RaidBossSkills;
  spawn: {
    dias: number[];
    horaInicio: number;
    horaFim: number;
    msgFechado?: string;
  };
  [key: string]: unknown;
}

export type DailyBossId =
  | 'daily_boss_ng'
  | 'daily_boss_d'
  | 'daily_boss_c'
  | 'daily_boss_b'
  | 'daily_boss_a'
  | 'daily_boss_s';

export type DailyBossGradeTier = 'No-Grade' | 'D' | 'C' | 'B' | 'A' | 'S';

/** Entrada do catálogo `catalogoBossesDiarios` (UI + RaidEngine modo diário). */
export interface DailyBossCatalogEntry {
  id?: DailyBossId | string;
  nome: string;
  regiao?: string;
  gradeRef?: string;
  nivel?: number;
  img?: string;
  hpMax?: number;
  pAtk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  drops?: RaidBossDrop[];
  skills?: RaidBossSkills;
  [key: string]: unknown;
}

export type HuntZoneGrade = DailyBossGradeTier;

/** Template de mob em `zonasDeCaca` (spawn/combate na floresta). */
export interface HuntMobTemplate {
  idImg: string;
  nome: string;
  hpMax: number;
  atk: number;
  def: number;
  dropAd: number;
  xp: number;
  chance: number;
  atkSpd: number;
  lvl: number;
}

/** Zona de caça activa (`zonasDeCaca` / `zonaAtual`). */
export interface HuntZoneData {
  id: string;
  nome: string;
  custo: number;
  mobs: HuntMobTemplate[];
}

/** Entrada UI de zona (`catalogoZonas` — detalhe no menu WORLD). */
export interface ZoneCatalogEntry {
  nome: string;
  descricao: string;
  nivelSugerido: string;
  custo: number;
  img: string;
  monstros: string[];
  recompensas: string[];
  cor: string;
}

/** Status base por raça no create (`statusIniciais`). */
export interface RaceInitialStats {
  hpFighter: number;
  mpFighter: number;
  hpMage: number;
  mpMage: number;
  danoFighter: number;
  danoMage: number;
  atkSpeedFighter: number;
  atkSpeedMage: number;
  critico: number;
}

export type GameSoundKey =
  | 'ataque'
  | 'enchant'
  | 'lvlup'
  | 'adenas'
  | 'potion'
  | 'enchant_success';

export type CraftRecipeCatalog = Record<string, CraftRecipe[]>;

export type DailyMissionId =
  | 'hunt_pack'
  | 'champion_hunter'
  | 'zone_ranger'
  | 'forest_runner'
  | 'deep_delver'
  | 'forge_minter'
  | 'adena_farmer'
  | 'coin_collector'
  | 'enchant_seeker'
  | 'craft_hand'
  | 'arena_blood'
  | 'olympiad_grinder'
  | 'daily_boss_slayer'
  | 'battle_alchemist'
  | 'skill_sparks'
  | 'bag_extractor';

export type DailyMissionGroup = 'farm' | 'economy' | 'challenge';

export type DailyMissionEventType =
  | 'matar_monstros'
  | 'matar_champions'
  | 'tentar_mint'
  | 'ganhar_adena'
  | 'coletar_coins'
  | 'vencer_olympiad'
  | 'matar_olympiad'
  | 'derrotar_daily_boss'
  | 'usar_pocoes'
  | 'usar_skills'
  | 'tentar_enchant'
  | 'craft_item'
  | 'expedition_journey'
  | 'expedition_complete';

export type DailyMissionRewardPackage = 'base' | 'farm' | 'champion' | 'arena' | 'pocao';

export interface DailyMissionReward {
  adenas?: number;
  ancientCoins?: number;
  itens?: Record<string, number>;
}

export interface DailyMissionTemplate {
  id: DailyMissionId;
  titulo: string;
  desc: string;
  tipo: DailyMissionEventType;
  alvo: number;
  recompensa: DailyMissionReward;
  icone: string;
  grupo?: DailyMissionGroup;
}

export interface DailyMissionInstance extends DailyMissionTemplate {
  progresso: number;
  concluida: boolean;
  reivindicada: boolean;
  /** True after this slot used its one allowed skip/reroll. */
  skippedOnce?: boolean;
  grupo?: DailyMissionGroup;
}

export interface DailyMissionRotationRecord {
  em: string;
  gradeAnterior: string;
  gradeNova: string;
  missoes: DailyMissionInstance[];
}

export interface DailyMissionsSaveData {
  data: string;
  gradeRef: DailyBossGradeTier | string;
  bonusReivindicado: boolean;
  missoes: DailyMissionInstance[];
  historicoEncerrado: DailyMissionRotationRecord[];
}

export interface WeeklyMissionsSaveData {
  weekKey: string;
  gradeRef: DailyBossGradeTier | string;
  bonusReivindicado: boolean;
  missoes: DailyMissionInstance[];
  historicoEncerrado: DailyMissionRotationRecord[];
}

export type MissionsHubTab = 'daily' | 'weekly';

export interface RaidParticipant {
  nome: string;
  hp: number;
  hpMax: number;
  pAtk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  atkSpd?: number;
  classe?: string;
  skills?: Array<Record<string, unknown>>;
  isBot?: boolean;
  isPlayer?: boolean;
  ultimoUpdate: number;
  morto?: boolean;
  dps: number;
  remover?: boolean;
}

export interface RaidGlobalState {
  id?: string;
  bossHp: number;
  bossMaxHp?: number;
  participants: RaidParticipant[];
  logs: string[];
  lastTick: number;
  bossStatus: 'alive' | 'dead';
}

export interface RaidLobbyState {
  inscrito: boolean;
  playersCount: number;
  maxPlayers: number;
  loopInscricoes: ReturnType<typeof setInterval> | null;
}

export interface RaidEngineApi {
  ativo: boolean;
  modoDiario: boolean;
  master: boolean;
  raidId: string | null;
  bossData: RaidBossData | null;
  bossHpAtual: number;
  ultimoAtaquePlayer: number;
  state: RaidGlobalState;
  lobbyState: RaidLobbyState;
  STORAGE_KEY: string;
  resolverBossDoCatalogo: (bossId: string) => RaidBossData | null;
  iniciar: (bossId: string, opcoesExtra?: Record<string, unknown>) => void;
  prepararArena: () => void;
  criarNovaRaid: () => void;
  gerarBotsIniciais: () => void;
  entrarNaRaid: () => void;
  iniciarLoops: () => void;
  processarTickServidor: () => void;
  bossAtacaArea: () => void;
  bossAtaca: (alvo: RaidParticipant) => void;
  aplicarDanoNoAlvo: (alvo: RaidParticipant, danoBruto: number, tipo: string) => void;
  syncEstadoPlayer: () => void;
  playerAtaca: () => void;
  receberDanoBoss: (dano: number, doPlayer?: boolean) => void;
  mostrarDanoVisual: (dano: number, critico?: boolean, autor?: string | null) => void;
  carregarEstadoGlobal: () => void;
  salvarEstadoGlobal: () => void;
  atualizarUI: () => void;
  atualizarBarraCooldownBoss: () => void;
  escreverLogRaid: (texto: string) => void;
  entregarRecompensasNaBolsa: (dropsGanhos: Array<{ id: string; qtd: number; epic?: boolean }>) => void;
  vitoriaRaid: () => void;
  derrotaRaid: () => Promise<void>;
  fugir: () => void;
  limparRaid: () => void;
  abrirLobby: (bossId?: string) => void;
  fecharLobby: () => void;
  inscrever: () => void;
  atualizarUILobby: () => void;
  prepararEntrada: () => void;
  entrar: () => void;
  loopSync?: ReturnType<typeof setInterval>;
  loopServer?: ReturnType<typeof setInterval>;
  _vitoriaProcessada?: boolean;
  [key: string]: unknown;
}

export interface OlympiadClaimRpcResult {
  success?: boolean;
  claimed_list?: string[];
  message?: string;
}

export interface OlympiadHistoryRow {
  nome?: string;
  olympiadPoints?: number;
  vitorias?: number;
  derrotas?: number;
  isBot?: boolean;
  tipo?: string;
  vitoria?: boolean;
  oponente?: string;
  pontos?: number;
  data?: string;
  [key: string]: unknown;
}

/** Rival ativo na arena (bot ou snapshot de jogador). */
export interface OlympiadRival {
  nome: string;
  isBot?: boolean;
  isMage?: boolean;
  isRealPlayerSnapshot?: boolean;
  raca?: string;
  visual?: { isFem?: boolean };
  nivel?: number;
  maxHp?: number;
  hp?: number;
  maxCp?: number;
  cp?: number;
  pAtk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  atkSpd?: number;
  olyEffects?: Array<{ until: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** Supabase client exposto via CDN — tipagem mínima (detalhe na Fase 2+). */
export interface SupabaseAuthUser {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
}

export interface SupabaseQueryResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

export interface SupabaseQueryBuilder {
  select: (cols: string) => SupabaseQueryBuilder;
  ilike: (col: string, val: string) => SupabaseQueryBuilder;
  eq: (col: string, val: string | number) => SupabaseQueryBuilder;
  order: (col: string, opts?: { ascending?: boolean }) => SupabaseQueryBuilder;
  limit: (n: number) => SupabaseQueryBuilder;
  maybeSingle: () => Promise<SupabaseQueryResult>;
  single: () => Promise<SupabaseQueryResult>;
  delete: () => SupabaseQueryBuilder;
  update: (patch: Record<string, unknown>) => SupabaseQueryBuilder;
  upsert: (
    row: Record<string, unknown>,
    opts?: { onConflict?: string },
  ) => Promise<SupabaseQueryResult>;
  insert: (rows: Record<string, unknown> | Array<Record<string, unknown>>) => SupabaseQueryBuilder;
}

export interface SupabasePresenceChannelLite {
  topic?: string;
  state?: string;
  presenceState: () => Record<string, unknown>;
  send: (payload: Record<string, unknown>) => Promise<string>;
}

export interface CloudCharacterAdminRow {
  char_name: string;
  user_id?: string;
  char_class?: string;
  level?: number;
  data?: Record<string, unknown>;
  updated_at?: string;
  [key: string]: unknown;
}

export interface GmSetLevelRpcResult {
  ok?: boolean;
  char_name?: string;
  error?: string;
  [key: string]: unknown;
}

export type GmPanelTab = 'players' | 'resources' | 'broadcast' | 'server';

export interface GmEngineApi {
  accessLevel: number;
  activeTab: GmPanelTab;
  init: () => Promise<void>;
  canShowGmControls: () => boolean;
  hideGmUi: () => void;
  syncGmUi: () => Promise<void>;
  teardown: () => void;
  gmT: (key: string, params?: Record<string, string | number>) => string;
  escapeHtml: (s: unknown) => string;
  encodeGmAttr: (s: unknown) => string;
  decodeGmAttr: (s: unknown) => string;
  refreshGmAccessFromProfile: () => Promise<number>;
  renderGMButton: () => void;
  openPanel: () => Promise<void>;
  switchTab: (tab: GmPanelTab, btn: HTMLElement) => void;
  loadTabContent: () => Promise<void>;
  renderResourcesTab: (container: HTMLElement) => void;
  giveCurrency: (type: 'adena' | 'ancient') => Promise<void>;
  giveItem: () => Promise<void>;
  renderPlayersTab: (container: HTMLElement) => Promise<void>;
  renderBroadcastTab: (container: HTMLElement) => void;
  renderServerTab: (container: HTMLElement) => void;
  checkIfOnline: (charName: string) => boolean;
  sendBroadcast: () => Promise<void>;
  kickPlayer: (charName: string) => Promise<void>;
  editPlayer: (charName: string) => Promise<void>;
  banPlayer: (charName: string) => Promise<void>;
  [key: string]: unknown;
}

export interface SupabaseClientLite {
  auth: {
    signInWithPassword: (creds: { email: string; password: string }) => Promise<{
      data: { user?: SupabaseAuthUser; session?: unknown } | null;
      error: { message: string } | null;
    }>;
    signUp: (opts: {
      email: string;
      password: string;
      options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
    }) => Promise<{ data: { user?: SupabaseAuthUser; session?: unknown } | null; error: { message: string } | null }>;
    resetPasswordForEmail: (
      email: string,
      opts?: { redirectTo?: string },
    ) => Promise<{ error: { message: string } | null }>;
    updateUser: (attrs: { password: string }) => Promise<{ error: { message: string } | null }>;
    signOut: () => Promise<unknown>;
    getUser: () => Promise<{ data: { user: SupabaseAuthUser | null } }>;
    onAuthStateChange: (cb: (event: string, session: unknown) => void) => { data: { subscription: unknown } };
  };
  from: (table: string) => SupabaseQueryBuilder;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

export interface MailSendResult {
  success: boolean;
  error?: string | { message?: string };
}

export interface MailClaimResult {
  success: boolean;
  error?: string;
  reward_adena?: number;
  reward_ancient?: number;
}

export interface CloudMailboxRow {
  id: string;
  sender_name: string;
  subject: string;
  type: string;
  details: unknown;
  is_read: boolean;
  is_claimed?: boolean;
  created_at: string;
}

export interface CloudCastleRow {
  id: string;
  name: string;
  owner_clan_id: number | string | null;
  treasury: string | number;
  last_siege_at?: string | null;
  tax_rate?: number;
}

export interface CastleTreasuryWithdrawResult {
  success: boolean;
  amount_withdrawn?: number;
  error?: string;
}

export interface CastleDbEntry {
  id: string;
  nome: string;
  descricao?: string;
  img?: string;
  minLevel: number;
  taxRate: number;
  baseIncome: number;
}

export interface CastleRuntimeEntry extends CastleDbEntry {
  ownerClanId: number | string | null;
  lastSiege: number | null;
  treasury: number;
  lastTaxUpdate?: number;
}

export interface CastleSiegeContext {
  casteloId: string;
  isAtacante: boolean;
  castleName: string;
}

export interface CastleEngineApi {
  castelos: CastleRuntimeEntry[];
  saveKey: string;
  cicloTreasury: number;
  init(): void;
  carregar(): Promise<void>;
  salvar(): void;
  coletarTesouro(casteloId: string): Promise<void>;
  renderizarNoLobby(target: HTMLElement | null): void;
  selecionarParaSiege(castleId: string): void;
  getCastleBuffs(): {
    pAtkMult: number;
    pDefMult: number;
    mAtkMult: number;
    mDefMult: number;
    count?: number;
  } | null;
}

export interface ClanRecord {
  id: number | string;
  nome: string;
  sigla?: string;
  logo?: string;
  lider?: string;
  level?: number;
  nivelMin?: number;
  descricao?: string;
  membros: string[];
  [key: string]: unknown;
}

export interface ClanApplicationRecord {
  id?: string | number;
  nome: string;
  clanId: number | string;
  timestamp?: number;
  clans?: unknown;
}

export interface ClanMemberDisplayInfo {
  nivel: number | string;
  classe: string;
}

export type ClanUiTab = 'ranking' | 'meu';

export type ClanSecurityAction = 'sair' | 'expulsar' | 'dissolver';

export interface ClanRpcResult {
  success?: boolean;
  error?: string;
  message?: string;
  level?: number;
}

export interface CloudClanRow {
  id: number | string;
  name: string;
  tag?: string;
  logo?: string;
  leader_name?: string;
  min_level?: number;
  level?: number;
  description?: string | null;
  membros?: string[];
}

export interface CloudClanApplicationRow {
  id: string | number;
  char_name: string;
  clan_id: number | string;
  created_at?: string;
  clans?: unknown;
}

export interface ClanWarEngineApi {
  ativo: boolean;
  emLobby: boolean;
  autoAtaqueAtivo?: boolean;
  contextoSiege?: CastleSiegeContext | null;
  clanInimigoForcado?: ClanRecord | null;
  init(): void;
  abrirLobby(): void;
  abrirSelecaoMembro(index: number): void;
  selecionarMembro(index: number, nome: string): void;
  salvarInscricao(): void;
  comecarDuelo(): void;
  proximoDuelo(): void;
  sairDaGuerra(): void;
  prepararGuerra?(): void;
  usarSkillPlayer?: (nomeSkill: string) => void;
}

export type L2ConfirmFn = {
  (
    mensagem: string,
    titulo?: string,
    opts?: { confirmLabel?: string; cancelLabel?: string },
  ): Promise<boolean>;
  (
    mensagem: string,
    callback: (confirmado: boolean) => void,
    opts?: { title?: string; hideCancel?: boolean; confirmLabel?: string; cancelLabel?: string },
  ): void;
};

export interface GlobalChatEngineLite {
  started: boolean;
  isCloudSession: () => boolean;
  paintLocalCacheIfNeeded: (force?: boolean) => void;
  repaintI18n: () => void;
  start: (force?: boolean) => Promise<void>;
  reconnect: () => Promise<void>;
  reset: () => void;
  refresh: (soft?: boolean) => Promise<void>;
  send: (charName: string, body: string, tier: string, ascTitle: string) => Promise<void>;
  ingest: (row: GlobalChatRow) => boolean;
  ingestBroadcast: (payload: {
    autor: string;
    mensagem: string;
    tipo?: string;
    ascensionTitle?: string;
    cloudMsgId?: string;
    createdAt?: string;
  }) => boolean;
}

export interface SupabaseApi {
  init: () => Promise<void>;
  client: SupabaseClientLite | null;
  currentUser: unknown;
  session: unknown;
  getUser: () => unknown;
  getAuthRedirectUrl: () => string;
  resolveLoginEmail: (usernameOrEmail: string) => Promise<string>;
  updatePresence: (charName: string, meta: Record<string, unknown>) => void;
  ensureChatConnected?: (charName: string, meta: Record<string, unknown>) => void | Promise<void>;
  savePlayer?: (charName: string, data: CharacterSave, opts?: { force?: boolean }) => Promise<unknown>;
  getGlobalRanking?: () => Promise<CloudRankingPlayer[] | null>;
  upsertCombatStatSnapshot?: (
    payload: CombatStatSnapshotPayload,
  ) => Promise<{ success?: boolean; error?: string } | null>;
  getCombatStatRanking?: (
    metric: CombatStatMetric,
    limit?: number,
  ) => Promise<CombatStatRankingResult | null>;
  fetchMailbox: (charName: string) => Promise<CloudMailboxRow[]>;
  sendMail: (
    recipient: string,
    subject: string,
    type: string,
    details: Record<string, unknown>,
  ) => Promise<MailSendResult>;
  claimMailReward: (mailId: string) => Promise<MailClaimResult>;
  updateMailStatus: (mailId: string | number, updates: Record<string, unknown>) => Promise<void>;
  deleteMail: (mailId: string | number) => Promise<void>;
  fetchCastles?: () => Promise<CloudCastleRow[]>;
  withdrawCastleTreasury?: (
    charName: string,
    castleId: string,
  ) => Promise<CastleTreasuryWithdrawResult>;
  createOlympiadMatch?: (attackerName: string, defenderName: string) => Promise<{
    success?: boolean;
    match_id?: string;
    error?: string;
  }>;
  fetchOlympiadHistory?: (charName: string) => Promise<Array<Record<string, unknown>>>;
  claimWeeklyAscension?: (
    charName: string,
    weekKey: string,
  ) => Promise<EndgameRpcEnvelope<EndgameClaimRpcResult>>;
  recordEliteChampionKill?: (weekKey: string) => Promise<EndgameRpcEnvelope<EndgameKillRpcResult>>;
  recordEliteChampionKillWithRetry?: (
    weekKey: string,
  ) => Promise<EndgameRpcEnvelope<EndgameKillRpcResult>>;
  broadcastGM?: (action: string, target: string, data?: Record<string, unknown>) => Promise<boolean> | void;
  broadcastChat?: (
    autor: string,
    mensagem: string,
    tipo: string,
    canal: string,
    ascensionTitle?: string,
    opts?: {
      i18nKey?: string;
      i18nParams?: Record<string, string | number>;
      cloudMsgId?: string | number;
      createdAt?: string;
    },
  ) => Promise<boolean>;
  presenceChannel?: SupabasePresenceChannelLite | null;
  fetchClanChatHistory?: (clanId: string | number, limit?: number) => Promise<ClanChatRow[]>;
  subscribeClanChat?: (clanId: string | number, onInsert: (row: ClanChatRow) => void) => void;
  unsubscribeClanChat?: () => void;
  insertClanChatMessage?: (
    clanId: string | number,
    body: string,
    tier: string,
    ascensionTitle: string,
  ) => Promise<{ data: unknown; error: unknown }>;
  fetchGlobalChatHistory?: (limit?: number, days?: number) => Promise<GlobalChatRow[]>;
  fetchGlobalChatHistoryRpc?: (limit?: number, days?: number) => Promise<GlobalChatRow[]>;
  subscribeGlobalChat?: (onInsert: (row: GlobalChatRow) => void) => void;
  unsubscribeGlobalChat?: () => void;
  insertGlobalChatMessage?: (
    charName: string,
    body: string,
    tier: string,
    ascensionTitle: string,
  ) => Promise<{ data: unknown; error: unknown }>;
  insertGlobalChatSystemMessage?: (
    body: string,
    tier?: string,
    i18nKey?: string,
    i18nParams?: Record<string, string | number>,
  ) => Promise<{ data: unknown; error: unknown }>;
  parseGlobalChatRpcResult?: (r: { data?: unknown; error?: unknown } | null | undefined) => {
    ok: boolean;
    id?: string;
    errorCode?: string;
    transportError?: boolean;
  };
  ensureGlobalChatReady?: () => Promise<void>;
  _globalChatOnInsert?: ((row: GlobalChatRow) => void) | null;
  _globalChatPgReady?: boolean;
  _globalChatSubscribed?: boolean;
  fetchClans?: () => Promise<CloudClanRow[]>;
  fetchClanApplications?: (charName: string) => Promise<CloudClanApplicationRow[]>;
  fetchClanPendingApplicationsForClan?: (clanId: string | number) => Promise<CloudClanApplicationRow[]>;
  createClan?: (
    charName: string,
    nome: string,
    sigla: string,
    logo: string,
    minLevel: number,
  ) => Promise<ClanRpcResult>;
  applyToClan?: (charName: string, clanId: string | number) => Promise<ClanRpcResult>;
  respondClanApplication?: (
    charName: string,
    applicationId: string | number,
    accept: boolean,
  ) => Promise<ClanRpcResult>;
  leaveClan?: (charName: string, clanId: string | number | null) => Promise<ClanRpcResult>;
  updateClanSettings?: (
    clanId: string | number | null,
    patch: Record<string, unknown>,
  ) => Promise<ClanRpcResult>;
  upgradeClanLevel?: (clanId: string | number | null) => Promise<ClanRpcResult>;
  dissolveClan?: (clanId: string | number | null) => Promise<ClanRpcResult>;
  npcShopBuyStackable?: (
    charName: string,
    itemCatalogId: string,
    qty: number,
  ) => Promise<{ data: NpcShopBuyStackableResult | string | null; error: unknown }>;
  craftItem?: (
    charName: string,
    recipeId: string,
    choiceIdBase: string | null,
  ) => Promise<{ data: import('./game').CraftItemRpcResult | null; error: unknown }>;
  enchantItem?: (
    charName: string,
    itemUid: string,
    scrollDisplayName: string,
  ) => Promise<{ data: import('./game').EnchantItemRpcResult | null; error: unknown }>;
  augmentItem?: (
    charName: string,
    itemUid: string,
    stoneName: string,
  ) => Promise<{ data: import('./game').AugmentItemRpcResult | null; error: unknown }>;
  [key: string]: unknown;
}

/** Jogador devolvido por `SupabaseAPI.getGlobalRanking` / cache cloud. */
export interface CloudRankingPlayer {
  nome: string;
  charClass?: string;
  classe?: string;
  nivel?: number;
  olympiadPoints?: number;
  renown?: number;
  ascensionTitle?: string;
  isRealPlayer?: boolean;
}

/** Metrics for server-sorted combat stat ladder. */
export type CombatStatMetric =
  | 'p_atk'
  | 'm_atk'
  | 'p_def'
  | 'm_def'
  | 'crit_rate'
  | 'max_hp'
  | 'atk_speed'
  | 'level';

export interface CombatStatSnapshotPayload {
  charName: string;
  charClass: string;
  level: number;
  pAtk: number;
  mAtk: number;
  pDef: number;
  mDef: number;
  critRate: number;
  maxHp: number;
  atkSpeed: number;
}

export interface CombatStatRankingRow {
  rank_pos: number;
  char_name: string;
  char_class: string;
  level: number;
  metric_value: number;
  updated_at?: string;
}

export interface CombatStatRankingResult {
  success: boolean;
  metric?: CombatStatMetric | string;
  rows?: CombatStatRankingRow[];
  error?: string;
}

/** Entrada do ranking mundial (bots + nuvem + jogador local). */
export interface MergedRankingEntry {
  nome: string;
  classe: string;
  nivel: number;
  olympiadPoints: number;
  isBot: boolean;
  isRealPlayer?: boolean;
  isLocalPlayer?: boolean;
  renown?: number;
  ascensionTitle?: string;
}

export interface RankingManagerApi {
  realPlayers: CloudRankingPlayer[];
  lastFetch: number;
  CACHE_DURATION: number;
  getMergedRanking(): Promise<MergedRankingEntry[]>;
}

export interface BotRankingSeed {
  nome?: string;
  farmBot1?: string;
  classe?: string;
  nivel?: number;
  olympiadPoints?: number;
  vitorias?: number;
  derrotas?: number;
  raca?: string;
  [key: string]: unknown;
}

export interface MultiplayerVisualsApi {
  containerId: string;
  init(): void;
  createContainer(): void;
  renderPlayers(presenceState: PresenceState | null | undefined): void;
  createPlayerCard(player: OnlinePlayerCardInput): HTMLDivElement;
}

/** Payload Supabase Realtime presence (`presenceState()`). */
export type PresenceState = Record<string, unknown>;

export interface OnlinePlayerCardInput {
  charName: string;
  charClass: string;
  race?: string;
  gender?: string;
  level?: number;
}

export interface MarketListingDisplayItem {
  nome?: string;
  img?: string;
  icone?: string;
  grade?: string;
  tipo?: string;
  tipoItem?: string;
  preco?: number;
}

export type MarketUiTab = 'buy' | 'sell' | 'history';
export type MarketSortOrder = 'newest' | 'price_low' | 'price_high';
export type MarketHistoryFilter = 'global' | 'personal';

export interface MarketUiListingEntry {
  id: string | number;
  vendedor: string;
  isBot?: boolean;
  item: MarketListingDisplayItem;
  fullItem?: unknown;
  enchant: number;
  preco: number;
  moeda: string;
  categoria: string;
  qtd: number;
  _cloud?: true;
  _createdAt?: string;
}

export interface MarketHistoryEntry {
  vendedor: string;
  comprador: string;
  item: MarketListingDisplayItem;
  enchant: number;
  preco: number;
  moeda: string;
  qtd: number;
  data: number;
}

export interface MarketSaleSelection {
  item: EquipInstance | Record<string, unknown>;
  categoria: 'equips' | 'mats';
  ref: number | string;
}

export interface MarketPayoutRow {
  net?: number;
  currency?: string;
  item_snapshot?: MarketListingDisplayItem;
  tax?: number;
  gross?: number;
  buyer_char_name?: string;
}

export interface MarketListingRow {
  id: string;
  sold?: boolean;
  status?: string;
  item_data?: unknown;
  item_snapshot?: unknown;
  full_item?: unknown;
  fullItem?: unknown;
  enchant?: number;
  qtd?: number;
  currency?: string;
  price?: number;
  seller_char_name?: string;
  seller_name?: string;
  categoria?: string;
  category?: string;
  item_name?: string;
  created_at?: string;
}

export interface MarketListingEntry {
  id: string;
  vendedor: string;
  isBot: boolean;
  item: MarketListingDisplayItem;
  fullItem: unknown;
  enchant: number;
  preco: number;
  moeda: 'coin' | 'adena';
  categoria: string;
  qtd: number;
  _cloud: true;
  _createdAt?: string;
}

export interface MarketPublishPayload {
  seller_char_name: string;
  price: number;
  currency?: string;
  categoria?: string;
  qtd?: number;
  enchant?: number;
  item_snapshot?: Record<string, unknown>;
  full_item?: unknown;
}

export interface MarketRpcPayload {
  ok?: boolean;
  success?: boolean;
  error?: string;
  message?: string;
  listing?: MarketListingRow;
  listing_fee_adena?: number;
  seller_adenas?: number;
  seller_ancient_coins?: number;
  buyer_adenas?: number;
  buyer_ancient_coins?: number;
  payouts?: unknown;
  required?: number;
}

export type MarketOperationResult =
  | {
      ok: true;
      entry: MarketListingEntry;
      listingFeeAdena?: number;
      balances?: { adenas: number; ancientCoins: number };
    }
  | {
      ok: true;
      entry: MarketListingEntry;
      balances: { adenas: number; ancientCoins: number };
    }
  | { ok: true; payouts: unknown[] }
  | { ok: true; cancelled?: true }
  | { ok: false; error: string; message?: string; details?: MarketRpcPayload };

export interface MarketCloudApi {
  LISTING_FEE_ADENA: number;
  isAvailable(): boolean;
  displayItemFromRow(row: MarketListingRow | null | undefined): MarketListingDisplayItem;
  isListingActiveRow(row: MarketListingRow | null | undefined): boolean;
  mapRowToEntry(row: MarketListingRow | null | undefined): MarketListingEntry | null;
  fetchListings(): Promise<MarketListingEntry[]>;
  fetchListingsWithMeta(): Promise<{ listings: MarketListingEntry[]; error?: string }>;
  publishListing(payload: MarketPublishPayload): Promise<MarketOperationResult>;
  cancelListing(listingId: string, sellerCharName: string): Promise<MarketOperationResult>;
  completePurchase(listingId: string, buyerCharName: string): Promise<MarketOperationResult>;
  claimPendingPayouts(sellerCharName: string): Promise<MarketOperationResult>;
  subscribeListings(onRefresh: () => void): void;
  unsubscribeListings(): void;
}

export interface MailboxMessage {
  id: string | number;
  remetente: string;
  assunto: string;
  tipo: string;
  detalhes: Record<string, unknown>;
  lido?: boolean;
  timestamp: number;
  is_claimed?: boolean;
}

export interface MailboxData {
  inbox: MailboxMessage[];
  history: MailboxMessage[];
}

export interface MailboxEngineApi {
  syncFromCloud(cloudMessages: MailboxMessage[]): boolean;
}

export type EnviarMailFn = ((
  destinatario: string,
  remetente: string,
  assunto: string,
  tipo: string,
  detalhes?: Record<string, unknown>,
) => Promise<boolean>) & { lastError?: string };

export interface SeasonRewardItem {
  id: string;
  qtd: number;
  nome?: string;
}

export interface SeasonRewardBundle {
  adena: number;
  coins: number;
  items: SeasonRewardItem[];
}

export interface LastSeasonData {
  seasonKey: string;
  rankReached: string;
  tierReached: string;
  claimed: boolean;
}

export interface OlympiadRankInfo {
  nomeCompleto: string;
  tier: string;
  divisao?: number;
  req?: number;
  porcentagem?: number;
  progressoAtual?: number;
  maxDivisao?: number | string;
  nextTier?: string;
  [key: string]: unknown;
}

export interface RankingSeasonsApi {
  initialized?: boolean;
  SEASON_REWARDS: Record<string, SeasonRewardBundle>;
  init(): void;
  getTimeLeft(): { days: number; hours: number };
  checkSeason(): void;
  finalizeSeason(lastSeasonKey: string): void;
  claimSeasonReward(): Promise<void>;
  findItemData(itemId: string): ItemCatalogBase | null;
}

export interface NormalizedRewardItem {
  id: string;
  nome: string | null;
  qtd: number;
  tipo?: string;
  epic?: boolean;
}

export interface RewardRow {
  id: string;
  char_name?: string;
  items?: unknown;
  claimed?: boolean;
  created_at?: string;
  sender?: string;
  message?: string;
}

export interface RewardEngineApi {
  rewards: RewardRow[];
  claiming: boolean;
  lastPendingCount: number;
  escapeHtml(text: unknown): string;
  normalizeRewardItems(items: unknown): NormalizedRewardItem[];
  resolveCatalogEntry(rawKey: unknown): ItemCatalogBase | null;
  renderRewardChipHtml(item: NormalizedRewardItem): string;
  init(): Promise<void>;
  checkRewards(): Promise<void>;
  updateBadge(): void;
  createHUDBtn(): void;
  open(): void;
  hideHub(): void;
  teardown(): void;
  render(): void;
  renderItems(items: NormalizedRewardItem[]): string;
  claim(id: string): Promise<void>;
  isEquipment(itemKey: string): boolean;
  addEquip(itemKey: string): void;
}
