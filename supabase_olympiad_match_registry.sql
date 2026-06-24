-- OLYMPIAD: registo de duelos PvP real (semi-online mais justo)
-- Aplica no SQL Editor do Supabase (não segue o Git sozinho). Incluído no supabase_MASTER_SETUP.sql.
-- Duelos vs bot continuam sem match_id. Vs jogador: create_olympiad_match_secure antes do combate → resolve com p_match_id.

CREATE TABLE IF NOT EXISTS public.olympiad_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attacker_char_name TEXT NOT NULL,
    defender_char_name TEXT NOT NULL,
    defender_is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    attacker_user_id UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_oly_matches_pair_open
    ON public.olympiad_matches (lower(trim(attacker_char_name)), lower(trim(defender_char_name)))
    WHERE status = 'open';

ALTER TABLE public.olympiad_matches ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.olympiad_matches IS 'Registo server-side de intento de duelo PvP; resolve_olympiad_mmr_pair consome uma linha open+valida.';

CREATE OR REPLACE FUNCTION public.create_olympiad_match_secure(
    p_attacker_name TEXT,
    p_defender_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_att TEXT;
    v_def TEXT;
    v_a_data JSONB;
    v_d_data JSONB;
    v_a_lvl INTEGER;
    v_d_lvl INTEGER;
    v_a_mmr INTEGER;
    v_d_mmr INTEGER;
    v_snap JSONB;
    v_id UUID;
    v_exp TIMESTAMPTZ;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    IF p_attacker_name IS NULL OR p_defender_name IS NULL
       OR length(trim(p_attacker_name)) = 0 OR length(trim(p_defender_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_params');
    END IF;

    IF lower(trim(p_attacker_name)) = lower(trim(p_defender_name)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_pair');
    END IF;

    SELECT c.char_name, c.data, COALESCE(c.level, 1)
    INTO v_att, v_a_data, v_a_lvl
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_attacker_name)) AND c.user_id = v_uid;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'attacker_not_found_or_not_owner');
    END IF;

    SELECT c.char_name, c.data, COALESCE(c.level, 1)
    INTO v_def, v_d_data, v_d_lvl
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_defender_name));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'defender_not_found');
    END IF;

    v_a_mmr := COALESCE((v_a_data->>'olympiadPoints')::INTEGER, 0);
    v_d_mmr := COALESCE((v_d_data->>'olympiadPoints')::INTEGER, 0);

    v_snap := jsonb_build_object(
        'attacker', jsonb_build_object('mmr', v_a_mmr, 'level', v_a_lvl),
        'defender', jsonb_build_object('mmr', v_d_mmr, 'level', v_d_lvl)
    );

    UPDATE public.olympiad_matches
    SET status = 'cancelled'
    WHERE lower(trim(attacker_char_name)) = lower(trim(v_att))
      AND lower(trim(defender_char_name)) = lower(trim(v_def))
      AND status = 'open';

    v_exp := clock_timestamp() + INTERVAL '25 minutes';

    INSERT INTO public.olympiad_matches (
        attacker_char_name, defender_char_name, defender_is_bot, status, expires_at, snapshot, attacker_user_id
    ) VALUES (
        v_att, v_def, FALSE, 'open', v_exp, v_snap, v_uid
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object(
        'success', true,
        'match_id', v_id,
        'expires_at', v_exp
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_olympiad_match_secure(TEXT, TEXT) TO authenticated;

-- Atualizar resolve: substituir bloco completo no MASTER ou correr DROP + CREATE abaixo após backup.

DROP FUNCTION IF EXISTS public.resolve_olympiad_mmr_pair(TEXT, TEXT, INTEGER, INTEGER, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.resolve_olympiad_mmr_pair(TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.resolve_olympiad_mmr_pair(TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION public.resolve_olympiad_mmr_pair(
    p_attacker_name TEXT,
    p_defender_name TEXT,
    p_attacker_won BOOLEAN,
    p_defender_is_bot BOOLEAN DEFAULT FALSE,
    p_defender_snapshot_mmr INTEGER DEFAULT NULL,
    p_defender_snapshot_level INTEGER DEFAULT NULL,
    p_match_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_att TEXT;
    v_def TEXT;
    v_a_data JSONB;
    v_d_data JSONB;
    v_a_lvl INTEGER;
    v_d_lvl INTEGER;
    v_a_mmr BIGINT;
    v_d_mmr BIGINT;
    v_idx_att INTEGER;
    v_idx_def INTEGER;
    v_diff INTEGER;
    v_final_a INTEGER;
    v_final_d INTEGER;
    v_reward_adena BIGINT;
    v_reward_coins INTEGER;
    v_new_a_mmr INTEGER;
    v_new_d_mmr INTEGER;
    v_a_wins INTEGER;
    v_a_losses INTEGER;
    v_d_wins INTEGER;
    v_d_losses INTEGER;
    v_opp_label TEXT;
    v_snap_mmr BIGINT;
    v_snap_lvl INTEGER;
    v_base_adena BIGINT;
    v_base_coin BIGINT;
    v_mat public.olympiad_matches%ROWTYPE;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    v_opp_label := COALESCE(NULLIF(trim(p_defender_name), ''), 'Unknown');

    SELECT c.char_name, c.data, COALESCE(c.level, 1)
    INTO v_att, v_a_data, v_a_lvl
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_attacker_name))
      AND c.user_id = v_uid
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'attacker_not_found_or_not_owner');
    END IF;

    v_a_mmr := COALESCE((v_a_data->>'olympiadPoints')::BIGINT, 0);
    v_base_adena := COALESCE((v_a_data->>'adenas')::BIGINT, 0);
    v_base_coin := COALESCE((v_a_data->>'ancientCoins')::BIGINT, 0);

    SELECT COUNT(*)::INTEGER INTO v_idx_att FROM public.characters c
    WHERE (
        COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) > v_a_mmr
        OR (
            COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) = v_a_mmr
            AND COALESCE(c.level, 1) > v_a_lvl
        )
        OR (
            COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) = v_a_mmr
            AND COALESCE(c.level, 1) = v_a_lvl
            AND c.char_name < v_att
        )
    );

    v_reward_adena := 0;
    v_reward_coins := 0;

    IF COALESCE(p_defender_is_bot, FALSE) THEN
        v_snap_mmr := LEAST(99999999, GREATEST(0, COALESCE(p_defender_snapshot_mmr, 0)::BIGINT));
        v_snap_lvl := LEAST(120, GREATEST(1, COALESCE(p_defender_snapshot_level, 1)));
        SELECT COUNT(*)::INTEGER INTO v_idx_def FROM public.characters c
        WHERE (
            COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) > v_snap_mmr
            OR (
                COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) = v_snap_mmr
                AND COALESCE(c.level, 1) > v_snap_lvl
            )
            OR (
                COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) = v_snap_mmr
                AND COALESCE(c.level, 1) = v_snap_lvl
                AND c.char_name < v_opp_label
            )
        );
    ELSE
        IF p_match_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'match_id_required');
        END IF;

        SELECT m.* INTO v_mat
        FROM public.olympiad_matches m
        WHERE m.id = p_match_id
        FOR UPDATE;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'match_not_found');
        END IF;
        IF v_mat.status IS DISTINCT FROM 'open' THEN
            RETURN jsonb_build_object('success', false, 'error', 'match_not_open', 'detail', v_mat.status);
        END IF;
        IF v_mat.expires_at < clock_timestamp() THEN
            UPDATE public.olympiad_matches SET status = 'expired' WHERE id = p_match_id;
            RETURN jsonb_build_object('success', false, 'error', 'match_expired');
        END IF;
        IF lower(trim(v_mat.attacker_char_name)) <> lower(trim(v_att))
           OR lower(trim(v_mat.defender_char_name)) <> lower(trim(p_defender_name)) THEN
            RETURN jsonb_build_object('success', false, 'error', 'match_pair_mismatch');
        END IF;

        IF lower(trim(v_att)) = lower(trim(p_defender_name)) THEN
            RETURN jsonb_build_object('success', false, 'error', 'invalid_pair');
        END IF;

        SELECT c.char_name, c.data, COALESCE(c.level, 1)
        INTO v_def, v_d_data, v_d_lvl
        FROM public.characters c
        WHERE lower(trim(c.char_name)) = lower(trim(p_defender_name))
        FOR UPDATE;
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'defender_not_found');
        END IF;

        IF lower(trim(v_att)) = lower(trim(v_def)) THEN
            RETURN jsonb_build_object('success', false, 'error', 'invalid_pair');
        END IF;

        v_d_mmr := COALESCE((v_d_data->>'olympiadPoints')::BIGINT, 0);

        SELECT COUNT(*)::INTEGER INTO v_idx_def FROM public.characters c
        WHERE (
            COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) > v_d_mmr
            OR (
                COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) = v_d_mmr
                AND COALESCE(c.level, 1) > v_d_lvl
            )
            OR (
                COALESCE((c.data->>'olympiadPoints')::BIGINT, 0) = v_d_mmr
                AND COALESCE(c.level, 1) = v_d_lvl
                AND c.char_name < v_def
            )
        );
    END IF;

    IF NOT COALESCE(p_attacker_won, FALSE) THEN
        v_final_a := -15;
        v_final_d := 15;
    ELSE
        IF v_idx_def < v_idx_att THEN
            v_diff := v_idx_att - v_idx_def;
            v_final_a := 15 + LEAST(20, v_diff * 4);
            v_reward_adena := (2000 + (v_diff * 500))::BIGINT;
            v_reward_coins := 2 + (v_diff / 2)::INTEGER;
        ELSE
            v_diff := GREATEST(0, v_idx_def - v_idx_att);
            v_final_a := GREATEST(2, 5 - (v_diff / 2)::INTEGER);
        END IF;
        v_final_d := -((v_final_a / 2)::INTEGER);
    END IF;

    v_new_a_mmr := GREATEST(0, COALESCE((v_a_data->>'olympiadPoints')::INTEGER, 0) + v_final_a);
    v_a_wins := COALESCE((v_a_data->>'olympiadWins')::INTEGER, 0);
    v_a_losses := COALESCE((v_a_data->>'olympiadLosses')::INTEGER, 0);
    IF p_attacker_won THEN v_a_wins := v_a_wins + 1; ELSE v_a_losses := v_a_losses + 1; END IF;
    v_a_data := v_a_data || jsonb_build_object(
        'olympiadPoints', v_new_a_mmr,
        'olympiadWins', v_a_wins,
        'olympiadLosses', v_a_losses,
        'adenas', v_base_adena + v_reward_adena,
        'ancientCoins', v_base_coin + v_reward_coins::BIGINT
    );
    UPDATE public.characters SET data = v_a_data, updated_at = NOW() WHERE char_name = v_att;

    INSERT INTO public.olympiad_history (char_name, opponent_name, is_victory, points_change, battle_type)
    VALUES (v_att, v_opp_label, p_attacker_won, v_final_a, 'offensive');

    IF COALESCE(p_defender_is_bot, FALSE) THEN
        RETURN jsonb_build_object(
            'success', true,
            'attacker_points_change', v_final_a,
            'defender_points_change', v_final_d,
            'reward_adena', v_reward_adena,
            'reward_coins', v_reward_coins,
            'new_adenas', v_base_adena + v_reward_adena,
            'new_ancient_coins', v_base_coin + v_reward_coins::BIGINT,
            'ranking_note', 'mmr_rank_real_players_only',
            'attacker', jsonb_build_object('char_name', v_att, 'new_mmr', v_new_a_mmr, 'wins', v_a_wins, 'losses', v_a_losses),
            'defender', NULL
        );
    END IF;

    v_new_d_mmr := GREATEST(0, COALESCE((v_d_data->>'olympiadPoints')::INTEGER, 0) + v_final_d);
    v_d_wins := COALESCE((v_d_data->>'olympiadWins')::INTEGER, 0);
    v_d_losses := COALESCE((v_d_data->>'olympiadLosses')::INTEGER, 0);
    IF NOT p_attacker_won THEN v_d_wins := v_d_wins + 1; ELSE v_d_losses := v_d_losses + 1; END IF;
    v_d_data := v_d_data || jsonb_build_object(
        'olympiadPoints', v_new_d_mmr,
        'olympiadWins', v_d_wins,
        'olympiadLosses', v_d_losses
    );
    UPDATE public.characters SET data = v_d_data, updated_at = NOW() WHERE char_name = v_def;

    INSERT INTO public.olympiad_history (char_name, opponent_name, is_victory, points_change, battle_type)
    VALUES (v_def, v_att, NOT p_attacker_won, v_final_d, 'defensive');

    UPDATE public.olympiad_matches
    SET status = 'resolved', resolved_at = clock_timestamp()
    WHERE id = p_match_id;

    RETURN jsonb_build_object(
        'success', true,
        'attacker_points_change', v_final_a,
        'defender_points_change', v_final_d,
        'reward_adena', v_reward_adena,
        'reward_coins', v_reward_coins,
        'new_adenas', v_base_adena + v_reward_adena,
        'new_ancient_coins', v_base_coin + v_reward_coins::BIGINT,
        'ranking_note', 'mmr_rank_real_players_only',
        'attacker', jsonb_build_object('char_name', v_att, 'new_mmr', v_new_a_mmr, 'wins', v_a_wins, 'losses', v_a_losses),
        'defender', jsonb_build_object('char_name', v_def, 'new_mmr', v_new_d_mmr, 'wins', v_d_wins, 'losses', v_d_losses)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_olympiad_mmr_pair(TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER, UUID) TO authenticated;
