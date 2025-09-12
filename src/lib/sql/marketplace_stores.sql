-- 1. Hapus tabel yang lama (jika ada) untuk memastikan kita mulai dari awal
DROP TABLE IF EXISTS public.marketplace_stores;

-- 2. Buat tabel baru dengan struktur yang benar
CREATE TABLE public.marketplace_stores (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  marketplace_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Aktifkan Keamanan Tingkat Baris (Row Level Security)
ALTER TABLE public.marketplace_stores ENABLE ROW LEVEL SECURITY;

-- 4. Atur aturan (policy) agar data bisa diakses oleh aplikasi Anda
--    Policy ini mengizinkan siapa saja untuk membaca (SELECT) data.
CREATE POLICY "Allow public read access" ON public.marketplace_stores FOR SELECT USING (true);

--    Policy ini mengizinkan pengguna yang sudah login (authenticated) untuk melakukan semua aksi (INSERT, UPDATE, DELETE).
CREATE POLICY "Allow authenticated users to manage stores" ON public.marketplace_stores FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 5. Beri tahu Supabase tentang perubahan
NOTIFY pgrst, 'reload schema';
