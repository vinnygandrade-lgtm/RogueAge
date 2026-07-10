-- ========================================================
-- RogueAge ? SUPABASE MASTER SETUP (V4.2 - ULTRA RESILIENT)
-- ========================================================
-- Este script cont�m TODA a infraestrutura unificada e segura.
-- Ele verifica e corrige a estrutura das tabelas automaticamente.
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. EXTENS�ES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- 2. TABELAS BASE (Garante que existam)
-- ========================================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    access_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHARACTERS
CREATE TABLE IF NOT EXISTS public.characters (
    char_name TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    char_class TEXT NOT NULL DEFAULT 'Fighter',
    level INTEGER NOT NULL DEFAULT 1,
    data JSONB NOT NULL DEFAULT '{}'::JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MAILBOX
CREATE TABLE IF NOT EXISTS public.mailbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_name TEXT NOT NULL,
    sender_name TEXT NOT NULL DEFAULT 'System',
    subject TEXT NOT NULL,
    type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLANS
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL UNIQUE,
    logo TEXT NOT NULL DEFAULT '??',
    leader_name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    min_level INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLAN MEMBERS
CREATE TABLE IF NOT EXISTS public.clan_members (
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    char_name TEXT NOT NULL PRIMARY KEY,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLAN APPLICATIONS
CREATE TABLE IF NOT EXISTS public.clan_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    char_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(clan_id, char_name)
);

-- CLAN CHAT
CREATE TABLE IF NOT EXISTS public.clan_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clan_id UUID NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
    char_name TEXT NOT NULL,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 100),
    tier TEXT NOT NULL DEFAULT 'Paper',
    ascension_title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.global_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    char_name TEXT NOT NULL,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
    tier TEXT NOT NULL DEFAULT 'Paper',
    ascension_title TEXT,
    msg_kind TEXT NOT NULL DEFAULT 'player' CHECK (msg_kind IN ('player', 'system')),
    i18n_key TEXT,
    i18n_params JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS global_chat_messages_created_at_idx
    ON public.global_chat_messages (created_at DESC);

-- CASTLES
CREATE TABLE IF NOT EXISTS public.castles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_clan_id UUID REFERENCES public.clans(id) ON DELETE SET NULL,
    treasury BIGINT NOT NULL DEFAULT 0,
    last_siege_at TIMESTAMPTZ,
    tax_rate INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MARKET LISTINGS
CREATE TABLE IF NOT EXISTS public.market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_name TEXT NOT NULL,
    seller_char_name TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_data JSONB NOT NULL,
    price BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'adena',
    category TEXT NOT NULL,
    categoria TEXT NOT NULL,
    sold BOOLEAN NOT NULL DEFAULT FALSE,
    buyer_name TEXT,
    payout_claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OLYMPIAD HISTORY
CREATE TABLE IF NOT EXISTS public.olympiad_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    char_name TEXT NOT NULL,
    opponent_name TEXT NOT NULL,
    is_victory BOOLEAN NOT NULL,
    points_change INTEGER NOT NULL,
    battle_type TEXT NOT NULL, -- 'offensive' ou 'defensive'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OLYMPIAD PvP match registry (intent before resolve ? see RPC create_olympiad_match_secure)
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

COMMENT ON TABLE public.olympiad_matches IS 'Server-side intent for real PvP duels; resolve_olympiad_mmr_pair consumes an open valid row.';

-- ASCENSION EVENT LEDGER (auditoria; append-only via RPC)
CREATE TABLE IF NOT EXISTS public.ascension_events (
    id BIGSERIAL PRIMARY KEY,
    char_name TEXT NOT NULL REFERENCES public.characters(char_name) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('elite_champion_kill', 'weekly_claim')),
    week_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ascension_events_char_week ON public.ascension_events(char_name, week_key);
CREATE INDEX IF NOT EXISTS idx_ascension_events_user_created ON public.ascension_events(user_id, created_at DESC);

-- REWARDS (Reward Hub GM)
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    char_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    sender TEXT DEFAULT 'System',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rewards_char_unclaimed ON public.rewards (lower(char_name)) WHERE claimed = FALSE;

-- ========================================================
-- 3. RESILI�NCIA: CORRE��O DE COLUNAS (Caso as tabelas j� existissem)
-- ========================================================
DO $$ 
BEGIN 
    -- Corre��es para MARKET_LISTINGS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='seller_char_name') THEN
        ALTER TABLE public.market_listings ADD COLUMN seller_char_name TEXT;
        UPDATE public.market_listings SET seller_char_name = seller_name WHERE seller_char_name IS NULL;
        UPDATE public.market_listings SET seller_char_name = COALESCE(seller_char_name, 'Unknown') WHERE seller_char_name IS NULL OR trim(seller_char_name) = '';
        ALTER TABLE public.market_listings ALTER COLUMN seller_char_name SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='seller_name') THEN
        ALTER TABLE public.market_listings ADD COLUMN seller_name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='item_id') THEN
        ALTER TABLE public.market_listings ADD COLUMN item_id TEXT NOT NULL DEFAULT 'unknown';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='item_name') THEN
        ALTER TABLE public.market_listings ADD COLUMN item_name TEXT NOT NULL DEFAULT 'Unknown Item';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='item_data') THEN
        ALTER TABLE public.market_listings ADD COLUMN item_data JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='price') THEN
        ALTER TABLE public.market_listings ADD COLUMN price BIGINT NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='currency') THEN
        ALTER TABLE public.market_listings ADD COLUMN currency TEXT NOT NULL DEFAULT 'adena';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='category') THEN
        ALTER TABLE public.market_listings ADD COLUMN category TEXT NOT NULL DEFAULT 'mats';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='categoria') THEN
        ALTER TABLE public.market_listings ADD COLUMN categoria TEXT;
        UPDATE public.market_listings SET categoria = COALESCE(NULLIF(trim(category), ''), 'mats') WHERE categoria IS NULL;
        ALTER TABLE public.market_listings ALTER COLUMN categoria SET NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='category')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='categoria') THEN
        UPDATE public.market_listings SET
            categoria = COALESCE(NULLIF(trim(categoria), ''), NULLIF(trim(category), ''), 'mats'),
            category = COALESCE(NULLIF(trim(category), ''), NULLIF(trim(categoria), ''), 'mats')
        WHERE categoria IS NULL OR category IS NULL OR trim(COALESCE(categoria, '')) = '' OR trim(COALESCE(category, '')) = '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='sold') THEN
        ALTER TABLE public.market_listings ADD COLUMN sold BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='buyer_name') THEN
        ALTER TABLE public.market_listings ADD COLUMN buyer_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='market_listings' AND column_name='payout_claimed') THEN
        ALTER TABLE public.market_listings ADD COLUMN payout_claimed BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Corre��es para MAILBOX (Garantir colunas essenciais)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mailbox' AND column_name='recipient_name') THEN
        ALTER TABLE public.mailbox ADD COLUMN recipient_name TEXT NOT NULL DEFAULT 'Unknown';
    END IF;
END $$;

-- ========================================================
-- 4. SEGURAN�A (RLS)
-- ========================================================

ALTER TABLE public.mailbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.castles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiad_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olympiad_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ascension_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Characters Policies (CR�TICO PARA RANKING E INSPE��O)
DROP POLICY IF EXISTS "Public characters view" ON public.characters;
CREATE POLICY "Public characters view" ON public.characters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own characters" ON public.characters;
CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE USING (user_id::text = auth.uid()::text);
DROP POLICY IF EXISTS "Users can insert own characters" ON public.characters;
CREATE POLICY "Users can insert own characters" ON public.characters FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

-- Olympiad History Policies
DROP POLICY IF EXISTS "Users can view own history" ON public.olympiad_history;
CREATE POLICY "Users can view own history" ON public.olympiad_history FOR SELECT USING (char_name IN (SELECT char_name FROM characters WHERE user_id::text = auth.uid()::text));

-- Ascension ledger: leitura s� dos pr�prios eventos; escrita apenas via RPC SECURITY DEFINER
DROP POLICY IF EXISTS "Users view own ascension events" ON public.ascension_events;
CREATE POLICY "Users view own ascension events" ON public.ascension_events FOR SELECT USING (user_id::text = auth.uid()::text);

-- Mailbox Policies
DROP POLICY IF EXISTS "Recipient can select own mail" ON public.mailbox;
CREATE POLICY "Recipient can select own mail" ON public.mailbox FOR SELECT USING (recipient_name IN (SELECT char_name FROM characters WHERE user_id::text = auth.uid()::text));

-- Clan Policies
DROP POLICY IF EXISTS "Public clans view" ON public.clans;
CREATE POLICY "Public clans view" ON public.clans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public members view" ON public.clan_members;
CREATE POLICY "Public members view" ON public.clan_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated read global chat" ON public.global_chat_messages;
CREATE POLICY "Authenticated read global chat" ON public.global_chat_messages FOR SELECT TO authenticated USING (true);

-- Market Policies
DROP POLICY IF EXISTS "Public market view" ON public.market_listings;
CREATE POLICY "Public market view" ON public.market_listings FOR SELECT USING (sold = FALSE);
DROP POLICY IF EXISTS "Sellers can view own listings" ON public.market_listings;
CREATE POLICY "Sellers can view own listings" ON public.market_listings FOR SELECT USING (
    COALESCE(NULLIF(trim(seller_char_name), ''), NULLIF(trim(seller_name), '')) IN (SELECT char_name FROM characters WHERE user_id::text = auth.uid()::text)
);

-- Rewards Policies (Reward Hub)
DROP POLICY IF EXISTS "recipients_select_own_rewards" ON public.rewards;
CREATE POLICY "recipients_select_own_rewards" ON public.rewards FOR SELECT USING (
    claimed = FALSE
    AND lower(char_name) IN (SELECT lower(char_name) FROM public.characters WHERE user_id = auth.uid())
);
DROP POLICY IF EXISTS "recipients_update_own_rewards" ON public.rewards;
CREATE POLICY "recipients_update_own_rewards" ON public.rewards FOR UPDATE
USING (lower(char_name) IN (SELECT lower(char_name) FROM public.characters WHERE user_id = auth.uid()))
WITH CHECK (lower(char_name) IN (SELECT lower(char_name) FROM public.characters WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "gm_insert_rewards" ON public.rewards;
CREATE POLICY "gm_insert_rewards" ON public.rewards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level > 0)
);

-- ========================================================
-- 5. RPCs: SISTEMA SEGURO
-- ========================================================

