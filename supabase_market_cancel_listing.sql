-- Cancelar listagem ativa (vendedor = auth.uid() + personagem dono)
-- Marca sold=TRUE para sair do SELECT público (sold = FALSE); item devolvido no cliente.
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
