-- RogueAge — Reward Hub (tabela + RLS)
-- Espelhado em supabase_MASTER_SETUP.sql secções 2 e 4.

CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    char_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    sender TEXT DEFAULT 'System',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rewards_char_unclaimed ON public.rewards (lower(char_name)) WHERE claimed = FALSE;

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipients_select_own_rewards" ON public.rewards;
CREATE POLICY "recipients_select_own_rewards" ON public.rewards FOR SELECT USING (
    claimed = FALSE
    AND lower(char_name) IN (SELECT lower(char_name) FROM public.characters WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "recipients_update_own_rewards" ON public.rewards;
CREATE POLICY "recipients_update_own_rewards" ON public.rewards FOR UPDATE
USING (lower(char_name) IN (SELECT lower(char_name) FROM public.characters WHERE user_id = auth.uid()))
WITH CHECK (lower(char_name) IN (SELECT lower(char_name) FROM public.characters WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "gm_insert_rewards" ON public.rewards;
CREATE POLICY "gm_insert_rewards" ON public.rewards FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND access_level > 0)
);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rewards'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;
    END IF;
END $$;