-- OLIMPIADA: ATUALIZAR MMR (um s� jogador; ex.: duelo vs bot ? dono = auth.uid())
CREATE OR REPLACE FUNCTION update_olympiad_mmr(
    p_char_name TEXT,
    p_points_change INTEGER,
    p_is_victory BOOLEAN,
    p_opponent_name TEXT DEFAULT 'Unknown',
    p_battle_type TEXT DEFAULT 'offensive'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_char TEXT;
    v_current_data JSONB;
    v_new_mmr INTEGER;
    v_new_wins INTEGER;
    v_new_losses INTEGER;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'not_authenticated');
    END IF;

    SELECT c.char_name, c.data INTO v_char, v_current_data
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_char_name))
    FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Character not found');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.characters o
        WHERE o.char_name = v_char AND o.user_id = v_uid
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'not_character_owner');
    END IF;

    v_new_mmr := COALESCE((v_current_data->>'olympiadPoints')::INTEGER, 0) + COALESCE(p_points_change, 0);
    IF v_new_mmr < 0 THEN v_new_mmr := 0; END IF;

    v_new_wins := COALESCE((v_current_data->>'olympiadWins')::INTEGER, 0);
    v_new_losses := COALESCE((v_current_data->>'olympiadLosses')::INTEGER, 0);

    IF p_is_victory THEN v_new_wins := v_new_wins + 1; ELSE v_new_losses := v_new_losses + 1; END IF;

    v_current_data := v_current_data || jsonb_build_object(
        'olympiadPoints', v_new_mmr,
        'olympiadWins', v_new_wins,
        'olympiadLosses', v_new_losses
    );

    UPDATE public.characters SET data = v_current_data, updated_at = NOW() WHERE char_name = v_char;

    INSERT INTO public.olympiad_history (char_name, opponent_name, is_victory, points_change, battle_type)
    VALUES (v_char, COALESCE(NULLIF(trim(p_opponent_name), ''), 'Unknown'), p_is_victory, p_points_change, trim(coalesce(p_battle_type, 'offensive')));

    RETURN jsonb_build_object('success', true, 'new_mmr', v_new_mmr, 'wins', v_new_wins, 'losses', v_new_losses);
END;
$$;

-- OLIMPIADA: match registry + pair resolve (deploy mirror: supabase_olympiad_match_registry.sql)
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

-- OLIMPIADA: RESGATAR RECOMPENSA
CREATE OR REPLACE FUNCTION claim_olympiad_reward(
    p_char_name TEXT,
    p_rank_id TEXT,
    p_reward_adena INTEGER,
    p_reward_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_char TEXT;
    v_current_data JSONB;
    v_claimed_list JSONB;
    v_is_already_claimed BOOLEAN;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'not_authenticated');
    END IF;

    SELECT c.char_name, c.data INTO v_char, v_current_data
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_char_name))
    FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'Character not found'); END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.characters o WHERE o.char_name = v_char AND o.user_id = v_uid
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'not_character_owner');
    END IF;

    v_claimed_list := COALESCE(v_current_data->'olympiadRewardsClaimed', '[]'::jsonb);
    SELECT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_claimed_list) AS elem WHERE elem = p_rank_id) INTO v_is_already_claimed;
    IF v_is_already_claimed THEN RETURN jsonb_build_object('success', false, 'message', 'Reward already claimed'); END IF;

    v_claimed_list := v_claimed_list || jsonb_build_array(p_rank_id);
    v_current_data := v_current_data || jsonb_build_object('olympiadRewardsClaimed', v_claimed_list);

    UPDATE public.characters SET data = v_current_data, updated_at = NOW() WHERE char_name = v_char;

    INSERT INTO public.mailbox (recipient_name, sender_name, subject, type, details)
    VALUES (v_char, 'Olympiad Manager', 'Rank Reward: ' || p_rank_id, 'system', 
        jsonb_build_object(
            'texto', 'Congratulations! You reached ' || p_rank_id || '.',
            'recompensas', p_reward_items || jsonb_build_array(jsonb_build_object('id', 'Adena', 'nome', 'Adena', 'qtd', p_reward_adena))
        )
    );

    RETURN jsonb_build_object('success', true, 'message', 'Reward sent to mailbox', 'claimed_list', v_claimed_list);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_olympiad_mmr(TEXT, INTEGER, BOOLEAN, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_olympiad_match_secure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_olympiad_mmr_pair(TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_olympiad_reward(TEXT, TEXT, INTEGER, JSONB) TO authenticated;

-- MARKET: PUBLICAR LISTAGEM (assinatura alinhada ao cliente: MarketCloud.publishListing)
DROP FUNCTION IF EXISTS market_publish_listing(TEXT, TEXT, TEXT, JSONB, BIGINT, TEXT, TEXT, BIGINT);
CREATE OR REPLACE FUNCTION public.market_publish_listing(
    p_seller_char_name TEXT,
    p_price BIGINT,
    p_currency TEXT,
    p_categoria TEXT,
    p_qtd INTEGER,
    p_enchant INTEGER,
    p_item_snapshot JSONB,
    p_full_item JSONB,
    p_fee BIGINT DEFAULT 1000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_seller TEXT;
    v_data JSONB;
    v_adena BIGINT;
    v_item_data JSONB;
    v_item_id TEXT;
    v_item_name TEXT;
    v_row public.market_listings%ROWTYPE;
    v_q INTEGER;
    v_cat TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'not_authenticated');
    END IF;

    IF p_seller_char_name IS NULL OR length(trim(p_seller_char_name)) = 0 OR p_price IS NULL OR p_price <= 0 THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'invalid_params');
    END IF;

    SELECT c.char_name INTO v_seller
    FROM public.characters c
    WHERE c.user_id = v_uid AND lower(trim(c.char_name)) = lower(trim(p_seller_char_name))
    LIMIT 1;

    IF v_seller IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'seller_not_owner');
    END IF;

    SELECT data INTO v_data FROM public.characters WHERE char_name = v_seller FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'seller_data_missing');
    END IF;

    v_data := COALESCE(v_data, '{}'::jsonb);
    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0);
    IF v_adena < COALESCE(p_fee, 1000) THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'insufficient_listing_fee', 'required', COALESCE(p_fee, 1000));
    END IF;

    v_q := GREATEST(1, COALESCE(p_qtd, 1));

    IF p_full_item IS NOT NULL AND jsonb_typeof(p_full_item) <> 'null' THEN
        v_item_data := p_full_item;
    ELSE
        v_item_data := COALESCE(p_item_snapshot, '{}'::jsonb) || jsonb_build_object('qtd', v_q);
    END IF;

    v_item_id := COALESCE(
        NULLIF(trim(v_item_data->'base'->>'id'), ''),
        NULLIF(trim(v_item_data->>'id'), ''),
        NULLIF(trim(COALESCE(p_item_snapshot, '{}'::jsonb)->>'id'), ''),
        'material'
    );
    v_item_name := COALESCE(
        NULLIF(trim(v_item_data->'base'->>'nome'), ''),
        NULLIF(trim(v_item_data->>'nome'), ''),
        NULLIF(trim(COALESCE(p_item_snapshot, '{}'::jsonb)->>'nome'), ''),
        'Listing'
    );

    v_cat := lower(trim(COALESCE(NULLIF(trim(p_categoria), ''), 'mats')));

    IF NULLIF(trim(v_item_data->>'nome'), '') IS NULL AND NULLIF(trim(v_item_name), '') IS NOT NULL THEN
        v_item_data := v_item_data || jsonb_build_object('nome', trim(v_item_name));
    END IF;
    IF NULLIF(trim(v_item_data->>'id'), '') IS NULL AND NULLIF(trim(v_item_id), '') IS NOT NULL THEN
        v_item_data := v_item_data || jsonb_build_object('id', trim(v_item_id));
    END IF;

    v_data := v_data || jsonb_build_object('adenas', v_adena - COALESCE(p_fee, 1000));
    UPDATE public.characters SET data = v_data, updated_at = NOW() WHERE char_name = v_seller;

    INSERT INTO public.market_listings (seller_name, seller_char_name, item_id, item_name, item_data, price, currency, category, categoria)
    VALUES (
        v_seller,
        v_seller,
        v_item_id,
        v_item_name,
        v_item_data,
        p_price,
        lower(trim(COALESCE(NULLIF(trim(p_currency), ''), 'adena'))),
        v_cat,
        v_cat
    )
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'ok', true,
        'success', true,
        'listing_fee_adena', COALESCE(p_fee, 1000),
        'seller_adenas', COALESCE((v_data->>'adenas')::BIGINT, 0),
        'seller_ancient_coins', COALESCE((v_data->>'ancientCoins')::BIGINT, 0),
        'listing', to_jsonb(v_row)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.market_publish_listing(TEXT, BIGINT, TEXT, TEXT, INTEGER, INTEGER, JSONB, JSONB, BIGINT) TO authenticated;

