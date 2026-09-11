-- ========================================================
-- ONBOARDING FUNNEL (first-session milestones) — RogueAge
-- Mirror of MASTER section 5J. Idempotent; safe to re-run.
--
-- Client: src/systems/tutorial_engine.ts → SupabaseAPI.logOnboardingMilestone (fire-and-forget).
-- One row per (char_name, milestone); repeats are ignored (ON CONFLICT DO NOTHING).
-- Milestones: world, forest, mob_spawn, first_attack, first_hit, first_kill, level_up,
--             upgrade_picked, first_extract, skill_equipped.
-- Purpose: measure where new players stall before the first fight (docs/onboarding-flow.md).
-- ========================================================

CREATE TABLE IF NOT EXISTS public.onboarding_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    char_name TEXT NOT NULL REFERENCES public.characters(char_name) ON DELETE CASCADE,
    milestone TEXT NOT NULL CHECK (milestone ~ '^[a-z_]{2,40}$'),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 99),
    -- ms since the character was created (client clock; 0 = unknown / migrated veteran)
    elapsed_ms BIGINT NOT NULL DEFAULT 0 CHECK (elapsed_ms >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (char_name, milestone)
);
CREATE INDEX IF NOT EXISTS onboarding_events_milestone_idx ON public.onboarding_events (milestone, created_at DESC);
CREATE INDEX IF NOT EXISTS onboarding_events_user_idx ON public.onboarding_events (user_id);

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;
-- Players only read their own rows; writes go through the RPC below (SECURITY DEFINER).
DROP POLICY IF EXISTS onboarding_events_select_own ON public.onboarding_events;
CREATE POLICY onboarding_events_select_own ON public.onboarding_events
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_onboarding_milestone(
    p_char_name TEXT,
    p_milestone TEXT,
    p_level INTEGER DEFAULT 1,
    p_elapsed_ms BIGINT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_owner UUID;
    v_name TEXT;
    v_milestone TEXT := lower(trim(COALESCE(p_milestone, '')));
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;
    IF v_milestone !~ '^[a-z_]{2,40}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_milestone');
    END IF;
    IF p_char_name IS NULL OR length(trim(p_char_name)) < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_char');
    END IF;

    SELECT c.user_id, c.char_name INTO v_owner, v_name
    FROM public.characters c
    WHERE lower(c.char_name) = lower(trim(p_char_name))
    LIMIT 1;

    IF v_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    IF v_owner IS DISTINCT FROM v_uid THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_owner');
    END IF;

    INSERT INTO public.onboarding_events (user_id, char_name, milestone, level, elapsed_ms)
    VALUES (
        v_uid,
        v_name,
        v_milestone,
        LEAST(99, GREATEST(1, COALESCE(p_level, 1))),
        GREATEST(0, COALESCE(p_elapsed_ms, 0))
    )
    ON CONFLICT (char_name, milestone) DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_onboarding_milestone(TEXT, TEXT, INTEGER, BIGINT) TO authenticated;

-- --------------------------------------------------------
-- Staff funnel query (run in the SQL Editor; RLS does not apply to the dashboard role):
--
--   SELECT milestone,
--          count(*)                                       AS chars,
--          round(percentile_cont(0.5) WITHIN GROUP (ORDER BY elapsed_ms) / 60000.0, 1) AS median_min
--   FROM public.onboarding_events
--   WHERE elapsed_ms > 0
--   GROUP BY milestone
--   ORDER BY min(created_at);
--
-- Drop-off = chars(world) → chars(forest) → chars(mob_spawn) → chars(first_kill).
-- --------------------------------------------------------
