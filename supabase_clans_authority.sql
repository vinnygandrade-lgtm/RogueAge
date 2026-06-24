-- ========================================================
-- L2 MINI — Clan authority (RPCs + RLS)
-- Apply in Supabase SQL Editor after public.clans / clan_members / clan_applications exist.
-- Idempotent where possible.
-- ========================================================

-- Allow re-application after rejection: only one *pending* row per (clan, character).
ALTER TABLE public.clan_applications
    DROP CONSTRAINT IF EXISTS clan_applications_clan_id_char_name_key;

DROP INDEX IF EXISTS public.clan_applications_one_pending;

CREATE UNIQUE INDEX IF NOT EXISTS clan_applications_one_pending
    ON public.clan_applications (clan_id, char_name)
    WHERE status = 'pending';

-- RLS: applications readable by applicant or by leader of that clan
ALTER TABLE public.clan_applications ENABLE ROW LEVEL SECURITY;

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

-- No direct INSERT/UPDATE/DELETE for authenticated; use RPCs (SECURITY DEFINER).

-- ---------------------------------------------------------------------------
-- CREATE CLAN (50,000 Adena from character JSONB)
-- ---------------------------------------------------------------------------
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

    v_ml := COALESCE(p_min_level, 1);
    v_ml := GREATEST(1, LEAST(v_ml, 85));

    v_logo := COALESCE(NULLIF(trim(p_logo), ''), '🏰');
    IF length(v_logo) > 32 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_logo');
    END IF;

    v_desc := COALESCE(NULLIF(trim(p_description), ''), '');
    IF length(v_desc) > 200 THEN
        RETURN jsonb_build_object('success', false, 'error', 'description_too_long');
    END IF;

    SELECT c.char_name, c.data INTO v_char, v_data
    FROM public.characters c
    WHERE c.user_id = auth.uid()
    LIMIT 1;

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

    RETURN jsonb_build_object(
        'success', true,
        'clan_id', v_clan_id,
        'adenas', (v_data->>'adenas')::BIGINT
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- APPLY TO CLAN
-- ---------------------------------------------------------------------------
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

    -- Leader mail must include application_id so Accept/Decline from mailbox can call respond_clan_application_secure.
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

-- ---------------------------------------------------------------------------
-- RESPOND TO APPLICATION (leader only)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_clan_application_secure(
    p_application_id UUID,
    p_accept BOOLEAN
)
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

    SELECT ch.char_name INTO v_leader
    FROM public.characters ch
    WHERE ch.user_id = auth.uid()
    LIMIT 1;

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
        app.char_name,
        'Clan Application Accepted',
        'clan',
        jsonb_build_object('clanNome', c.name, 'clanSigla', c.tag)
    );

    RETURN jsonb_build_object('success', true, 'accepted', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- LEAVE OR KICK
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.leave_clan_secure(
    p_clan_id UUID,
    p_target_char_name TEXT
)
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

    SELECT ch.char_name INTO v_caller
    FROM public.characters ch
    WHERE ch.user_id = auth.uid()
    LIMIT 1;

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

-- ---------------------------------------------------------------------------
-- DISSOLVE CLAN (leader only, CASCADE cleanup)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dissolve_clan_secure(p_clan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leader TEXT;
    v_clan RECORD;
BEGIN
    IF p_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_clan');
    END IF;

    SELECT ch.char_name INTO v_leader
    FROM public.characters ch
    WHERE ch.user_id = auth.uid()
    LIMIT 1;

    IF v_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    SELECT * INTO v_clan FROM public.clans WHERE id = p_clan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'clan_not_found');
    END IF;

    IF v_clan.leader_name IS DISTINCT FROM v_leader THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;

    DELETE FROM public.clans WHERE id = p_clan_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- UPDATE SETTINGS (leader): min_level, logo, description — partial JSON patch
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_clan_settings_secure(
    p_clan_id UUID,
    p_patch JSONB
)
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

    SELECT ch.char_name INTO v_leader
    FROM public.characters ch
    WHERE ch.user_id = auth.uid()
    LIMIT 1;

    IF v_leader IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    SELECT * INTO v_clan FROM public.clans WHERE id = p_clan_id;
    IF NOT FOUND OR v_clan.leader_name IS DISTINCT FROM v_leader THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_leader');
    END IF;

    IF p_patch ? 'min_level' THEN
        v_ml := (p_patch->>'min_level')::INTEGER;
        IF v_ml IS NULL THEN
            v_ml := v_clan.min_level;
        ELSE
            v_ml := GREATEST(1, LEAST(v_ml, 85));
        END IF;
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
        v_desc := COALESCE(p_patch->>'description', '');
        v_desc := trim(v_desc);
        IF length(v_desc) > 200 THEN
            RETURN jsonb_build_object('success', false, 'error', 'description_too_long');
        END IF;
        UPDATE public.clans SET description = NULLIF(v_desc, '') WHERE id = p_clan_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- UPGRADE CLAN LEVEL (leader pays Adena; max level 5)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upgrade_clan_level_secure(p_clan_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_leader TEXT;
    v_clan RECORD;
    v_data JSONB;
    v_adena BIGINT;
    v_cost BIGINT;
    v_lvl INTEGER;
BEGIN
    IF p_clan_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_clan');
    END IF;

    SELECT ch.char_name, ch.data INTO v_leader, v_data
    FROM public.characters ch
    WHERE ch.user_id = auth.uid()
    LIMIT 1;

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
        WHEN 1 THEN 100000::BIGINT
        WHEN 2 THEN 250000::BIGINT
        WHEN 3 THEN 500000::BIGINT
        WHEN 4 THEN 1000000::BIGINT
        ELSE NULL
    END;

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

    RETURN jsonb_build_object(
        'success', true,
        'level', v_lvl + 1,
        'adenas', (v_data->>'adenas')::BIGINT
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_clan_secure(TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_to_clan_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_clan_application_secure(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_clan_secure(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dissolve_clan_secure(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_clan_settings_secure(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upgrade_clan_level_secure(UUID) TO authenticated;