-- MARKET: COMPRAR LISTAGEM (auth do comprador, nomes can�nicos, correio comprador + liquida��o vendedor)
CREATE OR REPLACE FUNCTION market_purchase_listing(
    p_buyer_name TEXT,
    p_listing_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_listing RECORD;
    v_buyer_canon TEXT;
    v_seller_canon TEXT;
    v_buyer_data JSONB;
    v_currency_val BIGINT;
    v_currency_key TEXT;
    v_is_adena BOOLEAN;
    v_gross BIGINT;
    v_raw_tax BIGINT;
    v_cap BIGINT;
    v_tax BIGINT;
    v_net BIGINT;
    v_item_snap JSONB;
    v_enchant INTEGER;
    v_moeda TEXT;
    v_seller_mail_name TEXT;
    v_listing_seller TEXT;
    v_listing_cat TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'not_authenticated');
    END IF;

    IF p_buyer_name IS NULL OR length(trim(p_buyer_name)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'invalid_buyer');
    END IF;

    SELECT c.char_name INTO v_buyer_canon
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_buyer_name))
      AND c.user_id = v_uid
    LIMIT 1;

    IF v_buyer_canon IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'buyer_not_owner');
    END IF;

    SELECT * INTO v_listing FROM public.market_listings WHERE id = p_listing_id AND sold = FALSE FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'message', 'Listing not found or sold');
    END IF;

    v_listing_seller := COALESCE(
        NULLIF(trim(v_listing.seller_char_name), ''),
        NULLIF(trim(v_listing.seller_name), '')
    );
    IF v_listing_seller IS NULL OR length(v_listing_seller) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'invalid_listing_seller');
    END IF;

    IF lower(trim(v_listing_seller)) = lower(trim(v_buyer_canon)) THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'cannot_buy_own_listing');
    END IF;

    SELECT c.char_name INTO v_seller_canon
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(v_listing_seller))
    LIMIT 1;
    v_seller_mail_name := COALESCE(v_seller_canon, NULLIF(trim(v_listing_seller), ''));

    v_listing_cat := lower(trim(COALESCE(
        NULLIF(trim(v_listing.categoria), ''),
        NULLIF(trim(v_listing.category), ''),
        'mats'
    )));

    v_is_adena := (lower(trim(COALESCE(v_listing.currency, 'adena'))) = 'adena');
    v_currency_key := CASE WHEN v_is_adena THEN 'adenas' ELSE 'ancientCoins' END;

    SELECT c.data INTO v_buyer_data FROM public.characters c WHERE c.char_name = v_buyer_canon FOR UPDATE;
    IF NOT FOUND OR v_buyer_data IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'buyer_data_missing');
    END IF;

    v_currency_val := COALESCE((v_buyer_data->>v_currency_key)::BIGINT, 0);
    IF v_currency_val < v_listing.price THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'message', 'Insufficient funds');
    END IF;

    v_buyer_data := v_buyer_data || jsonb_build_object(v_currency_key, v_currency_val - v_listing.price);
    UPDATE public.characters SET data = v_buyer_data, updated_at = NOW() WHERE char_name = v_buyer_canon;

    UPDATE public.market_listings
    SET sold = TRUE, buyer_name = v_buyer_canon, payout_claimed = TRUE
    WHERE id = p_listing_id;

    v_item_snap := COALESCE(v_listing.item_data->'base', v_listing.item_data);
    IF NULLIF(trim(v_item_snap->>'nome'), '') IS NULL AND NULLIF(trim(v_listing.item_name), '') IS NOT NULL THEN
        v_item_snap := v_item_snap || jsonb_build_object('nome', trim(v_listing.item_name));
    END IF;
    IF NULLIF(trim(v_item_snap->>'id'), '') IS NULL AND NULLIF(trim(v_listing.item_id), '') IS NOT NULL THEN
        v_item_snap := v_item_snap || jsonb_build_object('id', trim(v_listing.item_id));
    END IF;
    v_enchant := COALESCE(
        NULLIF((v_listing.item_data->>'enchant')::INTEGER, NULL),
        NULLIF((v_listing.item_data->>'enchantLevel')::INTEGER, NULL),
        0
    );
    v_moeda := CASE WHEN v_is_adena THEN 'adena' ELSE 'coin' END;

    INSERT INTO public.mailbox (recipient_name, sender_name, subject, type, details)
    VALUES (
        v_buyer_canon,
        'Rogue Exchange',
        'Purchase ? parcel ready',
        'market',
        jsonb_build_object(
            'marketKind', 'purchase_delivery',
            'categoria', v_listing_cat,
            'enchant', v_enchant,
            'itemSnapshot', v_item_snap,
            'fullItem', v_listing.item_data,
            'itemName', COALESCE(NULLIF(trim(v_listing.item_name), ''), NULLIF(trim(v_item_snap->>'nome'), ''), 'Item'),
            'listingId', v_listing.id::TEXT,
            'qtd', COALESCE(NULLIF((v_listing.item_data->>'qtd')::INTEGER, NULL), 1),
            'sellerName', COALESCE(v_seller_mail_name, trim(v_listing_seller), ''),
            'paid', v_listing.price,
            'moeda', v_moeda,
            'valor', 0
        )
    );

    v_gross := v_listing.price;
    v_raw_tax := CEIL(v_gross * 0.05)::BIGINT;
    v_cap := GREATEST(0::BIGINT, v_gross - 1);
    v_tax := LEAST(v_raw_tax, v_cap);
    v_net := GREATEST(0::BIGINT, v_gross - v_tax);

    IF v_net > 0 AND v_seller_mail_name IS NOT NULL AND length(trim(v_seller_mail_name)) > 0 THEN
        INSERT INTO public.mailbox (recipient_name, sender_name, subject, type, details)
        VALUES (
            trim(v_seller_mail_name),
            'Rogue Exchange',
            'Market sale ? collect proceeds',
            'market',
            jsonb_build_object(
                'marketKind', 'sale_proceeds',
                'valor', v_net,
                'moeda', v_moeda,
                'gross', v_gross,
                'tax', v_tax,
                'buyerName', v_buyer_canon
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'success', true,
        'buyer_adenas', COALESCE((v_buyer_data->>'adenas')::BIGINT, 0),
        'buyer_ancient_coins', COALESCE((v_buyer_data->>'ancientCoins')::BIGINT, 0),
        'listing', jsonb_build_object(
            'id', v_listing.id,
            'seller_char_name', COALESCE(v_seller_mail_name, trim(v_listing_seller)),
            'seller_name', COALESCE(v_seller_mail_name, trim(v_listing_seller)),
            'item_snapshot', v_item_snap,
            'item_data', v_listing.item_data,
            'full_item', v_listing.item_data,
            'price', v_listing.price,
            'currency', v_listing.currency,
            'category', v_listing_cat,
            'categoria', v_listing_cat,
            'qtd', COALESCE(NULLIF((v_listing.item_data->>'qtd')::INTEGER, NULL), 1),
            'enchant', v_enchant,
            'sold', true,
            'created_at', v_listing.created_at
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.market_purchase_listing(TEXT, UUID) TO authenticated;

-- MARKET: CANCELAR LISTAGEM (vendedor; sold=TRUE remove do mercado p�blico)
CREATE OR REPLACE FUNCTION public.market_cancel_listing(
    p_listing_id UUID,
    p_seller_char_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_seller TEXT;
    v_row public.market_listings%ROWTYPE;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'not_authenticated');
    END IF;

    IF p_listing_id IS NULL OR p_seller_char_name IS NULL OR length(trim(p_seller_char_name)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'invalid_params');
    END IF;

    SELECT c.char_name INTO v_seller
    FROM public.characters c
    WHERE c.user_id = v_uid
      AND lower(trim(c.char_name)) = lower(trim(p_seller_char_name))
    LIMIT 1;

    IF v_seller IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'seller_not_owner');
    END IF;

    SELECT * INTO v_row
    FROM public.market_listings
    WHERE id = p_listing_id
      AND sold = FALSE
      AND lower(trim(COALESCE(NULLIF(trim(seller_char_name), ''), seller_name))) = lower(trim(v_seller))
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'success', false, 'error', 'listing_not_available');
    END IF;

    UPDATE public.market_listings
    SET sold = TRUE,
        payout_claimed = TRUE,
        buyer_name = NULL
    WHERE id = p_listing_id;

    SELECT * INTO v_row FROM public.market_listings WHERE id = p_listing_id;

    RETURN jsonb_build_object(
        'ok', true,
        'success', true,
        'listing', to_jsonb(v_row)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.market_cancel_listing(UUID, TEXT) TO authenticated;

-- MERCADO: REIVINDICAR PROCEEDS DE VENDAS (taxa 5%; cliente entrega via enviarMail)
CREATE OR REPLACE FUNCTION public.market_claim_payouts(
    p_seller_char_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_seller_canon TEXT;
    v_payouts JSONB := '[]'::jsonb;
    v_row RECORD;
    v_is_adena BOOLEAN;
    v_moeda TEXT;
    v_gross BIGINT;
    v_raw_tax BIGINT;
    v_cap BIGINT;
    v_tax BIGINT;
    v_net BIGINT;
    v_item_snap JSONB;
    v_enchant INTEGER;
    v_one JSONB;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
    END IF;

    SELECT c.char_name INTO v_seller_canon
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_seller_char_name))
      AND c.user_id = v_uid
    LIMIT 1;

    IF v_seller_canon IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'seller_not_owner');
    END IF;

    FOR v_row IN
        SELECT ml.*
        FROM public.market_listings ml
        WHERE ml.sold = TRUE
          AND ml.payout_claimed = FALSE
          AND lower(trim(COALESCE(NULLIF(trim(ml.seller_char_name), ''), NULLIF(trim(ml.seller_name), ''))))
              = lower(trim(v_seller_canon))
        FOR UPDATE
    LOOP
        v_is_adena := (lower(trim(COALESCE(v_row.currency, 'adena'))) = 'adena');
        v_moeda := CASE WHEN v_is_adena THEN 'adena' ELSE 'coin' END;
        v_gross := v_row.price;
        v_raw_tax := CEIL(v_gross * 0.05)::BIGINT;
        v_cap := GREATEST(0::BIGINT, v_gross - 1);
        v_tax := LEAST(v_raw_tax, v_cap);
        v_net := GREATEST(0::BIGINT, v_gross - v_tax);

        UPDATE public.market_listings SET payout_claimed = TRUE WHERE id = v_row.id;

        v_item_snap := COALESCE(v_row.item_data->'base', v_row.item_data);
        IF NULLIF(trim(v_item_snap->>'nome'), '') IS NULL AND NULLIF(trim(v_row.item_name), '') IS NOT NULL THEN
            v_item_snap := v_item_snap || jsonb_build_object('nome', trim(v_row.item_name));
        END IF;
        v_enchant := COALESCE(
            NULLIF((v_row.item_data->>'enchant')::INTEGER, NULL),
            NULLIF((v_row.item_data->>'enchantLevel')::INTEGER, NULL),
            0
        );
        IF v_enchant > 0 THEN
            v_item_snap := COALESCE(v_item_snap, '{}'::jsonb) || jsonb_build_object('enchant', v_enchant);
        END IF;

        v_one := jsonb_build_object(
            'net', v_net,
            'currency', v_moeda,
            'gross', v_gross,
            'tax', v_tax,
            'buyer_char_name', COALESCE(v_row.buyer_name, '—'),
            'item_snapshot', COALESCE(v_item_snap, '{}'::jsonb)
        );
        v_payouts := v_payouts || jsonb_build_array(v_one);
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'payouts', v_payouts);
END;
$$;

GRANT EXECUTE ON FUNCTION public.market_claim_payouts(TEXT) TO authenticated;

-- CHAT DE CL�: INSERIR MENSAGEM SEGURA
CREATE OR REPLACE FUNCTION public.insert_clan_chat_secure(
    p_clan_id UUID,
    p_body TEXT,
    p_tier TEXT DEFAULT 'Paper',
    p_ascension_title TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_char_name TEXT;
BEGIN
    -- Busca o nome do personagem do usu�rio logado
    SELECT char_name INTO v_char_name FROM public.characters WHERE user_id::text = auth.uid()::text LIMIT 1;
    IF v_char_name IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Character not found'); END IF;

    -- Verifica se o personagem pertence ao cl�
    IF NOT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id = p_clan_id AND char_name = v_char_name) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not a member of this clan');
    END IF;

    INSERT INTO public.clan_chat_messages (clan_id, char_name, body, tier, ascension_title)
    VALUES (p_clan_id, v_char_name, p_body, p_tier, p_ascension_title);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- CHAT GLOBAL: INSERIR MENSAGEM SEGURA (historico offline)
