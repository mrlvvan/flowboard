-- Migration: Enable Supabase Realtime on core tables + add is_starred to boards
-- Safe to run multiple times (idempotent).

-- ─── 1. REPLICA IDENTITY ──────────────────────────────────────────────────────
-- Required for Realtime to broadcast full row data (old + new) on UPDATE/DELETE.
ALTER TABLE public.boards   REPLICA IDENTITY FULL;
ALTER TABLE public.columns  REPLICA IDENTITY FULL;
ALTER TABLE public.cards    REPLICA IDENTITY FULL;

-- ─── 2. REALTIME PUBLICATION ──────────────────────────────────────────────────
-- Add tables to the supabase_realtime publication if not already there.
DO $$
BEGIN
  -- boards
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'boards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
  END IF;

  -- columns
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'columns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.columns;
  END IF;

  -- cards
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cards;
  END IF;
END $$;

-- ─── 3. ADD is_starred TO boards ──────────────────────────────────────────────
ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;
