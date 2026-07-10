-- Global chat persistence (offline history on login)
-- Apply in Supabase SQL Editor; mirrored in supabase_MASTER_SETUP.sql

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

ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read global chat" ON public.global_chat_messages;
CREATE POLICY "Authenticated read global chat"
    ON public.global_chat_messages FOR SELECT TO authenticated
    USING (true);

-- Player messages (auth → characters.char_name, validated)
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

    IF v_char_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

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

-- GM / staff system announcements
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
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level > 0
    ) THEN
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

GRANT EXECUTE ON FUNCTION public.insert_global_chat_secure(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_global_chat_system_secure(TEXT, TEXT, TEXT, JSONB) TO authenticated;

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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'global_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;
    END IF;
END $$;
