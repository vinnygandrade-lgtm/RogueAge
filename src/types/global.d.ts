/**
 * Contrato global do runtime (script tags + window.*).
 * Expandir incrementalmente ao migrar cada módulo JS → TS.
 */
import type {
  AuthEngineApi,
  BuffsAtivos,
  CarregarJogoOptions,
  CharacterSave,
  EconomyBalanceApi,
  EndgameData,
  RaidEngineApi,
  GmEngineApi,
  EndgamePursuitsApi,
  EquipInstance,
  GradeEquipKey,
  GradeEquipValidation,
  GradeUiInfo,
  I18nApi,
  PaperdollConfig,
  PaperdollPresetId,
  InventarioStack,
  InventarioRecentEntry,
  InventoryManagerApi,
  InventarioRecentApi,
  InventoryStackKeysApi,
  InventarioBagFilter,
  ItemSecurityApi,
  HotbarSlot,
  PlayerStats,
  PlayerStatBreakdown,
  SalvarJogoOptions,
  StatPerLevel,
  SupabaseApi,
  SupabaseConfig,
  TutorialProgress,
  ZonalMobTuneEntry,
  CloudRankingPlayer,
  MergedRankingEntry,
  RankingManagerApi,
  MultiplayerVisualsApi,
  PresenceState,
  RankingSeasonsApi,
  RewardEngineApi,
  RetentionEngineApi,
  RetentionSave,
  RetentionHubTab,
  MarketCloudApi,
  MailboxEngineApi,
  EnviarMailFn,
  OlympiadEngineApi,
  CastleEngineApi,
  ClanWarEngineApi,
  CastleDbEntry,
  L2ConfirmFn,
  SeasonRewardBundle,
} from './game';

export {};

