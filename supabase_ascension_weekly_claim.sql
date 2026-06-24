-- ========================================================
-- L2 MINI — Ascensão: resgate semanal (economia autoritativa)
-- Alinhar constantes com js/endgame_pursuits.js (SGRADE_LEVEL, WEEKLY_*).
-- Idempotente: uma vitória por personagem por ISO week key (YYYY-Www).
-- Inclui alinhamento de weeklyWeekKey com p_week_key antes de validar kills.
--
-- Deploy (Supabase SQL Editor):
--   0) Obrigatório: supabase_ascension_ledger.sql (tabela ascension_events + RLS).
--   1) Executar este ficheiro (ou bloco 5C do supabase_MASTER_SETUP.sql).
--   2) Aplicar registo de kills: supabase_champion_kill_register.sql (MASTER 5D).
--   3) Verificar GRANT EXECUTE … TO authenticated em ambas as funções.
-- Checklist completo: l2mini-project-rules.mdc §13.1
-- ========================================================

CREATE OR REPLACE FUNCTION public.claim_weekly_ascension_secure(p_week_key TEXT)
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
    v_kills INTEGER;
    v_last_claim TEXT;
    v_adena BIGINT;
    v_coins BIGINT;
    v_renown BIGINT;
    -- Espelho js/endgame_pursuits.js (manter sincronizado)
    c_sgrade INTEGER := 76;
    c_champ_target INTEGER := 35;
    c_reward_adena BIGINT := 1200000;
    c_reward_ancient BIGINT := 400;
    c_renown_add BIGINT := 25;
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

    v_last_claim := COALESCE(v_end->>'lastClaimedWeekKey', '');
    IF v_last_claim = trim(p_week_key) THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_claimed');
    END IF;

    v_kills := COALESCE((v_end->>'weeklyChampionKills')::INTEGER, 0);
    IF v_kills < c_champ_target THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_kills');
    END IF;

    v_renown := COALESCE((v_end->>'renown')::BIGINT, 0::BIGINT) + c_renown_add;

    v_end := v_end || jsonb_build_object(
        'lastClaimedWeekKey', trim(p_week_key),
        'renown', v_renown
    );

    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0::BIGINT) + c_reward_adena;
    v_coins := COALESCE((v_data->>'ancientCoins')::BIGINT, 0::BIGINT) + c_reward_ancient;

    v_data := v_data || jsonb_build_object(
        'endgame', v_end,
        'adenas', v_adena,
        'ancientCoins', v_coins
    );

    UPDATE public.characters
    SET data = v_data, updated_at = NOW()
    WHERE char_name = v_char;

    INSERT INTO public.ascension_events (char_name, user_id, event_type, week_key, payload)
    VALUES (
        v_char,
        auth.uid(),
        'weekly_claim',
        trim(p_week_key),
        jsonb_build_object(
            'weeklyChampionKills', v_kills,
            'new_renown', v_renown,
            'added_adena', c_reward_adena,
            'added_ancient', c_reward_ancient,
            'level', v_level
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'new_renown', v_renown,
        'added_adena', c_reward_adena,
        'added_ancient', c_reward_ancient,
        'endgame', v_end
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_weekly_ascension_secure(TEXT) TO authenticated;
