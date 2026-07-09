-- RogueAge — Mercado: reivindicar proceeds de vendas (taxa 5% alinhada ao cliente)
-- Espelhado em supabase_MASTER_SETUP.sql (após market_cancel_listing).
-- Não credita characters.data — o cliente entrega via enviarMail (sale_proceeds).

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
