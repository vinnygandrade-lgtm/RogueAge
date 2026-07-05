-- ========================================================
-- RogueAge — Ascensão: registo autoritativo de abate de campeão elite
-- Alinhar c_sgrade / c_weekly_cap com js/endgame_pursuits.js (SGRADE_LEVEL, WEEKLY_CHAMP_KILL_CAP).
-- Rollover de semana ISO igual a register + claim (weeklyWeekKey).
--
-- Deploy (Supabase SQL Editor):
--   0) Obrigatório: supabase_ascension_ledger.sql (tabela ascension_events + RLS) — senão a RPC falha.
--   1) Aplicar também claim atualizado: supabase_ascension_weekly_claim.sql (ou MASTER 5C+5D).
--   2) Executar este ficheiro (ou bloco 5D do supabase_MASTER_SETUP.sql).
--   3) Verificar GRANT EXECUTE … TO authenticated.
-- Checklist completo: l2mini-project-rules.mdc §13.1
-- ========================================================

CREATE OR REPLACE FUNCTION public.register_elite_champion_kill_secure(p_week_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_char TEXT;
    v_level INTEGER;
    v_data JSONB;
    v_end JSONB;
    v_weekly INTEGER;
    v_lifetime BIGINT;
    c_sgrade INTEGER := 76;
    c_weekly_cap INTEGER := 500;
BEGIN
    IF p_week_key IS NULL OR length(trim(p_week_key)) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_week');
    END IF;

    SELECT c.char_name, c.level, c.data
    INTO v_char, v_level, v_data
    FROM public.characters c
    WHERE c.user_id = auth.uid()
    LIMIT 1;

    IF v_char IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    IF v_level < c_sgrade THEN
        RETURN jsonb_build_object('success', false, 'error', 'level_too_low');
    END IF;

    v_end := COALESCE(v_data->'endgame', '{}'::jsonb);

    IF COALESCE(v_end->>'weeklyWeekKey', '') IS DISTINCT FROM trim(p_week_key) THEN
        v_end := v_end || jsonb_build_object(
            'weeklyWeekKey', trim(p_week_key),
            'weeklyChampionKills', 0
        );
    END IF;

    v_weekly := COALESCE((v_end->>'weeklyChampionKills')::INTEGER, 0);
    IF v_weekly >= c_weekly_cap THEN
        RETURN jsonb_build_object('success', false, 'error', 'weekly_cap');
    END IF;

    v_weekly := v_weekly + 1;
    v_lifetime := COALESCE((v_end->>'lifetimeChampionKills')::BIGINT, 0::BIGINT) + 1;

    v_end := v_end || jsonb_build_object(
        'weeklyChampionKills', v_weekly,
        'lifetimeChampionKills', v_lifetime,
        'weeklyWeekKey', trim(p_week_key)
    );

    v_data := v_data || jsonb_build_object('endgame', v_end);

    UPDATE public.characters
    SET data = v_data, updated_at = NOW()
    WHERE char_name = v_char;

    INSERT INTO public.ascension_events (char_name, user_id, event_type, week_key, payload)
    VALUES (
        v_char,
        auth.uid(),
        'elite_champion_kill',
        trim(p_week_key),
        jsonb_build_object(
            'weeklyChampionKills', v_weekly,
            'lifetimeChampionKills', v_lifetime,
            'level', v_level
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'weeklyChampionKills', v_weekly,
        'lifetimeChampionKills', v_lifetime,
        'weeklyWeekKey', trim(p_week_key),
        'endgame', v_end
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_elite_champion_kill_secure(TEXT) TO authenticated;
