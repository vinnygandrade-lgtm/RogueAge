-- RogueAge — GM: alterar nível de personagem (contorna RLS em contas alheias)
-- Espelhado em supabase_MASTER_SETUP.sql secção 5H.
-- Requer: public.profiles.access_level > 0

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
