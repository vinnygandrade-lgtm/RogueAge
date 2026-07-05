-- ========================================================
-- RogueAge — Augment de arma (autoridade no JSONB)
-- Custos e RNG alinhados a js/ui_enchant.js (executarAugment).
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
    v_slot TEXT := ''; -- 'bag' | 'equipped'
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

    -- Equipada?
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

    -- Débito
    v_adena := v_adena - v_cost_adena;
    v_coin := v_coin - v_cost_coin;
    v_new := v_ls - v_cost_stone;
    IF v_new <= 0 THEN
        v_inv := v_inv - 'Life Stone';
    ELSE
        v_inv := jsonb_set(v_inv, ARRAY['Life Stone'], to_jsonb(v_new), true);
    END IF;

    -- RNG nível (igual ao cliente)
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

    -- Dois stats distintos
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

    -- Rolagens de valor (espelho ui_enchant.js)
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
