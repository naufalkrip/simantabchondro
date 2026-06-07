-- ============================================================
-- Migration: Add indexes to transactions table for performance
-- 
-- Masalah: Query filter type/status/date pada tabel transactions
-- melakukan full table scan karena tidak ada index, menyebabkan
-- halaman Setoran dan Penarikan loading >1 menit.
-- ============================================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);

-- Composite indexes untuk query pattern yang paling sering digunakan:
-- WHERE type='setoran' AND status='pending' ORDER BY date DESC
CREATE INDEX IF NOT EXISTS idx_transactions_type_status_date ON public.transactions(type, status, date DESC);

-- Untuk query riwayat per member
CREATE INDEX IF NOT EXISTS idx_transactions_member_id_date ON public.transactions(member_id, date DESC);
