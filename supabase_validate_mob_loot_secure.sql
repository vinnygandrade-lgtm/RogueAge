-- RogueAge — Loot de mob (bridge opcional; cliente mantém fallback local)
-- Espelhado em supabase_MASTER_SETUP.sql secção 5H.

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
