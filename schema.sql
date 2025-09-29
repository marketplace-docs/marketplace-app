
-- Tabel untuk menyimpan log aktivitas pengguna
CREATE TABLE IF NOT EXISTS log_activity (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT
);

-- Tabel untuk menyimpan data pengguna
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- Tabel untuk hak akses menu per pengguna
CREATE TABLE IF NOT EXISTS menu_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    menu_href VARCHAR(255) NOT NULL,
    is_accessible BOOLEAN NOT-NULL DEFAULT true,
    UNIQUE(user_id, menu_href)
);

-- Tabel untuk tugas admin (manpower)
CREATE TABLE IF NOT EXISTS admin_tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    job VARCHAR(100),
    shift VARCHAR(50),
    status VARCHAR(50),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk master produk
CREATE TABLE IF NOT EXISTS master_products (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sku VARCHAR(255) UNIQUE NOT NULL,
    barcode VARCHAR(255) UNIQUE,
    brand VARCHAR(255)
);

-- Tabel untuk dokumen putaway (penerimaan barang ke lokasi)
CREATE TABLE IF NOT EXISTS putaway_documents (
    id SERIAL PRIMARY KEY,
    no_document VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    qty INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    sku VARCHAR(255),
    barcode VARCHAR(255),
    brand VARCHAR(255),
    exp_date DATE,
    location VARCHAR(100),
    check_by VARCHAR(255)
);

-- Tabel untuk item backlog marketplace
CREATE TABLE IF NOT EXISTS backlog_items (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    store_name VARCHAR(255),
    payment_accepted INTEGER,
    marketplace VARCHAR(100)
);

-- Tabel untuk toko di marketplace
CREATE TABLE IF NOT EXISTS marketplace_stores (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    marketplace_name VARCHAR(255),
    store_name VARCHAR(255) UNIQUE,
    platform VARCHAR(100)
);

-- Tabel untuk dokumen retur
CREATE TABLE IF NOT EXISTS return_documents (
    id SERIAL PRIMARY KEY,
    nodocument VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    qty INTEGER,
    status VARCHAR(50),
    sku VARCHAR(255),
    barcode VARCHAR(255),
    brand VARCHAR(255),
    location VARCHAR(100),
    reason TEXT,
    receivedby VARCHAR(255)
);

-- Tabel untuk data kinerja harian
CREATE TABLE IF NOT EXISTS daily_performance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    month VARCHAR(20),
    name VARCHAR(255),
    task_daily INTEGER,
    total_items INTEGER,
    job_desc VARCHAR(50),
    shift VARCHAR(20),
    target INTEGER,
    target_item INTEGER,
    task_performance INTEGER,
    items_performance INTEGER,
    result VARCHAR(20)
);

-- Tabel untuk master lokasi
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk pesanan manual (sebelum masuk wave)
CREATE TABLE IF NOT EXISTS manual_orders (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'Payment Accepted',
    order_date TIMESTAMP WITH TIME ZONE,
    customer VARCHAR(255),
    city VARCHAR(100),
    type VARCHAR(100),
    "from" VARCHAR(100),
    delivery_type VARCHAR(50),
    address TEXT,
    phone VARCHAR(50)
);

-- Tabel untuk Waves (gelombang picking)
CREATE TABLE IF NOT EXISTS waves (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    wave_document_number VARCHAR(255) UNIQUE NOT NULL,
    wave_type VARCHAR(50),
    status VARCHAR(50),
    total_orders INTEGER,
    created_by VARCHAR(255)
);

-- Tabel untuk pesanan di dalam wave
CREATE TABLE IF NOT EXISTS wave_orders (
    id SERIAL PRIMARY KEY,
    wave_id INTEGER REFERENCES waves(id) ON DELETE CASCADE,
    order_id BIGINT,
    order_reference VARCHAR(255),
    sku VARCHAR(255),
    qty INTEGER,
    customer VARCHAR(255),
    city VARCHAR(100),
    order_date TIMESTAMP WITH TIME ZONE,
    type VARCHAR(100),
    "from" VARCHAR(100),
    delivery_type VARCHAR(50),
    address TEXT,
    phone VARCHAR(50)
);

-- Tabel untuk dokumen barang keluar (termasuk picking, adjustment, dll)
CREATE TABLE IF NOT EXISTS product_out_documents (
    id SERIAL PRIMARY KEY,
    nodocument VARCHAR(255),
    sku VARCHAR(255),
    barcode VARCHAR(255),
    expdate DATE,
    location VARCHAR(100),
    qty INTEGER,
    status VARCHAR(100),
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    validatedby VARCHAR(255),
    packer_name VARCHAR(255),
    order_reference VARCHAR(255),
    shipping_status VARCHAR(50),
    weight NUMERIC(10, 2)
);

-- Tabel untuk dokumen cycle count
CREATE TABLE IF NOT EXISTS cycle_count_docs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    no_doc VARCHAR(255) UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE,
    counter_name VARCHAR(255),
    count_type VARCHAR(50),
    items_to_count TEXT,
    status VARCHAR(50),
    notes TEXT
);

-- Tabel untuk dokumen Inbound (Penerimaan Barang Awal)
CREATE TABLE IF NOT EXISTS inbound_documents (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(255),
    date TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(255),
    sku VARCHAR(255),
    barcode VARCHAR(255),
    brand VARCHAR(255),
    exp_date DATE,
    qty INTEGER,
    main_status VARCHAR(50)
);

-- Function to decrement total_orders in waves table
CREATE OR REPLACE FUNCTION decrement_wave_orders()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE waves
  SET total_orders = total_orders - 1
  WHERE id = OLD.wave_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function after a row is deleted from wave_orders
CREATE TRIGGER wave_orders_decrement_trigger
AFTER DELETE ON wave_orders
FOR EACH ROW
EXECUTE FUNCTION decrement_wave_orders();

