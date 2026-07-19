-- ========================================================
-- RogueAge — Combat stat ranking ladder (server-sorted)
-- Snapshot from client after save; RPC validates ownership.
-- Debt (§12.7): server does not recompute from equipment.
--
-- Deploy (Supabase SQL Editor):
--   1) Run this file (or MASTER section 5I).
--   2) Confirm GRANT EXECUTE on both functions to authenticated.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.character_combat_stats (
    char_name TEXT PRIMARY KEY REFERENCES public.characters(char_name) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    char_class TEXT NOT NULL DEFAULT 'Fighter',
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 99),
    p_atk INTEGER NOT NULL DEFAULT 0 CHECK (p_atk >= 0 AND p_atk <= 999999),
    m_atk INTEGER NOT NULL DEFAULT 0 CHECK (m_atk >= 0 AND m_atk <= 999999),
    p_def INTEGER NOT NULL DEFAULT 0 CHECK (p_def >= 0 AND p_def <= 999999),
    m_def INTEGER NOT NULL DEFAULT 0 CHECK (m_def >= 0 AND m_def <= 999999),
    crit_rate INTEGER NOT NULL DEFAULT 0 CHECK (crit_rate >= 0 AND crit_rate <= 100),
    max_hp INTEGER NOT NULL DEFAULT 0 CHECK (max_hp >= 0 AND max_hp <= 9999999),
    atk_speed INTEGER NOT NULL DEFAULT 0 CHECK (atk_speed >= 0 AND atk_speed <= 999999),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS character_combat_stats_p_atk_idx
    ON public.character_combat_stats (p_atk DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_m_atk_idx
    ON public.character_combat_stats (m_atk DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_p_def_idx
    ON public.character_combat_stats (p_def DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_m_def_idx
    ON public.character_combat_stats (m_def DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_crit_idx
    ON public.character_combat_stats (crit_rate DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_max_hp_idx
    ON public.character_combat_stats (max_hp DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_atk_spd_idx
    ON public.character_combat_stats (atk_speed DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS character_combat_stats_level_idx
    ON public.character_combat_stats (level DESC, updated_at DESC);

ALTER TABLE public.character_combat_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS character_combat_stats_select_authenticated ON public.character_combat_stats;
CREATE POLICY character_combat_stats_select_authenticated
    ON public.character_combat_stats
    FOR SELECT
    TO authenticated
    USING (true);

-- Writes only via SECURITY DEFINER RPCs (no INSERT/UPDATE policies for authenticated).

CREATE OR REPLACE FUNCTION public.upsert_character_combat_stats(
    p_char_name TEXT,
    p_char_class TEXT,
    p_level INTEGER,
    p_p_atk INTEGER,
    p_m_atk INTEGER,
    p_p_def INTEGER,
    p_m_def INTEGER,
    p_crit_rate INTEGER,
    p_max_hp INTEGER,
    p_atk_speed INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_owner UUID;
    v_name TEXT;
    v_class TEXT;
    v_level INTEGER;
    v_p_atk INTEGER;
    v_m_atk INTEGER;
    v_p_def INTEGER;
    v_m_def INTEGER;
    v_crit INTEGER;
    v_max_hp INTEGER;
    v_atk_spd INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    IF p_char_name IS NULL OR length(trim(p_char_name)) < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_char');
    END IF;

    SELECT c.user_id, c.char_name
    INTO v_owner, v_name
    FROM public.characters c
    WHERE lower(c.char_name) = lower(trim(p_char_name))
    LIMIT 1;

    IF v_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    IF v_owner IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_owner');
    END IF;

    v_class := left(COALESCE(NULLIF(trim(p_char_class), ''), 'Fighter'), 64);
    v_level := LEAST(99, GREATEST(1, COALESCE(p_level, 1)));
    v_p_atk := LEAST(999999, GREATEST(0, COALESCE(p_p_atk, 0)));
    v_m_atk := LEAST(999999, GREATEST(0, COALESCE(p_m_atk, 0)));
    v_p_def := LEAST(999999, GREATEST(0, COALESCE(p_p_def, 0)));
    v_m_def := LEAST(999999, GREATEST(0, COALESCE(p_m_def, 0)));
    v_crit := LEAST(100, GREATEST(0, COALESCE(p_crit_rate, 0)));
    v_max_hp := LEAST(9999999, GREATEST(0, COALESCE(p_max_hp, 0)));
    v_atk_spd := LEAST(999999, GREATEST(0, COALESCE(p_atk_speed, 0)));

    INSERT INTO public.character_combat_stats (
        char_name, user_id, char_class, level,
        p_atk, m_atk, p_def, m_def, crit_rate, max_hp, atk_speed, updated_at
    ) VALUES (
        v_name, v_uid, v_class, v_level,
        v_p_atk, v_m_atk, v_p_def, v_m_def, v_crit, v_max_hp, v_atk_spd, NOW()
    )
    ON CONFLICT (char_name) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        char_class = EXCLUDED.char_class,
        level = EXCLUDED.level,
        p_atk = EXCLUDED.p_atk,
        m_atk = EXCLUDED.m_atk,
        p_def = EXCLUDED.p_def,
        m_def = EXCLUDED.m_def,
        crit_rate = EXCLUDED.crit_rate,
        max_hp = EXCLUDED.max_hp,
        atk_speed = EXCLUDED.atk_speed,
        updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'char_name', v_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_combat_stat_ranking(
    p_metric TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_metric TEXT := lower(trim(COALESCE(p_metric, 'p_atk')));
    v_limit INTEGER := LEAST(100, GREATEST(1, COALESCE(p_limit, 50)));
    v_rows JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    IF v_metric NOT IN (
        'p_atk', 'm_atk', 'p_def', 'm_def', 'crit_rate', 'max_hp', 'atk_speed', 'level'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_metric');
    END IF;

    -- atk_speed is interval ms (lower = faster). All other metrics: higher wins.
    IF v_metric = 'atk_speed' THEN
        EXECUTE format(
            $q$
            SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.rank_pos), '[]'::jsonb)
            FROM (
                SELECT
                    ROW_NUMBER() OVER (ORDER BY s.atk_speed ASC, s.updated_at DESC, s.char_name ASC) AS rank_pos,
                    s.char_name, s.char_class, s.level, s.atk_speed AS metric_value, s.updated_at
                FROM public.character_combat_stats s
                ORDER BY s.atk_speed ASC, s.updated_at DESC, s.char_name ASC
                LIMIT %s
            ) t
            $q$,
            v_limit
        ) INTO v_rows;
    ELSE
        EXECUTE format(
            $q$
            SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.rank_pos), '[]'::jsonb)
            FROM (
                SELECT
                    ROW_NUMBER() OVER (ORDER BY s.%I DESC, s.updated_at DESC, s.char_name ASC) AS rank_pos,
                    s.char_name, s.char_class, s.level, s.%I AS metric_value, s.updated_at
                FROM public.character_combat_stats s
                ORDER BY s.%I DESC, s.updated_at DESC, s.char_name ASC
                LIMIT %s
            ) t
            $q$,
            v_metric, v_metric, v_metric, v_limit
        ) INTO v_rows;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'metric', v_metric,
        'rows', COALESCE(v_rows, '[]'::jsonb)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_character_combat_stats(
    TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_combat_stat_ranking(TEXT, INTEGER) TO authenticated;
