/**
 * Migração TypeScript concluída — todo o runtime do jogo arranca via `src/main.ts`.
 * Este ficheiro mantém-se apenas como referência histórica da ordem de boot legada.
 */

/** @deprecated vazio — `src/data/database.ts` */
export const LEGACY_DATABASE_ONLY = [] as const;

/** @deprecated vazio — catálogos em `src/db/` */
export const LEGACY_AFTER_ITEM_SECURITY = [] as const;

/** @deprecated vazio — world data em `src/db/` */
export const LEGACY_AFTER_ECONOMY = [] as const;

/** @deprecated vazio — i18n em `src/i18n/` */
export const LEGACY_AFTER_GRADE_UI = [] as const;

/** @deprecated vazio — sistemas online em `src/systems/` */
export const LEGACY_AFTER_PERSISTENCE = [] as const;

/** @deprecated vazio */
export const LEGACY_BEFORE_I18N_INIT = [] as const;

/** @deprecated vazio */
export const LEGACY_AFTER_COMBAT_MATH = [] as const;

/** @deprecated vazio */
export const LEGACY_AFTER_PAPERDOLL = [] as const;
