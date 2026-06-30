-- ========================================================
-- L2 MINI — Encantamento de equipamento (autoridade JSONB)
-- Chances e custos alinhados a js/ui_enchant.js (executarEnchant, modo local).
-- ========================================================

CREATE OR REPLACE FUNCTION public.enchant_item_secure(
    p_char_name TEXT,
    p_item_uid TEXT,
    p_scroll_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth UUID;
    v_char TEXT;
    v_data JSONB;
    v_inv JSONB;
    v_eq JSONB;
    v_uid TEXT;
    v_scroll TEXT;
    v_scroll_kind TEXT;
    v_scroll_grade TEXT;
    v_scroll_blessed BOOLEAN;
    v_loc TEXT := '';
    v_bag_idx INT := -1;
    v_i INT;
    v_elem JSONB;
    v_equip_grade TEXT;
    v_equip_tipo TEXT;
    v_lvl INT;
    v_chance INT;
    v_roll DOUBLE PRECISION;
    v_pass BOOLEAN;
    v_new_lvl INT;
    v_crystals BIGINT;
    v_sc BIGINT;
    v_wpn_enc INT;
    v_arm_enc INT;
    v_is_aug BOOLEAN;
    v_train JSONB;
BEGIN
    v_auth := auth.uid();
    IF v_auth IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
    END IF;

    v_uid := NULLIF(trim(COALESCE(p_item_uid, '')), '');
    v_scroll := NULLIF(trim(COALESCE(p_scroll_name, '')), '');
    IF v_uid IS NULL OR v_scroll IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_params');
    END IF;

    SELECT c.char_name, c.data
    INTO v_char, v_data
    FROM public.characters c
    WHERE lower(c.char_name) = lower(trim(p_char_name))
      AND c.user_id = v_auth
    FOR UPDATE;

    IF NOT FOUND OR v_char IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'character_not_found');
    END IF;

    SELECT t.sk, t.sg, t.sb
    INTO v_scroll_kind, v_scroll_grade, v_scroll_blessed
    FROM (
        VALUES
            ('Enchant Weapon (NG)', 'weapon', 'No-Grade', false),
            ('Enchant Armor (NG)', 'armor', 'No-Grade', false),
            ('Blessed Enchant Weapon (NG)', 'weapon', 'No-Grade', true),
            ('Blessed Enchant Armor (NG)', 'armor', 'No-Grade', true),
            ('Enchant Weapon (D)', 'weapon', 'D', false),
            ('Blessed Enchant Weapon (D)', 'weapon', 'D', true),
            ('Enchant Armor (D)', 'armor', 'D', false),
            ('Blessed Enchant Armor (D)', 'armor', 'D', true),
            ('Enchant Weapon (C)', 'weapon', 'C', false),
            ('Blessed Enchant Weapon (C)', 'weapon', 'C', true),
            ('Enchant Armor (C)', 'armor', 'C', false),
            ('Blessed Enchant Armor (C)', 'armor', 'C', true),
            ('Enchant Weapon (B)', 'weapon', 'B', false),
            ('Blessed Enchant Weapon (B)', 'weapon', 'B', true),
            ('Enchant Armor (B)', 'armor', 'B', false),
            ('Blessed Enchant Armor (B)', 'armor', 'B', true),
            ('Enchant Weapon (A)', 'weapon', 'A', false),
            ('Blessed Enchant Weapon (A)', 'weapon', 'A', true),
            ('Enchant Armor (A)', 'armor', 'A', false),
            ('Blessed Enchant Armor (A)', 'armor', 'A', true),
            ('Enchant Weapon (S)', 'weapon', 'S', false),
            ('Blessed Enchant Weapon (S)', 'weapon', 'S', true),
            ('Enchant Armor (S)', 'armor', 'S', false),
            ('Blessed Enchant Armor (S)', 'armor', 'S', true)
    ) AS t(sn, sk, sg, sb)
    WHERE t.sn = v_scroll;

    IF v_scroll_kind IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'unknown_scroll');
    END IF;

    v_inv := COALESCE(v_data->'inventario', '{}'::jsonb);
    v_sc := COALESCE((v_inv->>v_scroll)::BIGINT, 0::BIGINT);
    IF v_sc < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'no_scroll');
    END IF;

    v_eq := COALESCE(v_data->'inventarioEquips', '[]'::jsonb);

    IF v_data ? 'armaEquipadaBase' AND jsonb_typeof(v_data->'armaEquipadaBase') = 'object'
       AND COALESCE(v_data->'armaEquipadaBase'->>'uid', '') = v_uid THEN
        v_loc := 'arma';
        v_elem := v_data->'armaEquipadaBase';
    ELSIF v_data ? 'armaduraEquipada' AND jsonb_typeof(v_data->'armaduraEquipada') = 'object'
          AND COALESCE(v_data->'armaduraEquipada'->>'uid', '') = v_uid THEN
        v_loc := 'armor';
        v_elem := v_data->'armaduraEquipada';
    ELSIF v_data ? 'colarEquipado' AND jsonb_typeof(v_data->'colarEquipado') = 'object'
          AND COALESCE(v_data->'colarEquipado'->>'uid', '') = v_uid THEN
        v_loc := 'neck';
        v_elem := v_data->'colarEquipado';
    ELSIF v_data ? 'brincoEquipado1' AND jsonb_typeof(v_data->'brincoEquipado1') = 'object'
          AND COALESCE(v_data->'brincoEquipado1'->>'uid', '') = v_uid THEN
        v_loc := 'ear1';
        v_elem := v_data->'brincoEquipado1';
    ELSIF v_data ? 'brincoEquipado2' AND jsonb_typeof(v_data->'brincoEquipado2') = 'object'
          AND COALESCE(v_data->'brincoEquipado2'->>'uid', '') = v_uid THEN
        v_loc := 'ear2';
        v_elem := v_data->'brincoEquipado2';
    ELSIF v_data ? 'anelEquipado1' AND jsonb_typeof(v_data->'anelEquipado1') = 'object'
          AND COALESCE(v_data->'anelEquipado1'->>'uid', '') = v_uid THEN
        v_loc := 'ring1';
        v_elem := v_data->'anelEquipado1';
    ELSIF v_data ? 'anelEquipado2' AND jsonb_typeof(v_data->'anelEquipado2') = 'object'
          AND COALESCE(v_data->'anelEquipado2'->>'uid', '') = v_uid THEN
        v_loc := 'ring2';
        v_elem := v_data->'anelEquipado2';
    ELSE
        FOR v_i IN 0 .. COALESCE(jsonb_array_length(v_eq), 0) - 1 LOOP
            IF COALESCE(v_eq->v_i->>'uid', '') = v_uid THEN
                v_loc := 'bag';
                v_bag_idx := v_i;
                v_elem := v_eq->v_i;
                EXIT;
            END IF;
        END LOOP;
    END IF;

    IF v_loc = '' OR v_elem IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'item_not_found');
    END IF;

    v_equip_grade := COALESCE(v_elem->'base'->>'grade', 'No-Grade');
    v_equip_tipo := lower(trim(COALESCE(v_elem->>'tipo', '')));

    IF v_scroll_grade IS DISTINCT FROM v_equip_grade THEN
        RETURN jsonb_build_object('success', false, 'error', 'scroll_mismatch');
    END IF;

    IF v_scroll_kind = 'weapon' AND v_equip_tipo <> 'weapon' THEN
        RETURN jsonb_build_object('success', false, 'error', 'scroll_mismatch');
    END IF;

    IF v_scroll_kind = 'armor' AND v_equip_tipo NOT IN ('armor', 'jewel') THEN
        RETURN jsonb_build_object('success', false, 'error', 'scroll_mismatch');
    END IF;

    v_lvl := COALESCE(
        NULLIF(v_elem->>'enchant', '')::INT,
        NULLIF(v_elem->'base'->>'enchant', '')::INT,
        NULLIF(v_elem->>'enchantJewel', '')::INT,
        NULLIF(v_elem->>'enchantArmor', '')::INT,
        0
    );

    IF v_lvl >= 25 THEN
        RETURN jsonb_build_object('success', false, 'error', 'max_enchant');
    END IF;

    -- Consome o pergaminho (tentativa)
    v_sc := v_sc - 1;
    IF v_sc <= 0 THEN
        v_inv := v_inv - v_scroll;
    ELSE
        v_inv := jsonb_set(v_inv, ARRAY[v_scroll], to_jsonb(v_sc), true);
    END IF;

    -- Curva de sucesso (igual ao cliente; +0..+2 = 100%)
    IF v_lvl < 3 THEN
        v_chance := 100;
    ELSE
        v_chance := (ARRAY[66, 63, 60, 57, 54, 51, 48, 45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 8, 4, 1])[
            GREATEST(1, LEAST(22, v_lvl - 2))
        ];
    END IF;

    v_roll := random() * 100.0;
    v_pass := (v_roll <= v_chance::DOUBLE PRECISION);

    IF v_pass THEN
        v_new_lvl := v_lvl + 1;
        v_elem := jsonb_set(v_elem, '{enchant}', to_jsonb(v_new_lvl), true);
        IF v_elem ? 'base' AND jsonb_typeof(v_elem->'base') = 'object' THEN
            v_elem := jsonb_set(
                v_elem,
                '{base}',
                jsonb_set(v_elem->'base', '{enchant}', to_jsonb(v_new_lvl), true),
                true
            );
        END IF;

        IF v_loc = 'bag' THEN
            v_eq := jsonb_set(v_eq, ARRAY[v_bag_idx::TEXT], v_elem, true);
            v_data := v_data || jsonb_build_object('inventarioEquips', v_eq);
        ELSIF v_loc = 'arma' THEN
            v_data := jsonb_set(v_data, '{armaEquipadaBase}', v_elem, true);
        ELSIF v_loc = 'armor' THEN
            v_data := jsonb_set(v_data, '{armaduraEquipada}', v_elem, true);
        ELSIF v_loc = 'neck' THEN
            v_data := jsonb_set(v_data, '{colarEquipado}', v_elem, true);
        ELSIF v_loc = 'ear1' THEN
            v_data := jsonb_set(v_data, '{brincoEquipado1}', v_elem, true);
        ELSIF v_loc = 'ear2' THEN
            v_data := jsonb_set(v_data, '{brincoEquipado2}', v_elem, true);
        ELSIF v_loc = 'ring1' THEN
            v_data := jsonb_set(v_data, '{anelEquipado1}', v_elem, true);
        ELSE
            v_data := jsonb_set(v_data, '{anelEquipado2}', v_elem, true);
        END IF;

        v_data := v_data || jsonb_build_object('inventario', v_inv);

        v_wpn_enc := COALESCE((v_data->'armaEquipadaBase'->>'enchant')::INT, 0);
        IF v_data->'armaEquipadaBase' IS NULL OR jsonb_typeof(COALESCE(v_data->'armaEquipadaBase', 'null'::jsonb)) = 'null' THEN
            v_wpn_enc := 0;
        END IF;
        v_arm_enc := COALESCE((v_data->'armaduraEquipada'->>'enchant')::INT, 0);
        v_is_aug := COALESCE((v_data->'armaEquipadaBase'->>'augmented')::BOOLEAN, false);
        v_data := v_data || jsonb_build_object(
            'enchant', v_wpn_enc,
            'enchantArmor', v_arm_enc,
            'isAugmented', v_is_aug
        );

        UPDATE public.characters
        SET data = v_data, updated_at = NOW()
        WHERE char_name = v_char;

        RETURN jsonb_build_object(
            'success', true,
            'enchant_success', true,
            'new_level', v_new_lvl,
            'crystallized', false,
            'crystals_gained', 0
        );
    END IF;

    -- Falha
    IF v_scroll_blessed THEN
        v_data := v_data || jsonb_build_object('inventario', v_inv);
        UPDATE public.characters
        SET data = v_data, updated_at = NOW()
        WHERE char_name = v_char;

        RETURN jsonb_build_object(
            'success', true,
            'enchant_success', false,
            'crystallized', false,
            'crystals_gained', 0,
            'new_level', v_lvl
        );
    END IF;

    -- Cristalizar
    v_crystals := (v_lvl::BIGINT * 10) + 50;
    v_inv := jsonb_set(
        v_inv,
        ARRAY['Crystals'],
        to_jsonb(COALESCE((v_inv->>'Crystals')::BIGINT, 0::BIGINT) + v_crystals),
        true
    );

    IF v_loc = 'bag' THEN
        SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb)
        INTO v_eq
        FROM jsonb_array_elements(v_eq) WITH ORDINALITY AS t(elem, ord)
        WHERE COALESCE(elem->>'uid', '') IS DISTINCT FROM v_uid;
        v_data := v_data || jsonb_build_object('inventarioEquips', v_eq);
    ELSE
        IF v_loc = 'arma' THEN
            v_data := jsonb_set(v_data, '{armaEquipadaBase}', 'null'::jsonb, true);
        ELSIF v_loc = 'armor' THEN
            v_data := v_data - 'armaduraEquipada';
        ELSIF v_loc = 'neck' THEN
            v_data := v_data - 'colarEquipado';
        ELSIF v_loc = 'ear1' THEN
            v_data := v_data - 'brincoEquipado1';
        ELSIF v_loc = 'ear2' THEN
            v_data := v_data - 'brincoEquipado2';
        ELSIF v_loc = 'ring1' THEN
            v_data := v_data - 'anelEquipado1';
        ELSE
            v_data := v_data - 'anelEquipado2';
        END IF;
    END IF;

    v_data := v_data || jsonb_build_object('inventario', v_inv);

    v_wpn_enc := COALESCE((v_data->'armaEquipadaBase'->>'enchant')::INT, 0);
    IF v_data->'armaEquipadaBase' IS NULL OR jsonb_typeof(COALESCE(v_data->'armaEquipadaBase', 'null'::jsonb)) = 'null' THEN
        v_wpn_enc := 0;
    END IF;
    v_arm_enc := COALESCE((v_data->'armaduraEquipada'->>'enchant')::INT, 0);
    v_is_aug := COALESCE((v_data->'armaEquipadaBase'->>'augmented')::BOOLEAN, false);
    v_data := v_data || jsonb_build_object(
        'enchant', v_wpn_enc,
        'enchantArmor', v_arm_enc,
        'isAugmented', v_is_aug
    );

    UPDATE public.characters
    SET data = v_data, updated_at = NOW()
    WHERE char_name = v_char;

    RETURN jsonb_build_object(
        'success', true,
        'enchant_success', false,
        'crystallized', true,
        'crystals_gained', v_crystals,
        'new_level', 0
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.enchant_item_secure(TEXT, TEXT, TEXT) TO authenticated;
