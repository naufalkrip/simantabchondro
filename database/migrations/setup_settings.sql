-- Create settings table for Bank Info and Activity Categories
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Setup RLS (Allow all for simplicity, or restricted to authenticated)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid errors when re-running
DROP POLICY IF EXISTS "Enable read access for all users" ON public.settings;
DROP POLICY IF EXISTS "Enable write access for all users" ON public.settings;

CREATE POLICY "Enable read access for all users" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Enable write access for all users" ON public.settings FOR ALL USING (true);

-- Enable Realtime
-- First check if table is already in publication before adding to avoid errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  END IF;
END
$$;

-- Insert default data
INSERT INTO public.settings (key, value)
VALUES 
  ('bank_info', '{"bankName": "BCA", "accountNumber": "1234567890", "accountHolder": "ADMIN SIMANTAB"}'::jsonb),
  ('activity_categories', '["Latihan Rutin", "Tampilan Parade", "Rapat Pengurus"]'::jsonb)
ON CONFLICT (key) DO NOTHING;
