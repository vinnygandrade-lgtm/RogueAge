-- ========================================================
-- RogueAge — Ascensão: ledger auditável (append-only)
-- Cada RPC bem-sucedida de kill elite e de claim semanal insere uma linha.
-- Não prova combate no servidor; permite trilha temporal e ferramentas staff.
--
-- Deploy: executar ANTES de atualizar claim/register (§13.1 no GDD).
-- Idempotente: CREATE TABLE IF NOT EXISTS + políticas DROP/CREATE.
-- ========================================================

CREATE TABLE IF NOT EXISTS public.ascension_events (
    id BIGSERIAL PRIMARY KEY,
    char_name TEXT NOT NULL REFERENCES public.characters(char_name) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('elite_champion_kill', 'weekly_claim')),
    week_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ascension_events_char_week ON public.ascension_events(char_name, week_key);
CREATE INDEX IF NOT EXISTS idx_ascension_events_user_created ON public.ascension_events(user_id, created_at DESC);

ALTER TABLE public.ascension_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own ascension events" ON public.ascension_events;
CREATE POLICY "Users view own ascension events" ON public.ascension_events
    FOR SELECT
    USING (user_id::text = auth.uid()::text);

COMMENT ON TABLE public.ascension_events IS 'RogueAge — eventos de Ascensão (kill elite / claim semanal); escrita só via RPC SECURITY DEFINER.';