CREATE OR REPLACE FUNCTION public.insert_global_chat_secure(
    p_char_name TEXT,
    p_body TEXT,
    p_tier TEXT DEFAULT 'Paper',
    p_ascension_title TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_char_name TEXT;
    v_body TEXT;
    v_id UUID;
BEGIN
    SELECT c.char_name INTO v_char_name
    FROM public.characters c
    WHERE c.user_id::text = auth.uid()::text
      AND lower(c.char_name) = lower(trim(COALESCE(p_char_name, '')))
    LIMIT 1;
    IF v_char_name IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'character_not_found'); END IF;

    v_body := trim(COALESCE(p_body, ''));
    IF char_length(v_body) < 1 OR char_length(v_body) > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_body');
    END IF;

    INSERT INTO public.global_chat_messages (char_name, body, tier, ascension_title, msg_kind)
    VALUES (
        v_char_name,
        v_body,
        COALESCE(NULLIF(trim(p_tier), ''), 'Paper'),
        NULLIF(trim(COALESCE(p_ascension_title, '')), ''),
        'player'
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_global_chat_secure(TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_global_chat_history_secure(
    p_limit INT DEFAULT 200,
    p_days INT DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit INT;
    v_since TIMESTAMPTZ;
    v_rows JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
    END IF;

    v_limit := GREATEST(1, LEAST(COALESCE(p_limit, 200), 500));
    v_since := NOW() - (GREATEST(1, LEAST(COALESCE(p_days, 3), 30)) || ' days')::INTERVAL;

    SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.created_at ASC), '[]'::jsonb)
    INTO v_rows
    FROM (
        SELECT id, char_name, body, tier, ascension_title, msg_kind, i18n_key, i18n_params, created_at
        FROM public.global_chat_messages
        WHERE created_at >= v_since
        ORDER BY created_at DESC
        LIMIT v_limit
    ) t;

    RETURN jsonb_build_object('success', true, 'messages', COALESCE(v_rows, '[]'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_chat_history_secure(INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.insert_global_chat_system_secure(
    p_body TEXT,
    p_tier TEXT DEFAULT 'GM_ANNOUNCEMENT',
    p_i18n_key TEXT DEFAULT NULL,
    p_i18n_params JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_body TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level > 0) THEN
        RETURN jsonb_build_object('success', false, 'error', 'forbidden');
    END IF;

    v_body := trim(COALESCE(p_body, ''));
    IF char_length(v_body) < 1 OR char_length(v_body) > 500 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_body');
    END IF;

    INSERT INTO public.global_chat_messages (char_name, body, tier, msg_kind, i18n_key, i18n_params)
    VALUES (
        'SYSTEM',
        v_body,
        COALESCE(NULLIF(trim(p_tier), ''), 'GM_ANNOUNCEMENT'),
        'system',
        NULLIF(trim(COALESCE(p_i18n_key, '')), ''),
        p_i18n_params
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_global_chat_system_secure(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- MAILBOX: ENVIAR CORREIO SEGURO (destinat�rio = char_name can�nico na tabela)
CREATE OR REPLACE FUNCTION public.send_mail_secure(
    p_recipient_name TEXT,
    p_subject TEXT,
    p_type TEXT,
    p_details JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_name TEXT;
    v_recipient_canonical TEXT;
BEGIN
    -- Busca o nome do remetente
    SELECT char_name INTO v_sender_name FROM public.characters WHERE user_id::text = auth.uid()::text LIMIT 1;
    IF v_sender_name IS NULL THEN v_sender_name := 'System'; END IF;

    SELECT char_name INTO v_recipient_canonical FROM public.characters
    WHERE lower(char_name) = lower(trim(p_recipient_name))
    LIMIT 1;

    IF v_recipient_canonical IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'recipient_not_found');
    END IF;

    IF lower(v_recipient_canonical) = lower(trim(v_sender_name)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_mail_self');
    END IF;

    INSERT INTO public.mailbox (recipient_name, sender_name, subject, type, details)
    VALUES (v_recipient_canonical, v_sender_name, p_subject, p_type, p_details);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- MAILBOX: LISTAR CORREIO DO PERSONAGEM (case-insensitive; s� correio do jogador autenticado)
CREATE OR REPLACE FUNCTION public.get_mailbox_for_character(p_char_name TEXT)
RETURNS SETOF public.mailbox
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT m.*
    FROM public.mailbox m
    WHERE EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.user_id::text = auth.uid()::text
          AND lower(c.char_name) = lower(trim(p_char_name))
          AND lower(c.char_name) = lower(trim(m.recipient_name))
    )
    ORDER BY m.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_mailbox_for_character(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_mail_secure(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- MAILBOX: RESGATAR RECOMPENSA (CORRIGIDO + valida��o de destinat�rio + char case-insensitive)
CREATE OR REPLACE FUNCTION public.claim_mail_reward(p_mail_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_mail RECORD;
    v_char_data JSONB;
    v_recipient_canonical TEXT;
    v_reward_adena BIGINT := 0;
    v_reward_ancient BIGINT := 0;
    v_recompensas JSONB;
    v_item JSONB;
BEGIN
    -- 1. Busca o e-mail
    SELECT * INTO v_mail FROM public.mailbox WHERE id = p_mail_id FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Mail not found'); END IF;
    IF v_mail.is_claimed THEN RETURN jsonb_build_object('success', false, 'error', 'Already claimed'); END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.user_id::text = auth.uid()::text
          AND lower(c.char_name) = lower(trim(v_mail.recipient_name))
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_recipient');
    END IF;

    SELECT char_name, data INTO v_recipient_canonical, v_char_data
    FROM public.characters
    WHERE lower(char_name) = lower(trim(v_mail.recipient_name))
    FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Character not found'); END IF;

    v_char_data := COALESCE(v_char_data, '{}'::jsonb);

    -- 3. Processa recompensas baseadas no tipo
    IF v_mail.type = 'system' THEN
        v_recompensas := v_mail.details->'recompensas';
        IF v_recompensas IS NOT NULL AND jsonb_typeof(v_recompensas) = 'array' THEN
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_recompensas) LOOP
                -- CORRE��O: Usar ->> com string constante, n�o jsonb
                IF (v_item->>'id') = 'Adena' OR (v_item->>'nome') = 'Adena' THEN
                    v_reward_adena := v_reward_adena + COALESCE((v_item->>'qtd')::BIGINT, 0);
                ELSIF (v_item->>'id') = 'Ancient Coin' OR (v_item->>'nome') = 'Ancient Coin' THEN
                    v_reward_ancient := v_reward_ancient + COALESCE((v_item->>'qtd')::BIGINT, 0);
                END IF;
            END LOOP;
        END IF;
    ELSIF v_mail.type = 'market' AND COALESCE(v_mail.details->>'marketKind', '') = 'sale_proceeds' THEN
        IF v_mail.details->>'moeda' = 'coin' THEN
            v_reward_ancient := COALESCE((v_mail.details->>'valor')::BIGINT, 0);
        ELSE
            v_reward_adena := COALESCE((v_mail.details->>'valor')::BIGINT, 0);
        END IF;
    ELSIF v_mail.type = 'market' AND COALESCE(v_mail.details->>'marketKind', '') = 'purchase_delivery' THEN
        -- Moedas creditadas s� pelo cliente (ItemSecurity); aqui s� marca resgatado
        NULL;
    ELSIF v_mail.type = 'player' THEN
        v_reward_adena := COALESCE((v_mail.details->>'adena')::BIGINT, 0);
    END IF;

    -- 4. Aplica recompensas no JSONB do personagem
    v_char_data := v_char_data || jsonb_build_object(
        'adenas', COALESCE((v_char_data->>'adenas')::BIGINT, 0) + v_reward_adena,
        'ancientCoins', COALESCE((v_char_data->>'ancientCoins')::BIGINT, 0) + v_reward_ancient
    );

    -- 5. Atualiza banco
    UPDATE public.characters SET data = v_char_data, updated_at = NOW() WHERE char_name = v_recipient_canonical;
    UPDATE public.mailbox SET is_claimed = TRUE, is_read = TRUE WHERE id = p_mail_id;

    RETURN jsonb_build_object(
        'success', true, 
        'reward_adena', v_reward_adena, 
        'reward_ancient', v_reward_ancient
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_mail_reward(UUID) TO authenticated;

-- STATUS: BUSCAR STATUS AUTORITATIVO (stub ? inspe��o de stats no cliente)
-- O modal de inspe��o usa js/core_stats.js: calcularStatusGlobaisFromData(saveLike), n�o playerStats no JSON.
-- Esta fun��o mant�m-se para compat/API; n�o assumir que 'data' cont�m stats de combate corretos.
CREATE OR REPLACE FUNCTION public.get_player_stats_autoritativo(p_target_char_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_data JSONB;
BEGIN
    SELECT data INTO v_data FROM public.characters WHERE char_name = p_target_char_name;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Character not found'); END IF;
    
    -- Stub: devolve o JSONB; rec�lculo real de Atk/Def na inspe��o = motor do cliente (ver GDD �7).
    RETURN jsonb_build_object('success', true, 'data', v_data);
END;
$$;

-- ========================================================
-- 5B. CL�S ? AUTORIDADE (RPCs + RLS)
-- Mesmo conte�do que supabase_clans_authority.sql (manter em sincronia).
-- ========================================================

ALTER TABLE public.clan_applications
    DROP CONSTRAINT IF EXISTS clan_applications_clan_id_char_name_key;

DROP INDEX IF EXISTS public.clan_applications_one_pending;

CREATE UNIQUE INDEX IF NOT EXISTS clan_applications_one_pending
    ON public.clan_applications (clan_id, char_name)
    WHERE status = 'pending';

DROP POLICY IF EXISTS "clan_applications_select_own_or_leader" ON public.clan_applications;
CREATE POLICY "clan_applications_select_own_or_leader" ON public.clan_applications
    FOR SELECT
    USING (
        char_name IN (SELECT c.char_name FROM public.characters c WHERE c.user_id = auth.uid())
        OR clan_id IN (
            SELECT cl.id FROM public.clans cl
            WHERE cl.leader_name IN (
                SELECT c2.char_name FROM public.characters c2 WHERE c2.user_id = auth.uid()
            )
        )
    );

CREATE OR REPLACE FUNCTION public.create_clan_secure(
    p_name TEXT,
    p_tag TEXT,
    p_logo TEXT,
    p_min_level INTEGER,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_char TEXT;
    v_data JSONB;
    v_adena BIGINT;
    v_clan_id UUID;
    v_name TEXT;
    v_tag TEXT;
    v_logo TEXT;
    v_desc TEXT;
    v_ml INTEGER;
BEGIN
    v_name := trim(p_name);
    IF length(v_name) < 3 OR length(v_name) > 40 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_name');
    END IF;
    v_tag := upper(trim(p_tag));
    IF length(v_tag) < 2 OR length(v_tag) > 4 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_tag');
    END IF;
    v_ml := GREATEST(1, LEAST(COALESCE(p_min_level, 1), 85));
    v_logo := COALESCE(NULLIF(trim(p_logo), ''), '??');
    IF length(v_logo) > 32 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_logo');
    END IF;
    v_desc := COALESCE(NULLIF(trim(p_description), ''), '');
    IF length(v_desc) > 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'description_too_long');
    END IF;
    SELECT c.char_name, c.data INTO v_char, v_data
    FROM public.characters c WHERE c.user_id = auth.uid() LIMIT 1;
    IF v_char IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    IF EXISTS (SELECT 1 FROM public.clan_members m WHERE m.char_name = v_char) THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_in_clan');
    END IF;
    IF EXISTS (SELECT 1 FROM public.clans cl WHERE lower(cl.name) = lower(v_name)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'name_taken');
    END IF;
    IF EXISTS (SELECT 1 FROM public.clans cl WHERE cl.tag = v_tag) THEN
        RETURN jsonb_build_object('success', false, 'error', 'tag_taken');
    END IF;
    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0::BIGINT);
    IF v_adena < 50000 THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_adena');
    END IF;
    v_data := v_data || jsonb_build_object('adenas', v_adena - 50000);
    UPDATE public.characters SET data = v_data, updated_at = NOW() WHERE char_name = v_char;
    INSERT INTO public.clans (name, tag, logo, leader_name, level, min_level, description)
    VALUES (v_name, v_tag, v_logo, v_char, 1, v_ml, NULLIF(v_desc, ''))
    RETURNING id INTO v_clan_id;
    INSERT INTO public.clan_members (clan_id, char_name) VALUES (v_clan_id, v_char);
    RETURN jsonb_build_object('success', true, 'clan_id', v_clan_id, 'adenas', (v_data->>'adenas')::BIGINT);
END;
$$;

DROP FUNCTION IF EXISTS public.apply_to_clan_secure(UUID);
DROP FUNCTION IF EXISTS public.apply_to_clan_secure(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.apply_to_clan_secure(
    p_clan_id UUID,
    p_char_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_char TEXT;
    v_level INTEGER;
    c RECORD;
BEGIN
    IF p_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_clan');
    END IF;

    IF p_char_name IS NOT NULL AND trim(p_char_name) <> '' THEN
        SELECT ch.char_name, ch.level INTO v_char, v_level
        FROM public.characters ch
        WHERE ch.user_id = auth.uid()
          AND lower(ch.char_name) = lower(trim(p_char_name))
        LIMIT 1;
    ELSE
        SELECT ch.char_name, ch.level INTO v_char, v_level
        FROM public.characters ch
        WHERE ch.user_id = auth.uid()
        LIMIT 1;
    END IF;

    IF v_char IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    IF EXISTS (SELECT 1 FROM public.clan_members m WHERE m.char_name = v_char) THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_in_clan');
    END IF;

    SELECT * INTO c FROM public.clans WHERE id = p_clan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'clan_not_found');
    END IF;

    IF v_level < c.min_level THEN
        RETURN jsonb_build_object('success', false, 'error', 'level_too_low');
    END IF;

    IF (SELECT COUNT(*)::INT FROM public.clan_members m WHERE m.clan_id = p_clan_id) >= 40 THEN
        RETURN jsonb_build_object('success', false, 'error', 'clan_full');
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.clan_applications a
        WHERE a.clan_id = p_clan_id AND a.char_name = v_char AND a.status = 'pending'
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'duplicate_application');
    END IF;

    WITH ins AS (
        INSERT INTO public.clan_applications (clan_id, char_name, status)
        VALUES (p_clan_id, v_char, 'pending')
        RETURNING id AS app_id
    )
    INSERT INTO public.mailbox (recipient_name, sender_name, subject, type, details)
    SELECT lm.char_name, 'System', 'New Clan Application', 'clan',
           jsonb_build_object('nome', v_char, 'nivel', v_level, 'application_id', ins.app_id)
    FROM ins
    CROSS JOIN public.characters lm
    WHERE lower(lm.char_name) = lower(trim(c.leader_name))
    LIMIT 1;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_clan_application_secure(p_application_id UUID, p_accept BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leader TEXT;
    app RECORD;
    c RECORD;
    v_applicant_level INTEGER;
    v_cnt INTEGER;
BEGIN
    IF p_application_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_application');
    END IF;
    SELECT ch.char_name INTO v_leader FROM public.characters ch WHERE ch.user_id = auth.uid() LIMIT 1;
    IF v_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    SELECT * INTO app FROM public.clan_applications WHERE id = p_application_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'application_not_found');
    END IF;
    IF app.status IS DISTINCT FROM 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'application_not_pending');
    END IF;
    SELECT * INTO c FROM public.clans WHERE id = app.clan_id;
    IF NOT FOUND OR c.leader_name IS DISTINCT FROM v_leader THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;
    IF NOT p_accept THEN
        UPDATE public.clan_applications SET status = 'rejected' WHERE id = p_application_id;
        RETURN jsonb_build_object('success', true, 'accepted', false);
    END IF;
    IF EXISTS (SELECT 1 FROM public.clan_members m WHERE m.char_name = app.char_name) THEN
        UPDATE public.clan_applications SET status = 'rejected' WHERE id = p_application_id;
        RETURN jsonb_build_object('success', false, 'error', 'applicant_already_in_clan');
    END IF;
    SELECT level INTO v_applicant_level FROM public.characters WHERE char_name = app.char_name;
    IF NOT FOUND OR v_applicant_level < c.min_level THEN
        UPDATE public.clan_applications SET status = 'rejected' WHERE id = p_application_id;
        RETURN jsonb_build_object('success', false, 'error', 'applicant_level_too_low');
    END IF;
    SELECT COUNT(*)::INT INTO v_cnt FROM public.clan_members m WHERE m.clan_id = c.id;
    IF v_cnt >= 40 THEN
        RETURN jsonb_build_object('success', false, 'error', 'clan_full');
    END IF;
    INSERT INTO public.clan_members (clan_id, char_name) VALUES (c.id, app.char_name);
    DELETE FROM public.clan_applications WHERE id = p_application_id;
    PERFORM public.send_mail_secure(
        app.char_name, 'Clan Application Accepted', 'clan',
        jsonb_build_object('clanNome', c.name, 'clanSigla', c.tag)
    );
    RETURN jsonb_build_object('success', true, 'accepted', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_clan_secure(p_clan_id UUID, p_target_char_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller TEXT;
    v_target TEXT;
    v_clan RECORD;
    v_cnt INTEGER;
BEGIN
    IF p_clan_id IS NULL OR p_target_char_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_args');
    END IF;
    SELECT ch.char_name INTO v_caller FROM public.characters ch WHERE ch.user_id = auth.uid() LIMIT 1;
    IF v_caller IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    v_target := trim(p_target_char_name);
    SELECT * INTO v_clan FROM public.clans WHERE id = p_clan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'clan_not_found');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.clan_members m WHERE m.clan_id = p_clan_id AND m.char_name = v_target) THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_member');
    END IF;
    IF v_target = v_caller THEN
        IF v_clan.leader_name = v_caller THEN
            SELECT COUNT(*)::INT INTO v_cnt FROM public.clan_members m WHERE m.clan_id = p_clan_id;
            IF v_cnt > 1 THEN
                RETURN jsonb_build_object('success', false, 'error', 'leader_cannot_leave');
            END IF;
            DELETE FROM public.clan_members WHERE clan_id = p_clan_id AND char_name = v_caller;
            DELETE FROM public.clans WHERE id = p_clan_id;
            RETURN jsonb_build_object('success', true);
        END IF;
        DELETE FROM public.clan_members WHERE clan_id = p_clan_id AND char_name = v_caller;
        RETURN jsonb_build_object('success', true);
    END IF;
    IF v_clan.leader_name IS DISTINCT FROM v_caller THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;
    IF v_target = v_clan.leader_name THEN
        RETURN jsonb_build_object('success', false, 'error', 'cannot_kick_leader');
    END IF;
    DELETE FROM public.clan_members WHERE clan_id = p_clan_id AND char_name = v_target;
    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.dissolve_clan_secure(p_clan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leader TEXT;
BEGIN
    IF p_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_clan');
    END IF;
    SELECT ch.char_name INTO v_leader FROM public.characters ch WHERE ch.user_id = auth.uid() LIMIT 1;
    IF v_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.clans cl WHERE cl.id = p_clan_id AND cl.leader_name = v_leader) THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;
    DELETE FROM public.clans WHERE id = p_clan_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_clan_settings_secure(p_clan_id UUID, p_patch JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leader TEXT;
    v_clan RECORD;
    v_ml INTEGER;
    v_logo TEXT;
    v_desc TEXT;
BEGIN
    IF p_clan_id IS NULL OR p_patch IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_args');
    END IF;
    SELECT ch.char_name INTO v_leader FROM public.characters ch WHERE ch.user_id = auth.uid() LIMIT 1;
    IF v_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    SELECT * INTO v_clan FROM public.clans WHERE id = p_clan_id;
    IF NOT FOUND OR v_clan.leader_name IS DISTINCT FROM v_leader THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;
    IF p_patch ? 'min_level' THEN
        v_ml := (p_patch->>'min_level')::INTEGER;
        v_ml := GREATEST(1, LEAST(COALESCE(v_ml, v_clan.min_level), 85));
        UPDATE public.clans SET min_level = v_ml WHERE id = p_clan_id;
    END IF;
    IF p_patch ? 'logo' THEN
        v_logo := NULLIF(trim(p_patch->>'logo'), '');
        IF v_logo IS NOT NULL THEN
            IF length(v_logo) > 32 THEN
                RETURN jsonb_build_object('success', false, 'error', 'invalid_logo');
            END IF;
            UPDATE public.clans SET logo = v_logo WHERE id = p_clan_id;
        END IF;
    END IF;
    IF p_patch ? 'description' THEN
        v_desc := trim(COALESCE(p_patch->>'description', ''));
        IF length(v_desc) > 200 THEN
            RETURN jsonb_build_object('success', false, 'error', 'description_too_long');
        END IF;
        UPDATE public.clans SET description = NULLIF(v_desc, '') WHERE id = p_clan_id;
    END IF;
    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.upgrade_clan_level_secure(p_clan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leader TEXT;
    v_data JSONB;
    v_clan RECORD;
    v_adena BIGINT;
    v_cost BIGINT;
    v_lvl INTEGER;
BEGIN
    IF p_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_clan');
    END IF;
    SELECT ch.char_name, ch.data INTO v_leader, v_data
    FROM public.characters ch WHERE ch.user_id = auth.uid() LIMIT 1;
    IF v_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;
    SELECT * INTO v_clan FROM public.clans WHERE id = p_clan_id;
    IF NOT FOUND OR v_clan.leader_name IS DISTINCT FROM v_leader THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;
    v_lvl := COALESCE(v_clan.level, 1);
    IF v_lvl >= 5 THEN
        RETURN jsonb_build_object('success', false, 'error', 'max_clan_level');
    END IF;
    v_cost := CASE v_lvl
        WHEN 1 THEN 100000::BIGINT WHEN 2 THEN 250000::BIGINT
        WHEN 3 THEN 500000::BIGINT WHEN 4 THEN 1000000::BIGINT ELSE NULL END;
    IF v_cost IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'max_clan_level');
    END IF;
    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0::BIGINT);
    IF v_adena < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_adena', 'need', v_cost);
    END IF;
    v_data := v_data || jsonb_build_object('adenas', v_adena - v_cost);
    UPDATE public.characters SET data = v_data, updated_at = NOW() WHERE char_name = v_leader;
    UPDATE public.clans SET level = v_lvl + 1 WHERE id = p_clan_id;
    RETURN jsonb_build_object('success', true, 'level', v_lvl + 1, 'adenas', (v_data->>'adenas')::BIGINT);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_clan_secure(TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_to_clan_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_clan_application_secure(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_clan_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dissolve_clan_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_clan_settings_secure(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_clan_level_secure(UUID) TO authenticated;

-- ========================================================
-- 5C. ASCENS�O ? RESGATE SEMANAL (recompensa no JSONB)
-- Mesmo conte�do que supabase_ascension_weekly_claim.sql
-- Deploy / QA: .cursor/rules/l2mini-project-rules.mdc �13.1
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

    -- Mesmo bucket semanal que o cliente (ensureWeekRollover / register_elite_champion_kill_secure)
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

-- ========================================================
-- 5D. ASCENS�O ? REGISTRO DE ABATE DE CAMPE�O (JSONB, autoritativo)
-- Incrementa weeklyChampionKills / lifetimeChampionKills no servidor.
-- c_sgrade = SGRADE_LEVEL; c_weekly_cap = WEEKLY_CHAMP_KILL_CAP em js/endgame_pursuits.js
-- Deploy / QA: .cursor/rules/l2mini-project-rules.mdc �13.1
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


-- ========================================================
-- 5E. CRAFT VESPER / EPICO (JSONB) ? mirror supabase_craft_item_secure.sql
-- ========================================================

CREATE OR REPLACE FUNCTION public.craft_item_secure(p_recipe_id TEXT, p_choice_id_base TEXT DEFAULT NULL)

RETURNS JSONB

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS $$

DECLARE

    v_char TEXT;

    v_data JSONB;

    v_inv JSONB;

    v_adena BIGINT;

    v_coin BIGINT;

    v_ing JSONB;

    v_tipo_out TEXT;

    v_id_out TEXT;

    v_uid TEXT;

    v_prefix TEXT;

    v_eq JSONB;

    v_el JSONB;

    v_mid TEXT;

    v_mq BIGINT;

    v_cur BIGINT;

    v_new BIGINT;

    v_i INTEGER;

    v_allowed BOOLEAN;

    v_choice TEXT;

BEGIN

    IF p_recipe_id IS NULL OR length(trim(p_recipe_id)) < 3 THEN

        RETURN jsonb_build_object('success', false, 'error', 'invalid_recipe');

    END IF;



    SELECT c.char_name, c.data INTO v_char, v_data

    FROM public.characters c

    WHERE c.user_id = auth.uid()

    LIMIT 1;



    IF v_char IS NULL THEN

        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');

    END IF;



    v_inv := COALESCE(v_data->'inventario', '{}'::jsonb);

    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0::BIGINT);

    v_coin := COALESCE((v_data->>'ancientCoins')::BIGINT, 0::BIGINT);



    v_choice := NULLIF(trim(COALESCE(p_choice_id_base, '')), '');



    CASE trim(p_recipe_id)

        WHEN 'rec_vesper_heavy' THEN

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Recipe: Vesper Noble Heavy', 'qtd', 1),

                jsonb_build_object('id', 'Ancient Coin', 'qtd', 1400),

                jsonb_build_object('id', 'Adena', 'qtd', 2800000),

                jsonb_build_object('id', 'Steel', 'qtd', 420),

                jsonb_build_object('id', 'Iron Ore', 'qtd', 5200),

                jsonb_build_object('id', 'Coal', 'qtd', 2800),

                jsonb_build_object('id', 'Life Stone', 'qtd', 12)

            );

            v_tipo_out := 'armor';

            v_id_out := 'arm_s_vesper_heavy';

        WHEN 'rec_vesper_light' THEN

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Recipe: Vesper Noble Light', 'qtd', 1),

                jsonb_build_object('id', 'Ancient Coin', 'qtd', 1400),

                jsonb_build_object('id', 'Adena', 'qtd', 2800000),

                jsonb_build_object('id', 'Leather', 'qtd', 420),

                jsonb_build_object('id', 'Animal Skin', 'qtd', 5200),

                jsonb_build_object('id', 'Animal Bone', 'qtd', 2800),

                jsonb_build_object('id', 'Life Stone', 'qtd', 12)

            );

            v_tipo_out := 'armor';

            v_id_out := 'arm_s_vesper_light';

        WHEN 'rec_vesper_robe' THEN

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Recipe: Vesper Noble Robe', 'qtd', 1),

                jsonb_build_object('id', 'Ancient Coin', 'qtd', 1400),

                jsonb_build_object('id', 'Adena', 'qtd', 2800000),

                jsonb_build_object('id', 'Cokes', 'qtd', 350),

                jsonb_build_object('id', 'Charcoal', 'qtd', 5200),

                jsonb_build_object('id', 'Coal', 'qtd', 2800),

                jsonb_build_object('id', 'Life Stone', 'qtd', 12)

            );

            v_tipo_out := 'armor';

            v_id_out := 'arm_s_vesper_robe';

        WHEN 'rec_vesper_weapon_unified' THEN

            IF v_choice IS NULL THEN

                RETURN jsonb_build_object('success', false, 'error', 'missing_choice');

            END IF;

            v_allowed := v_choice IN (

                'wpn_s_vesper_cutter', 'wpn_s_vesper_shaper', 'wpn_s_vesper_thrower',

                'wpn_s_vesper_fighter', 'wpn_s_vesper_avenger', 'wpn_s_vesper_buster'

            );

            IF NOT v_allowed THEN

                RETURN jsonb_build_object('success', false, 'error', 'invalid_choice');

            END IF;

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Recipe: Vesper Weapon', 'qtd', 1),

                jsonb_build_object('id', 'Ancient Coin', 'qtd', 2400),

                jsonb_build_object('id', 'Adena', 'qtd', 5800000),

                jsonb_build_object('id', 'Steel', 'qtd', 950),

                jsonb_build_object('id', 'Iron Ore', 'qtd', 5500),

                jsonb_build_object('id', 'Coal', 'qtd', 4200),

                jsonb_build_object('id', 'Charcoal', 'qtd', 3800),

                jsonb_build_object('id', 'Life Stone', 'qtd', 24)

            );

            v_tipo_out := 'weapon';

            v_id_out := v_choice;

        WHEN 'rec_vesper_jewel_unified' THEN

            IF v_choice IS NULL THEN

                RETURN jsonb_build_object('success', false, 'error', 'missing_choice');

            END IF;

            v_allowed := v_choice IN ('j_vesper_neck', 'j_vesper_ear', 'j_vesper_ring');

            IF NOT v_allowed THEN

                RETURN jsonb_build_object('success', false, 'error', 'invalid_choice');

            END IF;

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Recipe: Vesper Jewel', 'qtd', 1),

                jsonb_build_object('id', 'Ancient Coin', 'qtd', 1450),

                jsonb_build_object('id', 'Adena', 'qtd', 3400000),

                jsonb_build_object('id', 'Steel', 'qtd', 480),

                jsonb_build_object('id', 'Cokes', 'qtd', 260),

                jsonb_build_object('id', 'Leather', 'qtd', 380),

                jsonb_build_object('id', 'Animal Bone', 'qtd', 4200),

                jsonb_build_object('id', 'Life Stone', 'qtd', 30)

            );

            v_tipo_out := 'jewel';

            v_id_out := v_choice;

        WHEN 'rec_epic_antharas' THEN

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Fragment of Antharas', 'qtd', 130),

                jsonb_build_object('id', 'Ancient Coin', 'qtd', 3400),

                jsonb_build_object('id', 'Adena', 'qtd', 5500000),

                jsonb_build_object('id', 'Steel', 'qtd', 400),

                jsonb_build_object('id', 'Cokes', 'qtd', 120)

            );

            v_tipo_out := 'jewel';

            v_id_out := 'j_epic_antharas';

        WHEN 'rec_mint_ancient_coin' THEN

            v_ing := jsonb_build_array(

                jsonb_build_object('id', 'Adena', 'qtd', 5000000)

            );

            v_tipo_out := 'material';

            v_id_out := 'Ancient Coin';

        ELSE

            v_ing := NULL;

    END CASE;



    IF v_ing IS NULL THEN

        RETURN jsonb_build_object('success', false, 'error', 'invalid_recipe');

    END IF;



    -- Verificar stock (sem consumir ainda)

    FOR v_i IN 0 .. jsonb_array_length(v_ing) - 1 LOOP

        v_el := v_ing->v_i;

        v_mid := v_el->>'id';

        v_mq := COALESCE((v_el->>'qtd')::BIGINT, 0::BIGINT);

        IF v_mq <= 0 THEN

            CONTINUE;

        END IF;

        IF v_mid = 'Adena' THEN

            IF v_adena < v_mq THEN

                RETURN jsonb_build_object('success', false, 'error', 'insufficient_materials');

            END IF;

        ELSIF v_mid = 'Ancient Coin' THEN

            IF v_coin < v_mq THEN

                RETURN jsonb_build_object('success', false, 'error', 'insufficient_materials');

            END IF;

        ELSE

            v_cur := COALESCE((v_inv->>v_mid)::BIGINT, 0::BIGINT);

            IF v_cur < v_mq THEN

                RETURN jsonb_build_object('success', false, 'error', 'insufficient_materials');

            END IF;

        END IF;

    END LOOP;



    -- Debitar

    FOR v_i IN 0 .. jsonb_array_length(v_ing) - 1 LOOP

        v_el := v_ing->v_i;

        v_mid := v_el->>'id';

        v_mq := COALESCE((v_el->>'qtd')::BIGINT, 0::BIGINT);

        IF v_mq <= 0 THEN

            CONTINUE;

        END IF;

        IF v_mid = 'Adena' THEN

            v_adena := v_adena - v_mq;

        ELSIF v_mid = 'Ancient Coin' THEN

            v_coin := v_coin - v_mq;

        ELSE

            v_cur := COALESCE((v_inv->>v_mid)::BIGINT, 0::BIGINT);

            v_new := v_cur - v_mq;

            IF v_new <= 0 THEN

                v_inv := v_inv - v_mid;

            ELSE

                v_inv := jsonb_set(v_inv, ARRAY[v_mid], to_jsonb(v_new), true);

            END IF;

        END IF;

    END LOOP;



    IF trim(p_recipe_id) = 'rec_mint_ancient_coin' THEN

        v_data := v_data || jsonb_build_object(

            'inventario', v_inv,

            'adenas', v_adena,

            'ancientCoins', v_coin

        );

        IF (random() * 100.0) >= 10.0 THEN

            UPDATE public.characters

            SET data = v_data, updated_at = NOW()

            WHERE char_name = v_char;

            RETURN jsonb_build_object(

                'success', false,

                'error', 'mint_failed',

                'adenas', v_adena,

                'ancientCoins', v_coin,

                'inventario', v_inv

            );

        END IF;

        v_coin := v_coin + 1;

        v_data := v_data || jsonb_build_object(

            'inventario', v_inv,

            'adenas', v_adena,

            'ancientCoins', v_coin

        );

        UPDATE public.characters

        SET data = v_data, updated_at = NOW()

        WHERE char_name = v_char;

        RETURN jsonb_build_object(

            'success', true,

            'adenas', v_adena,

            'ancientCoins', v_coin,

            'inventario', v_inv,

            'id_base_crafted', 'Ancient Coin',

            'tipo_crafted', 'material'

        );

    END IF;



    v_prefix := CASE

        WHEN v_tipo_out = 'weapon' THEN 'WPN'

        WHEN v_tipo_out = 'armor' THEN 'ARM'

        ELSE 'JWL'

    END;

    v_uid := v_prefix || '-' || (FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000))::BIGINT::TEXT || '-' ||

             SUBSTR(MD5(RANDOM()::TEXT), 1, 6) || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 6);



    v_eq := COALESCE(v_data->'inventarioEquips', '[]'::jsonb);

    v_eq := v_eq || jsonb_build_array(

        jsonb_build_object(

            'uid', v_uid,

            'tipo', v_tipo_out,

            'base', jsonb_build_object('id', v_id_out),

            'enchant', 0,

            'origin', 'Craft'

        )

    );



    v_data := v_data || jsonb_build_object(

        'inventario', v_inv,

        'adenas', v_adena,

        'ancientCoins', v_coin,

        'inventarioEquips', v_eq

    );



    UPDATE public.characters

    SET data = v_data, updated_at = NOW()

    WHERE char_name = v_char;



    RETURN jsonb_build_object(

        'success', true,

        'adenas', v_adena,

        'ancientCoins', v_coin,

        'inventario', v_inv,

        'inventarioEquips', v_eq,

        'id_base_crafted', v_id_out,

        'tipo_crafted', v_tipo_out,

        'uid_crafted', v_uid

    );

END;

$$;



GRANT EXECUTE ON FUNCTION public.craft_item_secure(TEXT, TEXT) TO authenticated;



-- ========================================================
-- 5F. AUGMENT ARMA (JSONB) ? mirror supabase_augment_weapon_secure.sql
-- (Conte�do duplicado do ficheiro modular na raiz; manter em sincronia.)
-- ========================================================

CREATE OR REPLACE FUNCTION public.augment_weapon_secure(p_item_uid TEXT, p_stone_name TEXT DEFAULT 'Life Stone')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_char TEXT;
    v_data JSONB;
    v_inv JSONB;
    v_adena BIGINT;
    v_coin BIGINT;
    v_eq JSONB;
    v_uid TEXT;
    v_stone TEXT;
    v_cost_adena BIGINT := 5000;
    v_cost_stone BIGINT := 1;
    v_cost_coin BIGINT := 5;
    v_elem JSONB;
    v_merged JSONB;
    v_slot TEXT := '';
    v_idx INT := -1;
    v_i INT;
    v_tipo TEXT;
    v_sub TEXT;
    v_is_wpn BOOLEAN;
    v_augmented BOOLEAN;
    v_aug_prev INT;
    v_r DOUBLE PRECISION;
    v_aug_level INT;
    v_mult INT;
    v_p1 TEXT;
    v_l1 TEXT;
    v_p2 TEXT;
    v_l2 TEXT;
    v_v1 BIGINT;
    v_v2 BIGINT;
    v_ls BIGINT;
    v_new BIGINT;
BEGIN
    v_uid := NULLIF(trim(COALESCE(p_item_uid, '')), '');
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_uid');
    END IF;

    v_stone := lower(trim(COALESCE(p_stone_name, 'Life Stone')));
    IF v_stone IS NULL OR v_stone <> 'life stone' THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_stone');
    END IF;

    SELECT c.char_name, c.data INTO v_char, v_data
    FROM public.characters c
    WHERE c.user_id = auth.uid()
    LIMIT 1;

    IF v_char IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    v_inv := COALESCE(v_data->'inventario', '{}'::jsonb);
    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0::BIGINT);
    v_coin := COALESCE((v_data->>'ancientCoins')::BIGINT, 0::BIGINT);
    v_eq := COALESCE(v_data->'inventarioEquips', '[]'::jsonb);

    IF v_adena < v_cost_adena OR v_coin < v_cost_coin THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_materials');
    END IF;

    v_ls := COALESCE((v_inv->>'Life Stone')::BIGINT, 0::BIGINT);
    IF v_ls < v_cost_stone THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_materials');
    END IF;

    IF v_data ? 'armaEquipadaBase' AND jsonb_typeof(v_data->'armaEquipadaBase') = 'object'
       AND COALESCE(v_data->'armaEquipadaBase'->>'uid', '') = v_uid THEN
        v_slot := 'equipped';
        v_elem := v_data->'armaEquipadaBase';
    ELSE
        FOR v_i IN 0 .. COALESCE(jsonb_array_length(v_eq), 0) - 1 LOOP
            IF COALESCE(v_eq->v_i->>'uid', '') = v_uid THEN
                v_slot := 'bag';
                v_idx := v_i;
                v_elem := v_eq->v_i;
                EXIT;
            END IF;
        END LOOP;
    END IF;

    IF v_slot = '' OR v_elem IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'weapon_not_found');
    END IF;

    v_tipo := COALESCE(v_elem->>'tipo', '');
    v_sub := COALESCE(v_elem->'base'->>'tipoItem', v_elem->'base'->>'tipo', '');
    v_is_wpn := (v_tipo = 'weapon')
        OR (v_sub IN ('Sword', 'Dagger', 'Bow', 'Fist', 'Mace', 'Magic Sword', 'weapon'));

    IF NOT v_is_wpn THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_weapon');
    END IF;

    v_augmented := COALESCE((v_elem->>'augmented')::BOOLEAN, false);
    v_aug_prev := COALESCE((v_elem->>'augLevel')::INT, 0);
    IF v_augmented OR v_aug_prev > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'already_augmented');
    END IF;

    v_adena := v_adena - v_cost_adena;
    v_coin := v_coin - v_cost_coin;
    v_new := v_ls - v_cost_stone;
    IF v_new <= 0 THEN
        v_inv := v_inv - 'Life Stone';
    ELSE
        v_inv := jsonb_set(v_inv, ARRAY['Life Stone'], to_jsonb(v_new), true);
    END IF;

    v_r := random() * 100::DOUBLE PRECISION;
    IF v_r <= 50 THEN
        v_aug_level := 1;
    ELSIF v_r <= 80 THEN
        v_aug_level := 2;
    ELSIF v_r <= 93 THEN
        v_aug_level := 3;
    ELSIF v_r <= 98 THEN
        v_aug_level := 4;
    ELSE
        v_aug_level := 5;
    END IF;
    v_mult := v_aug_level;

    SELECT s.prop, s.lbl INTO v_p1, v_l1
    FROM (
        VALUES
            ('augPAtk', 'P. Atk'),
            ('augMAtk', 'M. Atk'),
            ('augPDef', 'P. Def'),
            ('augMDef', 'M. Def'),
            ('augSpd', 'Speed'),
            ('augCrit', 'Crit Rate')
    ) AS s(prop, lbl)
    ORDER BY random()
    LIMIT 1;

    SELECT s.prop, s.lbl INTO v_p2, v_l2
    FROM (
        VALUES
            ('augPAtk', 'P. Atk'),
            ('augMAtk', 'M. Atk'),
            ('augPDef', 'P. Def'),
            ('augMDef', 'M. Def'),
            ('augSpd', 'Speed'),
            ('augCrit', 'Crit Rate')
    ) AS s(prop, lbl)
    WHERE s.prop <> v_p1
    ORDER BY random()
    LIMIT 1;

    IF v_p1 IN ('augPAtk', 'augMAtk') THEN
        v_v1 := floor(random() * (15 * v_mult))::BIGINT + (5 * v_mult);
    ELSIF v_p1 IN ('augPDef', 'augMDef') THEN
        v_v1 := floor(random() * (10 * v_mult))::BIGINT + (5 * v_mult);
    ELSIF v_p1 = 'augSpd' THEN
        v_v1 := floor(random() * (20 * v_mult))::BIGINT + (10 * v_mult);
    ELSE
        v_v1 := floor(random() * (2 * v_mult))::BIGINT + (1 * v_mult);
    END IF;

    IF v_p2 IN ('augPAtk', 'augMAtk') THEN
        v_v2 := floor(random() * (15 * v_mult))::BIGINT + (5 * v_mult);
    ELSIF v_p2 IN ('augPDef', 'augMDef') THEN
        v_v2 := floor(random() * (10 * v_mult))::BIGINT + (5 * v_mult);
    ELSIF v_p2 = 'augSpd' THEN
        v_v2 := floor(random() * (20 * v_mult))::BIGINT + (10 * v_mult);
    ELSE
        v_v2 := floor(random() * (2 * v_mult))::BIGINT + (1 * v_mult);
    END IF;

    v_merged := v_elem
        || jsonb_build_object(
            'augmented', true,
            'augLevel', v_aug_level,
            'augPAtk', CASE WHEN v_p1 = 'augPAtk' THEN v_v1 WHEN v_p2 = 'augPAtk' THEN v_v2 ELSE 0 END,
            'augMAtk', CASE WHEN v_p1 = 'augMAtk' THEN v_v1 WHEN v_p2 = 'augMAtk' THEN v_v2 ELSE 0 END,
            'augPDef', CASE WHEN v_p1 = 'augPDef' THEN v_v1 WHEN v_p2 = 'augPDef' THEN v_v2 ELSE 0 END,
            'augMDef', CASE WHEN v_p1 = 'augMDef' THEN v_v1 WHEN v_p2 = 'augMDef' THEN v_v2 ELSE 0 END,
            'augSpd', CASE WHEN v_p1 = 'augSpd' THEN v_v1 WHEN v_p2 = 'augSpd' THEN v_v2 ELSE 0 END,
            'augCrit', CASE WHEN v_p1 = 'augCrit' THEN v_v1 WHEN v_p2 = 'augCrit' THEN v_v2 ELSE 0 END
        );

    IF v_slot = 'bag' THEN
        v_eq := jsonb_set(v_eq, ARRAY[v_idx::TEXT], v_merged, true);
        v_data := v_data || jsonb_build_object('inventarioEquips', v_eq);
    ELSE
        v_data := jsonb_set(v_data, '{armaEquipadaBase}', v_merged, true);
        v_eq := COALESCE(v_data->'inventarioEquips', '[]'::jsonb);
    END IF;

    v_data := v_data || jsonb_build_object(
        'inventario', v_inv,
        'adenas', v_adena,
        'ancientCoins', v_coin
    );

    UPDATE public.characters
    SET data = v_data, updated_at = NOW()
    WHERE char_name = v_char;

    RETURN jsonb_build_object(
        'success', true,
        'aug_level', v_aug_level,
        'stat1', jsonb_build_object('prop', v_p1, 'txt', v_l1, 'val', v_v1),
        'stat2', jsonb_build_object('prop', v_p2, 'txt', v_l2, 'val', v_v2),
        'adenas', v_adena,
        'ancientCoins', v_coin,
        'inventario', v_inv,
        'inventarioEquips', v_eq,
        'armaEquipadaBase', COALESCE(v_data->'armaEquipadaBase', 'null'::JSONB),
        'item_updated', v_merged
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.augment_weapon_secure(TEXT, TEXT) TO authenticated;

-- 5F2. ENCHANT ITEM (JSONB): aplicar supabase_enchant_item_secure.sql no SQL Editor ?
--     CREATE OR REPLACE public.enchant_item_secure + GRANT (conte�do espelhado na raiz do repo).


-- ========================================================
-- 5G. NPC GROCER / SCROLLS ? npc_shop_buy_stackable (espelho supabase_npc_shop_buy_stackable.sql)
-- ========================================================
CREATE OR REPLACE FUNCTION public.npc_shop_buy_stackable(
    p_char_name TEXT,
    p_item_id TEXT,
    p_qty BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_char TEXT;
    v_level INT;
    v_data JSONB;
    v_base BIGINT;
    v_currency TEXT;
    v_inv_key TEXT;
    v_mult NUMERIC;
    v_unit BIGINT;
    v_total BIGINT;
    v_adena BIGINT;
    v_coin BIGINT;
    v_inv JSONB;
    v_cur_qty BIGINT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
    END IF;

    SELECT c.char_name, c.level, c.data
    INTO v_char, v_level, v_data
    FROM public.characters c
    WHERE lower(c.char_name) = lower(trim(p_char_name))
      AND c.user_id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'character_not_found');
    END IF;

    IF p_qty IS NULL OR p_qty < 1 OR p_qty > 9999 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_qty');
    END IF;

    SELECT t.base_price, t.currency, t.inv_key
    INTO v_base, v_currency, v_inv_key
    FROM (
        VALUES
            ('pot_hp', 58::BIGINT, 'adena', 'HP Potion'),
            ('pot_mp', 58::BIGINT, 'adena', 'Mana Potion'),
            ('shot_ng', 6::BIGINT, 'adena', 'Soulshot (NG)'),
            ('bshot_ng', 6::BIGINT, 'adena', 'B. Spiritshot (NG)'),
            ('ls_1', 78::BIGINT, 'ancient', 'Life Stone'),
            ('sc_w_ng', 1120::BIGINT, 'adena', 'Enchant Weapon (NG)'),
            ('sc_a_ng', 335::BIGINT, 'adena', 'Enchant Armor (NG)'),
            ('sc_bw_ng', 2::BIGINT, 'ancient', 'Blessed Enchant Weapon (NG)'),
            ('sc_ba_ng', 1::BIGINT, 'ancient', 'Blessed Enchant Armor (NG)'),
            ('sc_w_d', 5600::BIGINT, 'adena', 'Enchant Weapon (D)'),
            ('sc_bw_d', 6::BIGINT, 'ancient', 'Blessed Enchant Weapon (D)'),
            ('sc_a_d', 1680::BIGINT, 'adena', 'Enchant Armor (D)'),
            ('sc_ba_d', 3::BIGINT, 'ancient', 'Blessed Enchant Armor (D)'),
            ('sc_w_c', 22400::BIGINT, 'adena', 'Enchant Weapon (C)'),
            ('sc_bw_c', 17::BIGINT, 'ancient', 'Blessed Enchant Weapon (C)'),
            ('sc_a_c', 6720::BIGINT, 'adena', 'Enchant Armor (C)'),
            ('sc_ba_c', 7::BIGINT, 'ancient', 'Blessed Enchant Armor (C)'),
            ('sc_w_b', 112000::BIGINT, 'adena', 'Enchant Weapon (B)'),
            ('sc_bw_b', 56::BIGINT, 'ancient', 'Blessed Enchant Weapon (B)'),
            ('sc_a_b', 33600::BIGINT, 'adena', 'Enchant Armor (B)'),
            ('sc_ba_b', 22::BIGINT, 'ancient', 'Blessed Enchant Armor (B)'),
            ('sc_w_a', 560000::BIGINT, 'adena', 'Enchant Weapon (A)'),
            ('sc_bw_a', 168::BIGINT, 'ancient', 'Blessed Enchant Weapon (A)'),
            ('sc_a_a', 168000::BIGINT, 'adena', 'Enchant Armor (A)'),
            ('sc_ba_a', 68::BIGINT, 'ancient', 'Blessed Enchant Armor (A)'),
            ('sc_w_s', 2240000::BIGINT, 'adena', 'Enchant Weapon (S)'),
            ('sc_bw_s', 560::BIGINT, 'ancient', 'Blessed Enchant Weapon (S)'),
            ('sc_a_s', 672000::BIGINT, 'adena', 'Enchant Armor (S)'),
            ('sc_ba_s', 224::BIGINT, 'ancient', 'Blessed Enchant Armor (S)')
    ) AS t(item_id, base_price, currency, inv_key)
    WHERE t.item_id = trim(p_item_id);

    IF v_base IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'unknown_item');
    END IF;

    v_level := GREATEST(1, LEAST(85, COALESCE(v_level, 1)));
    v_mult := LEAST(2.35::NUMERIC, 1::NUMERIC + GREATEST(0, v_level - 1) * 0.018);
    v_unit := GREATEST(1, ceil(v_base * v_mult)::BIGINT);
    v_total := v_unit * p_qty;

    v_adena := COALESCE((v_data->>'adenas')::BIGINT, 0);
    v_coin := COALESCE((v_data->>'ancientCoins')::BIGINT, 0);

    IF v_currency = 'ancient' THEN
        IF v_coin < v_total THEN
            RETURN jsonb_build_object('ok', false, 'error', 'insufficient_funds');
        END IF;
        v_coin := v_coin - v_total;
    ELSE
        IF v_adena < v_total THEN
            RETURN jsonb_build_object('ok', false, 'error', 'insufficient_funds');
        END IF;
        v_adena := v_adena - v_total;
    END IF;

    v_inv := COALESCE(v_data->'inventario', '{}'::JSONB);
    v_cur_qty := COALESCE((v_inv->>v_inv_key)::BIGINT, 0);
    v_inv := jsonb_set(v_inv, ARRAY[v_inv_key], to_jsonb(v_cur_qty + p_qty), true);

    v_data := v_data || jsonb_build_object(
        'adenas', v_adena,
        'ancientCoins', v_coin,
        'inventario', v_inv
    );

    UPDATE public.characters
    SET data = v_data, updated_at = NOW()
    WHERE char_name = v_char;

    RETURN jsonb_build_object(
        'ok', true,
        'adenas', v_adena,
        'ancient_coins', v_coin,
        'item_name', v_inv_key,
        'qty_after', v_cur_qty + p_qty
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.npc_shop_buy_stackable(TEXT, TEXT, BIGINT) TO authenticated;


-- ========================================================
-- 5H. GM + LOOT MOB (espelho supabase_gm_set_character_level.sql / supabase_validate_mob_loot_secure.sql)
-- ========================================================

CREATE OR REPLACE FUNCTION public.gm_set_character_level(
    p_char_name TEXT,
    p_level INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_access INT;
    v_canon TEXT;
    v_level INT;
    v_data JSONB;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
    END IF;

    SELECT COALESCE(p.access_level, 0) INTO v_access
    FROM public.profiles p
    WHERE p.id = v_uid;

    IF COALESCE(v_access, 0) < 1 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_gm');
    END IF;

    IF p_char_name IS NULL OR length(trim(p_char_name)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'error', 'invalid_char_name');
    END IF;

    v_level := GREATEST(1, LEAST(999, COALESCE(p_level, 1)));

    SELECT c.char_name, c.data
    INTO v_canon, v_data
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_char_name))
    FOR UPDATE;

    IF NOT FOUND OR v_canon IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'character_not_found');
    END IF;

    v_data := COALESCE(v_data, '{}'::jsonb);
    v_data := v_data || jsonb_build_object('nivel', v_level, 'xpAtual', 0);

    UPDATE public.characters
    SET level = v_level, data = v_data, updated_at = NOW()
    WHERE char_name = v_canon;

    RETURN jsonb_build_object('ok', true, 'char_name', v_canon, 'level', v_level);
