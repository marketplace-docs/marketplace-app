
-- Tabel untuk menyimpan setiap item yang masuk ke gudang melalui dokumen inbound.
-- Setiap baris merepresentasikan satu jenis item (SKU/batch) dalam sebuah dokumen penerimaan.

CREATE TABLE public.inbound_documents (
    id bigint NOT NULL DEFAULT nextval('inbound_documents_id_seq'::regclass),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    "reference" text NULL, -- Nomor referensi dokumen, misal: Nomor PO
    date timestamp with time zone NULL, -- Tanggal barang diterima
    received_by text NULL, -- Nama penerima
    sku text NULL,
    barcode text NULL,
    "name" text NULL, -- Nama produk
    brand text NULL,
    exp_date date NULL, -- Tanggal kedaluwarsa produk
    qty integer NULL,
    main_status text NULL, -- Status utama dari item ini, misal: 'Assign'
    CONSTRAINT inbound_documents_pkey PRIMARY KEY (id)
);

ALTER TABLE public.inbound_documents ENABLE ROW LEVEL SECURITY;

-- Memberikan akses penuh kepada service_role (digunakan oleh API server)
CREATE POLICY "Enable all access for service-role" ON public.inbound_documents FOR ALL
USING (true)
WITH CHECK (true);

-- Memberikan akses SELECT (baca) kepada pengguna yang sudah terautentikasi
CREATE POLICY "Enable read access for authenticated users" ON public.inbound_documents FOR SELECT
USING (auth.role() = 'authenticated');
