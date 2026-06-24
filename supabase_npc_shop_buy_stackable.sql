-- NPC Grocer / Scrolls — compra de stackables (autoridade servidor)
-- Preços base e nomes de inventário devem manter-se alinhados a js/db_items.js e js/economy_balance.js
-- (coef. nível 0.018, cap 2.35; preço unitário = ceil(base * mult), mínimo 1)

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