END;
$$;

GRANT EXECUTE ON FUNCTION public.gm_set_character_level(TEXT, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.validate_mob_loot_secure(
    p_char_name TEXT,
    p_mob_instance_id TEXT,
    p_zone_name TEXT,
    p_is_champion BOOLEAN,
    p_spoil BOOLEAN,
    p_mob_level INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_char_level INT;
    v_mob_level INT;
    v_chance DOUBLE PRECISION;
    v_base_coins INT;
    v_ancient INT;
    v_zone TEXT;
    v_recipe TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    IF p_char_name IS NULL OR length(trim(p_char_name)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_char_name');
    END IF;

    SELECT c.level INTO v_char_level
    FROM public.characters c
    WHERE lower(trim(c.char_name)) = lower(trim(p_char_name))
      AND c.user_id = v_uid
    LIMIT 1;

    IF v_char_level IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    v_mob_level := GREATEST(1, COALESCE(p_mob_level, 1));

    IF (v_char_level - v_mob_level) >= 20 THEN
        RETURN jsonb_build_object('success', true, 'ancient_coins', 0);
    END IF;

    v_chance := CASE WHEN COALESCE(p_spoil, false) THEN 7.0 ELSE 3.5 END;
    v_ancient := 0;

    IF (random() * 100.0) <= v_chance THEN
        v_zone := lower(trim(COALESCE(p_zone_name, '')));
        v_base_coins := 1;
        IF v_zone LIKE '%d-grade%' OR v_zone LIKE '% d %' OR v_zone LIKE '%(d)%' THEN
            v_base_coins := 2;
        ELSIF v_zone LIKE '%c-grade%' OR v_zone LIKE '% c %' THEN
            v_base_coins := 5;
        ELSIF v_zone LIKE '%b-grade%' OR v_zone LIKE '% b %' THEN
            v_base_coins := 10;
        ELSIF v_zone LIKE '%a-grade%' OR v_zone LIKE '% a %' THEN
            v_base_coins := 22;
        ELSIF v_zone LIKE '%s-grade%' OR v_zone LIKE '% s %' THEN
            v_base_coins := 52;
        END IF;
        v_ancient := CASE WHEN COALESCE(p_is_champion, false) THEN v_base_coins * 2 ELSE v_base_coins END;
    END IF;

    v_recipe := NULL;
    IF COALESCE(p_is_champion, false) AND (random() * 100.0) <= 0.35 THEN
        v_recipe := (ARRAY['Recipe: D-Grade Weapon', 'Recipe: C-Grade Armor', 'Recipe: B-Grade Weapon'])[
            1 + floor(random() * 3)::INT
        ];
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'ancient_coins', v_ancient,
        'recipe_dropped', v_recipe
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_mob_loot_secure(TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, INTEGER) TO authenticated;


-- ========================================================
-- 6. HABILITAR REALTIME
-- ========================================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clan_chat_messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.clan_chat_messages; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'global_chat_messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mailbox') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.mailbox; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'market_listings') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.market_listings; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rewards') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards; END IF;
END $$;

-- 7. INSERIR CASTELOS INICIAIS
INSERT INTO public.castles (id, name) VALUES 
('gludio', 'Gludio Castle'), ('dion', 'Dion Castle'), ('giran', 'Giran Castle'), ('oren', 'Oren Castle'), ('aden', 'Aden Castle'), ('innadril', 'Heine Castle'), ('goddard', 'Goddard Castle'), ('rune', 'Rune Castle'), ('schuttgart', 'Schuttgart Castle')
ON CONFLICT (id) DO NOTHING;


-- ========================================================
-- 8. Auth ? profiles (confirma��o de e-mail sem sess�o no cliente)
-- ========================================================
-- Aplique tamb�m: supabase_auth_profile_trigger.sql (fun��o + trigger em auth.users).
