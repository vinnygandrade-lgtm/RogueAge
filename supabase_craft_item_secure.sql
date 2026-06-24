-- ========================================================
-- L2 MINI — Craft Vesper / épico (autoridade no JSONB)
-- Ingredientes e ids de receita: manter alinhados a js/db_items.js (catalogoReceitas.special).
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
