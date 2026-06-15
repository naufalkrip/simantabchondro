-- Migration: Add finance_reports table + report_id to finance

-- 1. Create finance_reports table
CREATE TABLE IF NOT EXISTS public.finance_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add report_id column to finance table
ALTER TABLE public.finance ADD COLUMN IF NOT EXISTS report_id uuid REFERENCES public.finance_reports(id) ON DELETE CASCADE;

-- 3. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_finance_report_id ON public.finance(report_id);

-- 4. RLS for finance_reports
ALTER TABLE public.finance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on finance_reports" ON public.finance_reports;
CREATE POLICY "Allow all on finance_reports" ON public.finance_reports FOR ALL USING (true);