declare global {
  interface Window {
    // --- Personagem & economia ---
    charName: string;
    charRace: string;
    charGender: string;
    charClass: string;
    indexSelecao?: number;
    etapaAtual?: string;
    cacadaResumoVitoriaAtivo?: boolean;
    botAtualVisualizado?: ChatInspectProfileData | Record<string, unknown> | null;
    getInspectionCacheEntry?: (nome: string) => import('./game').InspectionCachePreview | null;
    abrirAcaoItemBot?: (tipo: string, index?: number) => void;
    fecharNpc?: () => void;
    fecharNpcSocial?: () => void;
    navegarSelecao?: (direcao: number) => void;
    setGender?: (sexo: string) => void;
    proximaEtapa?: () => Promise<void>;
    voltarEtapa?: () => void;
    atualizarPreview?: () => void;
    resetCriacaoFluxo?: () => void;
    getCharacterPortraitSrc?: (race: string, gender: unknown, charClass?: unknown) => string;
    getCharacterPortraitSrcList?: (race: string, gender: unknown, charClass?: unknown) => string[];
    portraitImgHtml?: (race: string, gender: unknown, charClass?: unknown, style?: string) => string;
    _l2PortraitImgOnError?: (img: HTMLImageElement) => void;
    validarLogin?: () => void;
    verificarLimitePersonagem?: () => boolean;
    abrirDetalhesZona?: (grade: string) => void;
    teleportarParaZona?: (grade: string) => void;
    zoneDisplayName?: (grade: string | null | undefined) => string;
    zoneCanonicalName?: (grade: string) => string;
    refreshHuntZoneHud?: () => void;
    refreshForestMobNames?: () => void;
    mobDisplayName?: (idImg: string | undefined, fallback?: string) => string;
    formatMobCardName?: (mob: { idImg?: string; nome?: string; isChampion?: boolean }) => string;
    itemDropDisplayName?: (itemKey: string) => string;
    consumableDisplayName?: (itemKey: string) => string;
    consumableDescText?: (itemKey: string) => string;
    dailyBossRegionDisplay?: (bossId: string | undefined, fallback?: string) => string;
    hotbarDisplayName?: (slotKey: string) => string;
    skillDisplayName?: (skillKey: string, fallback?: string) => string;
    skillDescText?: (skillKey: string, fallback?: string) => string;
    refreshSpellbookI18n?: () => void;
    bossDisplayName?: (bossId: string | undefined, fallback?: string) => string;
    bossShortName?: (bossId: string | undefined, fallback?: string) => string;
    raidBossLogMsg?: (bossId: string | undefined, logKey: string, params?: Record<string, string | number>) => string;
    raidDropDisplayName?: (dropId: string, catalogNome?: string) => string;
    petDisplayName?: (nomeSkill: string, legacyFallback: string) => string;
    writeSkillLog?: (key: string, params?: Record<string, string | number>, style?: string) => void;
    recolherLootRaid?: () => void;
    abrirPerfilJogadorRanking?: (nome: string, isBot?: boolean) => void;
    renderizarSocial?: () => void;
    abrirOlympiad?: () => void;
    sairOlympiad?: (forcarSaida?: boolean) => void;
    atualizarRelogioSeason?: () => void;
    carregarMailbox?: () => Promise<void>;
    playerData?: {
      raca?: string;
      visual?: { isFem?: boolean; armorId?: string; weaponId?: string };
    };
    mudarAbaSocial?: (aba: string) => void;
    renderizarRankingMundial?: () => Promise<void>;
    renderizarPremiosRanking?: () => void;
    OlympiadBots?: import('./game').OlympiadBotsApi;
    nivel: number;
    adenas: number;
    ancientCoins: number;
    xpAtual: number;
    xpNecessario: number;
    playerHP: number;
    playerMP: number;
    playerCP: number;
    isAugmented: boolean;
    enchant: number;
    enchantArmor: number;

    // --- Inventário & equip ---
    inventario: InventarioStack;
    inventarioEquips: EquipInstance[];
    inventarioRecentLog?: InventarioRecentEntry[];
    inventarioBagFilter?: InventarioBagFilter;
    catalogoScrolls?: Array<{ id?: string; nome: string; preco?: number; moeda?: string; desc?: string; img?: string }>;
    catalogoConsumiveis?: Array<{ id?: string; nome: string; preco?: number; img?: string; desc?: string }>;
    catalogoMateriais?: unknown[];
    catalogoArmas?: import('./game').ItemCatalogBase[];
    catalogoArmaduras?: import('./game').ItemCatalogBase[];
    catalogoJoias?: import('./game').ItemCatalogBase[];
    catalogoReceitas?: Record<string, import('./game').CraftRecipe[]>;
    catalogoBosses?: Record<string, Record<string, unknown>>;
    catalogoBossesDiarios?: Record<string, Record<string, unknown>>;
    dbCastles?: CastleDbEntry[];
    dbBotsRanking?: import('./game').BotRankingSeed[];
    precosVenda?: Record<string, number>;
    armaEquipadaBase: EquipInstance | null;
    armaduraEquipada: EquipInstance | null;
    colarEquipado: EquipInstance | null;
    brincoEquipado1: EquipInstance | null;
    brincoEquipado2: EquipInstance | null;
    anelEquipado1: EquipInstance | null;
    anelEquipado2: EquipInstance | null;

    // --- Stats & combate ---
    playerStats: PlayerStats;
    playerStatBreakdown?: PlayerStatBreakdown;
    monstrosAtivos: unknown[];
    globalCooldownAtivo: number;
    autoAtaqueAtivo: boolean;
    podeAtacar: boolean;
    cooldownsAtivos: Record<string, number>;
    barraAtalhos: HotbarSlot[];

    // --- Meta / endgame ---
    endgameData: EndgameData;
    olympiadPoints: number;
    olympiadWins: number;
    olympiadLosses: number;
    tutorialProgress?: TutorialProgress;
    tempoFimBuffGuerreiro: number;
    tempoFimBuffMistico: number;
    buffsAtivos: BuffsAtivos;
    labelTipoHUD: HTMLElement | null;
    labelValorHUD: HTMLElement | null;

    L2MINI_STAT_PER_LEVEL: StatPerLevel;
    L2MINI_BARE_HAND_WEAPON_ATK: number;
    L2MINI_ITEM_ICON_PX: number;
    L2MINI_TRAINING_SWORD_ATK: number;
    L2MINI_CRIT_RATE_CAP: number;
    L2MINI_ZONAL_MOB_TUNING: Record<string, ZonalMobTuneEntry>;
    L2MINI_STARTER_WEAPON_IDS: { fighter: string; mage: string };
    TRAVAS_GRADE_NIVEL: Record<GradeEquipKey, number>;
    normalizarGradeEquip: (grade: unknown) => GradeEquipKey;
    obterNivelMinimoGradeEquip: (grade: unknown) => number;
    playerClanId?: number | string | null;
    clans?: Array<{ id: number | string; membros?: string[]; lider?: string; level?: number; [key: string]: unknown }>;
    statusIniciais?: Record<string, import('./game').RaceInitialStats>;
    classModifiers?: Record<string, { hp: number; mp: number; atk: number; def: number; spd: number; crit: number }>;
    classEvolutions?: Record<string, Array<{ nome: string; reqLvl: number; desc: string; cor: string }>>;
    bancoDeSkills?: Record<string, import('./game').SkillCatalogEntry>;
    arvoreDeSkills?: Record<string, import('./game').SkillTreeEntry[]>;
    linhagemClasses?: Record<string, string[]>;
    L2MINI_CURRENCY_BAG_KEYS: { adena: string; ancient: string };
    syncMoedasInventarioComCarteira: () => void;
    enrichEquipBaseFromCatalogIfNeeded: (item: unknown) => EquipInstance | unknown;
    formatClassDisplayName: (raw: unknown) => string;
    coerceInspectEquipItem: (item: unknown, tipoPadrao?: string) => EquipInstance | null;
    unwrapCloudCharacterJsonb: (raw: unknown) => CharacterSave;
    pickInspectSaveEquip: (rd: Record<string, unknown> | null | undefined, keys: string[]) => unknown;
    normalizarInventarioEquipsParaInstancias: (arr: unknown[]) => EquipInstance[];
    dispararSincronizacaoCloud?: (force?: boolean) => void;
    MailboxEngine?: MailboxEngineApi;

    // --- Motores (namespace objects) ---
    InventoryManager: InventoryManagerApi;
    InventarioRecent: InventarioRecentApi;
    InventoryStackKeys: InventoryStackKeysApi;
    ItemSecurity: ItemSecurityApi;
    EconomyBalance: EconomyBalanceApi;
    AuthEngine: AuthEngineApi;
    SupabaseAPI: SupabaseApi;
    SUPABASE_CONFIG: SupabaseConfig;
    I18n: I18nApi;
    GMEngine?: import('./game').GmEngineApi;
    RewardEngine?: RewardEngineApi;
    RetentionEngine?: RetentionEngineApi;
    MarketCloud?: MarketCloudApi;
    OlympiadEngine?: OlympiadEngineApi;
    MultiplayerVisuals?: MultiplayerVisualsApi;
    RaidEngine?: RaidEngineApi;
    CombatFeedback?: {
      triggerCombatImpact: (options: {
        rootId: string;
        tone?: 'damage' | 'crit' | 'deal';
        severity?: 'light' | 'medium' | 'heavy';
        shake?: boolean;
      }) => void;
      pulseCombatCard: (cardId: string, tone?: 'damage' | 'heal') => void;
      severityFromDamageRatio: (ratio: number) => 'light' | 'medium' | 'heavy';
    };
    RankingManager?: RankingManagerApi;
    CastleEngine?: CastleEngineApi;
    RankingSeasons?: RankingSeasonsApi;
    ClanWarEngine?: ClanWarEngineApi;
    EndgamePursuits?: import('./game').EndgamePursuitsApi;
    usarPocao: () => void;
    usarPocaoMP: (nomeDaPocao: string) => void;
    escreverLog: (html: string) => void;
    aplicarNotifBadgeVisual?: () => void;
    enviarMail?: EnviarMailFn;
    abrirRewardHubFechandoCorreio?: () => void;
    aplicarHudMissoesBadge?: () => void;
    schedulePaperdollFootShadowSyncWithRetries?: () => void;
    _pdFootShadowVisBound?: boolean;
    renderProfileStatsPreview?: () => void;

    // --- CDN (index.html) ---
    supabase?: { createClient: (...args: unknown[]) => SupabaseApi['client'] };

    // --- Funções expostas no window ---
    t: (key: string, params?: Record<string, string | number>) => string;
    cloudRpcMessage: (code: unknown, options?: { prefix?: string; fallbackKey?: string; keyStyle?: 'error_' | 'dot' }) => string;
    slugRpcErrorCode: (raw: string) => string;
    calcularStatusGlobais: () => void;
    restorePlayerVitalsIfDowned: () => void;
    calcularStatusGlobaisFromData: (
      saveLike: Partial<CharacterSave>,
    ) => Partial<PlayerStats> | null;
    calcularDefesaDoPlayer: (ataqueMagicoDoMonstro: boolean) => number;
    calcularXpNecessario: (lvl: number) => number;
    salvarJogo: (opts?: SalvarJogoOptions) => void;
    carregarJogo: (nome: string, opts?: CarregarJogoOptions) => Promise<boolean>;
    mudarTela: (id: string) => void;
    irPara: (lugar: string) => void;
    abrirSpellbook?: () => void;
    spellbookTipoLabel?: (tipo: string) => string;
    spellbookFormatPowerCell?: (skill: Record<string, unknown> | null | undefined) => string;
    spellbookIconInnerHtml?: (iconeHtml: string, px?: number) => string;
    obterSkillsAprendidas?: () => import('./game').LearnedSkillMeta[];
    /** Spellbook list including locked future skills. */
    obterSkillsSpellbook?: () => import('./game').LearnedSkillMeta[];
    /** Spellbook list grouped: Ready / Upcoming / next specialization paths. */
    obterSkillsSpellbookSections?: () => import('./game').SpellbookSection[];
    /** Log + toast for skills unlocked by leveling from levelBefore → levelAfter. */
    notifySkillsUnlockedAfterLevelChange?: (levelBefore: number, levelAfter: number) => void;
    pushCombatStatSnapshot?: (opts?: { force?: boolean }) => Promise<boolean>;
    fetchCombatStatRanking?: (
      metric: import('./game').CombatStatMetric,
      limit?: number,
      opts?: { force?: boolean },
    ) => Promise<import('./game').CombatStatRankingResult | null>;
    getCombatStatMetrics?: () => import('./game').CombatStatMetric[];
    buildCombatStatSnapshotFromLocal?: () => import('./game').CombatStatSnapshotPayload | null;
    abrirStatRanking?: () => void;
    fecharStatRanking?: () => void;
    markSkillsUnseen?: (skillIds: string[]) => void;
    markSkillUnlockSeen?: (skillId: string) => void;
    hasUnseenSkillUnlock?: (skillId: string) => boolean;
    syncSkillUnlockNotifUi?: () => void;
    countUnseenSkillUnlocks?: () => number;
    getUnseenSkillUnlocksSavePayload?: () => string[];
    applyUnseenSkillUnlocksFromSave?: (raw: unknown) => void;
    clearUnseenSkillUnlocks?: () => void;
    selecionarSkillSpellbook?: (nomeSkill: string) => void;
    mostrarSeletorSlot?: () => void;
    equiparSkillNaBarra?: (indexSlot: number) => void;
    atualizar: () => void;
    iniciarJogo: () => void;
    abrirModal: (id: string, zIndex?: number) => void;
    fecharModal: (id: string) => void;
    fecharTopModal: () => void;
    fecharTodosModaisBackdropStack: () => void;
    isPlayerInGameWorld: () => boolean;
    closeStaffModals: () => void;
    l2Alert: (mensagem: string, tituloOrOnClose?: string | (() => void), maybeOnClose?: () => void) => void;
    l2Confirm: L2ConfirmFn;
    applyCritRateCap: (value: number) => number;
    isClasseMagica: (charClass: string) => boolean;
    createStarterWeaponInstance: (charClass: string) => EquipInstance | null;

    normalizeL2GradeSlug: (grade: unknown) => import('./game').GradeSlug;
    getGradeUi: (grade: unknown) => GradeUiInfo;
    getGradeColor: (grade: unknown) => string;
    getCorGrade: (grade: unknown) => string;
    buildGradeTagHtml: (grade: unknown, label?: unknown) => string;
    applyGradeAccentToElement: (el: Element | null, grade: unknown) => void;
    applyShopGradeChrome: (grade: unknown) => void;
    clearShopGradeChrome: () => void;

    PAPERDOLL_FOOT_SHADOW_STANDARD: 'v1';
    PAPERDOLL_ART: PaperdollConfig['art'];
    PAPERDOLL_CONFIG: PaperdollConfig;
    PAPERDOLL_PRESET_META: Record<
      PaperdollPresetId,
      { race: string; archetype: string; gender: string }
    >;
    PAPERDOLL_PRESET_LEGACY: Partial<Record<PaperdollPresetId, string>>;
    PAPERDOLL_PRESETS_ROOT: string;
    PAPERDOLL_REQUIRE_MASTER_CANVAS: boolean;
    paperdollPresetLegacyId: (presetId: PaperdollPresetId) => string | null;
    resolvePaperdollPresetId: () => PaperdollPresetId;
    resolvePaperdollPresetIdFor: (
      race?: unknown,
      charClass?: unknown,
      gender?: unknown,
    ) => PaperdollPresetId;
    getPaperdollPresetRoot: (presetId?: PaperdollPresetId | string) => string;
    getPaperdollBodySrcList: (presetId?: PaperdollPresetId | string) => string[];
    isPaperdollMasterCanvasSize: (width: number, height: number) => boolean;
    getPaperdollEquipSrcList: (
      presetId: PaperdollPresetId | string | undefined,
      catalogId: string | undefined,
    ) => string[];
    getPaperdollWeaponGripSrcList: (
      presetId: PaperdollPresetId | string | undefined,
      weaponCatalogId: string | undefined,
    ) => string[];
    paperdollPresetHasBareHands: (presetId?: PaperdollPresetId | string) => boolean;
    getPaperdollArmorHandsSrcList: (
      presetId: PaperdollPresetId | string | undefined,
      armorCatalogId: string | undefined,
    ) => string[];
    getPaperdollBareHandsSrcList: (presetId?: PaperdollPresetId | string) => string[];
    getPaperdollHandsSrcList: (
      presetId: PaperdollPresetId | string | undefined,
      armorCatalogId?: string,
    ) => string[];
    presetUsesPaperdollHands: (presetId?: PaperdollPresetId | string) => boolean;
    applyPaperdollScenery: (root: HTMLElement | null) => void;
    applyPaperdollConfig: (
      root: HTMLElement | null,
      overrides?: Partial<PaperdollConfig>,
      context?: { presetId?: PaperdollPresetId | string },
    ) => void;
    applyPaperdollConfigAll: () => void;
    validarEquipPorGrade: (
      item: import('./game').EquipInstance | import('./game').ItemCatalogBase | import('./game').EquipRawInput | null | undefined,
    ) => GradeEquipValidation;
    fecharJanelaAcao?: () => void;
    abrirJanelaBloqueioGrade?: (item: unknown, nivelMinimo: number, grade: string) => void;
    mostrarAviso: (mensagem: string) => void;
    mostrarResultadoCraft?: (nomeItem: string, imgItem: string | undefined, qtd: number) => void;
    abrirInfoEquipEnchantFromGrid?: (el: HTMLElement | null) => void;
    abrirInfoScrollEnchantFromGrid?: (el: HTMLElement | null) => void;
    renderizarPerfil?: () => void;
    renderizarInventario?: () => void;
    _inventarioFiltroDocBound?: boolean;
    catalogJewelIconPath?: (jewelId: string) => string;
    catalogArmorIconPath?: (armorId: string) => string;
    armorMatchesClass?: (armor: import('./game').ItemCatalogBase | null | undefined, isMage: boolean) => boolean;
    formatArmorLineLabel?: (archetype: 'fighter' | 'mage', weight: 'heavy' | 'medium' | 'light', style?: string) => string;
    weaponMatchesClass?: (item: import('./game').ItemCatalogBase | null | undefined, isMage: boolean) => boolean;
    isMageExclusiveWeapon?: (item: import('./game').ItemCatalogBase | null | undefined) => boolean;
    catalogWeaponIconPath?: (weaponId: string) => string;
    toggleModalBackdrop?: (id: string, show: boolean, zIndex?: number) => void;
    nomeEquipDisplay?: (fullItem: EquipInstance | null | undefined) => string;
    buildCombatStatsHeroBlockHtml?: (placement: 'profile' | 'modal') => string;
    renderPainelStatsDetalhado?: () => void;
    PwaInstall?: { isStandalone: () => boolean; refreshUi: () => void };
    LayoutMode?: {
      STORAGE_KEY: string;
      getPreference: () => import('./game').UiLayoutMode;
      getEffective: () => 'portrait' | 'landscape';
      setPreference: (mode: unknown, opts?: { persistSave?: boolean }) => import('./game').UiLayoutMode;
      applyFromSave: (mode: unknown) => void;
      refresh: () => 'portrait' | 'landscape';
      init: () => void;
      syncSettingsButtons: () => void;
      bindSettingsButtons: () => void;
      normalizePreference: (raw: unknown) => import('./game').UiLayoutMode;
    };
    refreshGameSettingsUi?: () => void;
    abrirGameSettings?: () => void;
    abrirNavMenu?: () => void;
    fecharNavMenu?: () => void;
    navMenuGo?: (dest: string) => void;
    refreshNavMenuNotifications?: (partial?: {
        mail?: number;
        rewards?: number;
        retention?: number;
        missions?: number;
        achievements?: number;
        olympiad?: number;
        clanWar?: number;
    }) => void;
    syncNavMenuActiveItem?: () => void;
    pingNavMailNotif?: () => void;
    uiCoachFlags?: { menuTownSeen?: boolean; mailboxTipSeen?: boolean; missionsTipSeen?: boolean };
    maybeShowMenuTownCoach?: () => void;
    dismissNavMenuTownCoach?: () => void;
    maybeShowNavCoachToasts?: (mailUnread: number, missionsPending: number) => void;
    dismissNavCoachToast?: () => void;
    toggleChatCollapse?: () => void;
    setChatCollapsedForCombat?: (inCombat: boolean) => void;
    refreshLogCollapsedPreview?: () => void;
    abrirJanelaCorreio?: () => void;
    abrirMissoesDiarias?: () => void;
    abrirMissoes?: () => void;
    abrirLevelRewards?: () => void;
    abrirRetentionHub?: (tab?: RetentionHubTab) => void;
    fecharRetentionHub?: () => void;
    setRetentionHubTab?: (tab: RetentionHubTab) => void;
    refreshRetentionHud?: () => void;
    syncRetentionHubUi?: () => void;
    contarPendenciasRetention?: () => number;
    applyRetentionFromSave?: (raw: RetentionSave | null | undefined, nivel?: number) => void;
    getRetentionSavePayload?: () => RetentionSave;
    fecharLevelRewards?: () => void;
    reivindicarRecompensaNivel?: (level: number) => boolean;
    reivindicarTodasRecompensasNivel?: () => void;
    onLevelTileClick?: (level: number) => void;
    selecionarNivelAchievement?: (level: number) => void;
    abrirLevelRewardClaimModal?: (level: number) => void;
    fecharLevelRewardClaimModal?: () => void;
    reivindicarRecompensaNivelFromModal?: () => void;
    renderizarLevelRewards?: () => void;
    inicializarLevelRewards?: () => void;
    aplicarHudLevelRewardsBadge?: () => void;
    contarPendenciasLevelRewards?: () => number;
    onLevelRewardReached?: (level: number) => void;
    aplicarLevelRewardsFromSave?: (raw: import('./game').LevelRewardsSave | null | undefined) => void;
    getLevelRewardsSavePayload?: () => import('./game').LevelRewardsSave;
    setAchievementsHubTab?: (tab: 'levels' | 'journey') => void;
    onAbrirAchievementsHub?: () => void;
    refreshAchievementsNavBadge?: () => void;
    registrarProgressoConquista?: (tipo: string, qty?: number) => void;
    reivindicarTierConquista?: (achId: string, titleId: string) => boolean;
    equiparTituloConquista?: (titleId: string | null) => void;
    abrirPlayerTitles?: () => void;
    fecharPlayerTitles?: () => void;
    getEquippedChatTitle?: () => string;
    getEquippedChatTitlePayload?: () => string;
    getEquippedChatTitleColor?: () => string;
    getEquippedTitleId?: () => string | null;
    getTitleStatBonusForId?: (titleId: string | null | undefined) => import('./game').TitleStatBonus;
    refreshGameplayAchievementsI18n?: () => void;
    getGameplayAchievementsSavePayload?: () => import('./game').GameplayAchievementsSave;
    aplicarGameplayAchievementsFromSave?: (raw: import('./game').GameplayAchievementsSave | null | undefined) => void;
    contarPendenciasGameplayAchievements?: () => number;
    pularMissaoDiaria?: (index: number) => void;
    pularMissaoSemanal?: (index: number) => void;
    reivindicarMissaoSemanal?: (index: number) => void;
    reivindicarBonusMissaoSemanal?: () => void;
    setMissoesHubTab?: (tab: 'daily' | 'weekly') => void;
    renderizarMissoesSemanais?: () => void;
    inicializarMissoesSemanais?: () => void;
    abrirMenuSocial?: (menu: string) => void;
    _l2InvIconFrameHtml?: (src: string, imgClass?: string) => string;
    _l2AppendInvGridSlot?: (
      grid: HTMLElement,
      slotClass: string,
      innerHtml: string,
      onClick?: () => void,
      title?: string,
    ) => HTMLElement;
    isPaperdollFistWeaponTipo: (tipo: unknown) => boolean;
    isPaperdollFistWeaponItem: (item: EquipInstance | null | undefined) => boolean;
    syncPaperdollFistWeaponLayerClass: (
      weaponLayerEl: HTMLElement | null,
      weaponItem: EquipInstance | null | undefined,
    ) => void;

    /** Interno: evita reset Olympiad em reload do mesmo char */
    _l2miniLastCarregarChar?: string | null;
    /** true após main.ts concluir boot de scripts */
    __L2MINI_BOOT_READY?: boolean;
    __L2MINI_BOOT_PROGRESS?: number;
    hideLoadingOverlay?: () => void;
    showLoadingOverlay?: (message?: string) => void;

    motorBuffsEspeciais?: { critMult: number; esquiva: number };
    /** Clears session skill combat buffs (atk/def/spd). */
    clearSkillCombatBuffs?: () => void;
    applySkillCombatBuffsToPlayerStats?: () => void;
    motorPet?: ReturnType<typeof setInterval> | null;
    usarSkill?: (nomeSkill: string) => void;
    iniciarAtaqueMonstro?: () => void;
    autoShotAtivo?: boolean;
    toggleAutoShot?: () => void;
    zonaAtual?: import('./game').HuntZoneData;
    tutorialFirstAttackDone?: boolean;
    TutorialEngine?: {
      isRunning?: () => boolean;
      notifyFirstAttack?: () => void;
      afterCharacterLoad?: () => void;
      bootstrapNewCharacter?: () => void;
      onNav?: (lugar: string) => void;
      notifySpellbookOpened?: () => void;
      notifySkillAssignedFromSpellbook?: () => void;
      notifyHuntSearch?: () => void;
      notifyExpeditionNodeConfirmed?: () => void;
      skipTutorial?: () => void;
      render?: () => void;
    };
    ExpeditionEngine?: typeof import('../systems/expedition_engine').ExpeditionEngine;
    handleForestPlayerDefeat?: () => void;
    mostrarDanoVisualMobPoison?: (valor: number) => void;
    setLootTurno?: (loot: unknown) => void;
    mostrarResumoVitoria?: () => void;
    showForestFleeSuccessScreen?: () => void;
    aplicarXpGanhoFloresta?: (quantia: number) => void;
    updateMobBleedPips?: (mob: unknown) => void;
    executarDanoDeUmMonstro?: (mob: unknown) => void;
    showForestDeathScreen?: () => void;
    tryProcessForestMobDeath?: (mob: unknown) => void;
    reconciliarMobsFlorestHpZero?: () => void;
    forceRemoveStuckDeadForestMob?: (monstro: unknown) => void;
    confirmForestFleeReturnToTown?: () => void;
    confirmForestDeathReturnToTown?: () => void;
    procurarMonstros?: () => void;
    tentarFugir?: () => void;
    fecharVitoriaEProcurar?: () => void;
    fecharVitoriaEVoltar?: () => void;
    atualizarIconesBuffPlayer?: (nome: string, duracaoMs: number, iconeHtml: string) => void;
    atualizarIconesDebuffMonstro?: (indexMonstro: number, nome: string, duracaoMs: number, iconeHtml: string) => void;
    refreshMobHpUI?: (monstro: unknown) => void;
    syncAllForestMobHpBars?: () => void;
    getForestTargetMobIndex?: () => number;
    aplicarDanoNoMonstro?: (index: number, dano: number, isCrit?: boolean) => void;
    atacar?: () => void;
    toggleAutoAtaque?: () => void;
    isAutoAtaqueLigado?: () => boolean;
    pararAutoAtaque?: () => void;
    /** Shared skill GCD (ms remaining / helpers) — see src/combat/skill_gcd.ts */
    SKILL_GCD_MS?: number;
    getSkillGcdRemainingMs?: () => number;
    isSkillGcdBlocked?: () => boolean;
    armSkillGcd?: (ms?: number, castSkillName?: string) => void;
    beginSkillCast?: (skillName: string, rechargeMs: number, castMs?: number) => void;
    resetBasicAttackAposSkill?: () => void;
    slotUsesSkillGcd?: (nome: string | null | undefined) => boolean;
    getHotbarSlotLockRemainingMs?: (nome: string) => number;
    getHotbarSlotLockTotalMs?: (nome: string, personalCdTotalMs: number) => number;
    getSkillGcdCastName?: () => string | null;
    getSkillGcdProgressPct?: () => number;

    I18N_LOCALES?: Record<import('./game').UiLocale, Record<string, unknown>>;
  }

  /** Funções globais (script tags — também acessíveis via window). */
  function salvarJogo(opts?: SalvarJogoOptions): void;
  function carregarJogo(nome: string, opts?: CarregarJogoOptions): Promise<boolean>;
  function mudarTela(id: string): void;
  function irPara(lugar: string): void;
  function atualizar(): void;
  function iniciarJogo(): void;
  function escreverLog(html: string): void;
  function iniciarAtaqueMonstro(): void;
  function pararAtaqueMonstro(): void;
  function usarSkill(nomeSkill: string): void;
  function prepararTelaCacada(): void;
  function procurarMonstros(): void;
  function applyForestBattleBackground(show: boolean, grade?: string): void;
  function battleBgUrlForGrade(grade: string, wide?: boolean): string;
  function refreshForestBattleBackgroundForLayout(): void;
  function tentarFugir(): void;
  function fecharVitoriaEProcurar(): void;
  function fecharVitoriaEVoltar(): void;
  function atualizarIconesBuffPlayer(nome: string, duracaoMs: number, iconeHtml: string): void;
  function atualizarIconesDebuffMonstro(indexMonstro: number, nome: string, duracaoMs: number, iconeHtml: string): void;
  function reconciliarMobsFlorestHpZero(): void;
  function forceRemoveStuckDeadForestMob(monstro: unknown): void;
  function confirmForestFleeReturnToTown(): void;
  function confirmForestDeathReturnToTown(): void;
  function renderizarMonstros(): void;
  function renderizarBarraAtalhos(): void;
  function dispararAnimacaoGCD(ms: number, skillName: string): void;
  function tocarSom(nome: import('./game').GameSoundKey): void;
  function renderizarMailbox(): void;

  /** Legado (script tags) — espelham window.* após core_globals */
  var globalCooldownAtivo: number;
  var autoAtaqueAtivo: boolean;
  var podeAtacar: boolean;
  var cooldownsAtivos: Record<string, number>;
  var tempoFimBuffGuerreiro: number;
  var tempoFimBuffMistico: number;
  var catalogoArmas: import('./game').ItemCatalogBase[];
  var catalogoArmaduras: import('./game').ItemCatalogBase[];
  var catalogoJoias: import('./game').ItemCatalogBase[];
  var clans: Array<{ id: number | string; level?: number; membros?: string[]; lider?: string; [key: string]: unknown }>;
  var playerClanId: number | string | null;
  var CastleEngine: CastleEngineApi;
  var ClanWarEngine: ClanWarEngineApi;
  var OlympiadEngine: OlympiadEngineApi;
  var EndgamePursuits: EndgamePursuitsApi;
  var GMEngine: GmEngineApi;
  var RaidEngine: RaidEngineApi;
  function installRaidAttackHook(): void;
  var _raidAttackHookInstalled: boolean;
  function abrirLobbyRaid(id?: string): void;
  function fecharLobbyRaid(): void;
  function inscreverRaid(): void;
  function entrarNaBatalhaRaid(): void;
  var RankingManager: RankingManagerApi;
  var RankingSeasons: RankingSeasonsApi;
  var RewardEngine: RewardEngineApi;
  var RetentionEngine: RetentionEngineApi;
  var MarketCloud: MarketCloudApi;
  var dbBotsRanking: import('./game').BotRankingSeed[];
  var dbCastles: CastleDbEntry[];
  var catalogoZonas: Record<string, import('./game').ZoneCatalogEntry>;
  var zonasDeCaca: Record<string, import('./game').HuntZoneData>;
  var zonaAtual: import('./game').HuntZoneData;
  function getOlympiadRank(pts: number): import('./game').OlympiadRankInfo;
  function abrirPerfilChat(nome: string, source?: string): void;
  function switchLogTab(tab: string): void;
  function enviarMensagemPlayer(): void;
  function adicionarMensagemChat(
    autor: string,
    mensagem: string,
    tipo?: string,
    canal?: string,
    pularPersistencia?: boolean,
    forcedTimestamp?: number | null,
    ascensionTitle?: string,
    historyReplay?: boolean,
  ): void;
  function refreshChatPanelsI18n(): void;
  var GlobalChatEngine: import('./game').GlobalChatEngineLite;
  function buscarRankingGlobalReal(): Promise<CloudRankingPlayer[] | null>;
  function formatarTooltipEquipamento(
    base: unknown,
    enc: number,
    aug: boolean,
    tipo: string,
    itemRaw?: unknown,
    opts?: { omitHeader?: boolean },
  ): string;
  function renderizarClans(aba?: string): void | Promise<void>;
  function abrirCriacaoClan(): void;
  function selecionarLogoClan(el: HTMLElement, icon: string): void;
  function abrirListaClans(): void;
  function abrirDetalhesClan(id: string | number): void;
  function abrirPerfilMembroClan(nome: string, skipCloudInspect?: boolean): void;
  function entrarNoClan(id: string | number): void | Promise<void>;
  function confirmarCriacaoClan(): void | Promise<void>;
  function responderSolicitacao(nome: string, aceito: boolean, applicationId?: string | null): boolean | Promise<boolean>;
  function expulsarMembro(membroNome: string): void | Promise<void>;
  function convidarMembroBot(): void;
  function sairDoClan(): void | Promise<void>;
  function abrirConfiguracoesClan(): void;
  function atualizarNivelMinClan(): void;
  function atualizarLogoClan(el: HTMLElement, icon: string): void;
  function atualizarDescricaoClan(): void;
  function subirNivelClan(): void | Promise<void>;
  function abrirSegurancaClan(acao: string, alvo?: string | null): void;
  function dissolverClan(): void | Promise<void>;
  function mudarAbaMarket(aba: string): void;
  function filtrarMarket(categoria: string): void;
  function filtrarMarketGrade(grade: string): void;
  function filtrarMarketSubtipo(subtipo: string): void;
  function toggleSortMarket(): void;
  function abrirAcaoItemMarket(id: string | number): void;
  function executarCompraMarket(id: string | number): void;
  function cancelarLeilao(id: string | number): void;
  function abrirModalRegistrarMercado(): void;
  function cliqueSlotRegistroMarket(): void;
  function confirmarRegistroMarket(): void;
  function setMarketRegMaxQtd(): void;
  function filtrarHistorico(tipo: string): void;
  function refreshMarketUiI18n(): void;
  function refreshForestMobNames(): void;
  function mobDisplayName(idImg: string | undefined, fallback?: string): string;
  function formatMobCardName(mob: { idImg?: string; nome?: string; isChampion?: boolean }): string;
  function itemDropDisplayName(itemKey: string): string;
  function consumableDisplayName(itemKey: string): string;
  function consumableDescText(itemKey: string): string;
  function dailyBossRegionDisplay(bossId: string | undefined, fallback?: string): string;
  function hotbarDisplayName(slotKey: string): string;
  function skillDisplayName(skillKey: string, fallback?: string): string;
  function skillDescText(skillKey: string, fallback?: string): string;
  function refreshSpellbookI18n(): void;
  function bossDisplayName(bossId: string | undefined, fallback?: string): string;
  function bossShortName(bossId: string | undefined, fallback?: string): string;
  function raidBossLogMsg(bossId: string | undefined, logKey: string, params?: Record<string, string | number>): string;
  function raidDropDisplayName(dropId: string, catalogNome?: string): string;
  function petDisplayName(nomeSkill: string, legacyFallback: string): string;
  function writeSkillLog(key: string, params?: Record<string, string | number>, style?: string): void;
  function zoneDisplayName(grade: string | null | undefined): string;
  function zoneCanonicalName(grade: string): string;
  function fecharJanelaAcao(): void;
  function fecharModalRegistrarMercado(): void;
  function fecharSeletorItemMarket(): void;
  function fecharVenda(): void;
  function fecharLoja(): void;
  function abrirLojaGrocer(categoria: string): void;
  function selecionarConsumivel(id: string, categoria: string, elemento: HTMLElement | null): void;
  function alterarQtdCompra(delta: number): void;
  function setQtdCompraMax(): void;
  function mostrarGradesEquipment(): void;
  function voltarMenuEquipment(): void;
  function abrirMegaLoja(grade: string): void;
  function mudarAbaLoja(tipo: string): void;
  function selecionarItemLoja(id: string, tipo: string, elemento: HTMLElement | null): void;
  function abrirLojaVenda(): void;
  function selecionarItemVenda(nome: string, elemento: HTMLElement | null): void;
  function alterarQtdVenda(delta: number): void;
  function setQtdVendaMax(): void;
  function comprarBuff(tipo: 'fighter' | 'mage' | string): void;
  function fecharEnchant(): void;
  function setEnchantMobileTab(tab: 'gear' | 'scrolls'): void;
  function setAugmentMobileTab(tab: 'weapon' | 'stone'): void;
  function fecharAugment(): void;
  function fecharAugmentAcao(): void;
  function fecharAugmentResultado(): void;
  function fecharJanelaCraft(): void;
  function fecharCraftResultado(): void;
  function fecharLobbyRaid(): void;
  function fecharMenuClasses(): void;
  function abrirMenuClasses(): void;
  function confirmarTrocaClasse(novaClasse: string): void;
  function executarTrocaClasse(novaClasse: string): void;
  function fecharJanelaBloqueioGrade(): void;
  function fecharSpellbook(): void;
  function fecharMissoesDiarias(): void;
  function fecharJanelaDailyBoss(): void;
  function abrirJanelaDailyBoss(): void;
  function confirmarInicioDailyBoss(): void;
  function dailyBossSelecionarAnterior(): void;
  function dailyBossSelecionarProximo(): void;
  function dailyBossJaConsumiuHoje(): boolean;
  function fecharStatusDetalhado(): void;
  function abrirStatusDetalhado(): void;
  function abrirAcaoPerfil(tipo: string): void;
  function abrirAcaoInventario(index: number, slotPerfilPref?: string): void;
  function fecharJanelaAcao(): void;
  function equiparItemSeguro(indexNaBolsa: number): void;
  function abrirGameSettings(): void;
  function refreshGameSettingsUi(): void;
  function abrirJanelaEnchant(): void;
  function abrirInfoEquipEnchantFromGrid(el: HTMLElement | null): void;
  function abrirInfoScrollEnchantFromGrid(el: HTMLElement | null): void;
  function executarEnchant(): void | Promise<void>;
  function abrirJanelaAugment(): void;
  function executarAugment(): void | Promise<void>;
  function abrirAugmentAcao(indexInventario: number | 'equipped'): void;
  function selecionarAugmentStone(): void;
  function iniciarToqueAtalho(index: number): void;
  function soltarToqueAtalho(index: number): void;
  function cancelarToqueAtalho(): void;
  function abrirAcaoItemGeral(
    nome: string,
    opts?: { previewQty?: number; previewOnly?: boolean },
  ): void;
  function abrirPreviewPremioRecompensa(catalogKey: string, previewQty?: number): void;
  function abrirSeletorAtalhoGlobal(nomeItem: string, callback: (index: number) => void): void;
  function fecharSeletorGlobal(): void;
  function fecharGameSettings(): void;
  function fecharSeletorGlobal(): void;
  function abrirModal(id: string, zIndex?: number): void;
  function fecharModal(id: string): void;
  function fecharTopModal(): void;
  function abrirDetalhesZona(grade: string): void;
  function teleportarParaZona(grade: string): void;
  function recolherLootRaid(): void;
  function abrirPerfilJogadorRanking(nome: string, isBot?: boolean): void;
  function renderizarSocial(): void;
  function mudarAbaSocial(aba: string): void;
  function renderizarPremiosRanking(): void;
  function renderizarRankingMundial(): Promise<void>;
  function navegarSelecao(direcao: number): void;
  function proximaEtapa(): Promise<void>;
  function voltarEtapa(): void;
  function atualizarPreview(): void;
  function verificarLimitePersonagem(): boolean;
  function abrirNpc(npcId: string): void;
  function abrirNpc(npcId: string): void;
  function abrirMenuSocial(menu: string): void;
  var charName: string;
  var charClass: string;
  var charRace: string;
  var nivel: number;
  var barraAtalhos: HotbarSlot[];
  var playerHP: number;
  var playerMP: number;
  var playerStats: PlayerStats;
  var inventario: InventarioStack;
  function renderizarInventario(): void;
  function renderizarPerfil(): void;
  function iniciarSistemaClans(): void | Promise<void>;
  function iniciarChatAutomatico(): void;
  function resetChatBootstrap(): void;
  function scrollChatPanelToBottom(panel: HTMLElement, force?: boolean): void;
  function paintHubTabNotif(tabButtonId: string, count: number, cap?: number): void;
  function syncRetentionHubTabNotifs(): void;
  function syncMissoesHubTabNotifs(): void;
  function syncAchievementsHubTabNotifs(): void;
  function showMissionReadyToast(
    source: 'daily' | 'weekly' | 'retention_journey' | 'retention_login' | 'level_reward' | 'gameplay_achievement',
    title: string,
    destination?: 'missions' | 'retention' | 'achievements',
  ): void;
  function registrarProgressoMissaoDiaria(tipo: string, qty?: number): void;
  function registrarProgressoMissao(tipo: string, qty?: number): void;
  function reivindicarMissaoDiaria(index: number): void;
  function reivindicarBonusMissaoDiaria(): void;
  function reivindicarMissaoSemanal(index: number): void;
  function reivindicarBonusMissaoSemanal(): void;
  function pularMissaoDiaria(index: number): void;
  function pularMissaoSemanal(index: number): void;
  function setMissoesHubTab(tab: 'daily' | 'weekly'): void;
  function dispararAnimacaoCooldown(nome: string, tempoMs: number): void;
  function usarPocao(): void;
  function usarPocaoMP(nomeDaPocao: string): void;
  var SupabaseAPI: SupabaseApi;
  var SUPABASE_CONFIG: SupabaseConfig;
  function atualizarVisualPaperdoll(): void;
  function atualizarPaperdollCharSelect(charData: import('./game').PaperdollCharSelectData): void;
  function atualizarBrilhoArma(): void;
  function syncProfileEquipmentSlotGlows(): void;
  function syncPaperdollFootShadow(): void;
  function getEnchantTierGlowColor(lvl: number | string): string;
  function getEnchantPulseSpeedSeconds(lvl: number | string): number;
  function abrirJanelaCraft(categoria?: string): void;
  function fecharJanelaCraft(): void;
  function mudarAbaCraft(categoria: string): void;
  function selecionarReceita(id: string): void;
  function executarCraft(): Promise<void>;
  function fecharCraftResultado(): void;
  function mostrarResultadoCraft(nomeItem: string, imgItem: string | undefined, qtd: number): void;
  function craftOnVesperVariantChange(idBase: string): void;
  function buscarBaseDoEquipamento(idBase: string): import('./game').ItemCatalogBase | null;
  function inicializarMissoesDiarias(): void;
  function inicializarMissoesSemanais(): void;
  function abrirMissoesDiarias(): void;
  function abrirMissoes(): void;
  function renderizarMissoesDiarias(): void;
  function renderizarMissoesSemanais(): void;
  function renderizarMissoesHub(): void;
  function fecharMissoesDiarias(): void;
  function abrirLevelRewards(): void;
  function abrirRetentionHub(tab?: RetentionHubTab): void;
  function fecharRetentionHub(): void;
  function setRetentionHubTab(tab: RetentionHubTab): void;
  function refreshRetentionHud(): void;
  function syncRetentionHubUi(): void;
  function contarPendenciasRetention(): number;
  function applyRetentionFromSave(raw: RetentionSave | null | undefined, nivel?: number): void;
  function getRetentionSavePayload(): RetentionSave;
  function onRetentionNewbieDayClick(day: number): void;
  function onRetentionMonthlyDayClick(day: number): void;
  function claimRetentionJourneyStep(step: number): void;
  function confirmRetentionWeaponPick(): void;
  function selectRetentionWeaponPick(weaponId: string): void;
  function previewRetentionWeaponPick(weaponId: string): void;
  function fecharRetentionWeaponPick(): void;
  function abrirRetentionComeback(): void;
  function claimRetentionComeback(): void;
  function fecharRetentionComeback(): void;
  function retentionGoClanHall(): void;
  function dismissRetentionClanPrompt(): void;
  function setAchievementsHubTab(tab: 'levels' | 'journey'): void;
  function reivindicarTierConquista(achId: string, titleId: string): boolean;
  function equiparTituloConquista(titleId: string | null): void;
  function abrirPlayerTitles(): void;
  function fecharPlayerTitles(): void;
  function fecharLevelRewards(): void;
  function reivindicarRecompensaNivel(level: number): boolean;
  function reivindicarTodasRecompensasNivel(): void;
  function onLevelTileClick(level: number): void;
  function selecionarNivelAchievement(level: number): void;
  function abrirLevelRewardClaimModal(level: number): void;
  function fecharLevelRewardClaimModal(): void;
  function reivindicarRecompensaNivelFromModal(): void;
  function renderizarLevelRewards(): void;
  function inicializarLevelRewards(): void;
  function aplicarHudLevelRewardsBadge(): void;
  function contarPendenciasLevelRewards(): number;
  function onLevelRewardReached(level: number): void;
  function aplicarHudMissoesBadge(): void;
  function atualizarWorldDailyBossUI(): void;
  function iniciarSistemaMercado(): void;
  function atualizarIconeMailbox(): void | Promise<void>;
  function scheduleMailboxBadgeRefresh(): void;
  function verificarPagamentosPendentes(): void;
  var radarDeRacas: Record<string, { classesBase?: string[]; desc?: string }>;
}
