-- Tabel untuk pengguna
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
  is_accessible BOOLEAN NOT NULL DEFAULT true,
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

-- Tabel untuk item backlog
CREATE TABLE IF NOT EXISTS backlog_items (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    store_name VARCHAR(255) NOT NULL,
    payment_accepted BIGINT NOT NULL,
    marketplace VARCHAR(100) NOT NULL
);

-- Tabel untuk dokumen putaway
CREATE TABLE IF NOT EXISTS putaway_documents (
    id BIGSERIAL PRIMARY KEY,
    no_document VARCHAR(255) UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    qty INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    exp_date DATE,
    location VARCHAR(255),
    check_by VARCHAR(255)
);

-- Tabel untuk dokumen retur
CREATE TABLE IF NOT EXISTS return_documents (
    id BIGSERIAL PRIMARY KEY,
    nodocument VARCHAR(255) UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    qty INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    location VARCHAR(255),
    reason TEXT,
    receivedby VARCHAR(255)
);

-- Tabel untuk toko marketplace
CREATE TABLE IF NOT EXISTS marketplace_stores (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    marketplace_name VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    platform VARCHAR(100) NOT NULL
);

-- Tabel untuk master produk
CREATE TABLE IF NOT EXISTS master_products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) UNIQUE NOT NULL,
  barcode VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk log aktivitas
CREATE TABLE IF NOT EXISTS log_activity (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT
);

-- Tabel untuk kinerja harian
CREATE TABLE IF NOT EXISTS daily_performance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    month VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    task_daily INTEGER NOT NULL,
    total_items INTEGER NOT NULL,
    job_desc VARCHAR(100) NOT NULL,
    shift VARCHAR(50) NOT NULL,
    target INTEGER NOT NULL,
    target_item INTEGER NOT NULL,
    task_performance INTEGER NOT NULL,
    items_performance INTEGER NOT NULL,
    result VARCHAR(50) NOT NULL
);

-- Tabel untuk lokasi
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk dokumen product out
CREATE TABLE IF NOT EXISTS product_out_documents (
    id BIGSERIAL PRIMARY KEY,
    nodocument VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL,
    expdate DATE NOT NULL,
    location VARCHAR(255),
    qty INTEGER NOT NULL,
    status VARCHAR(100) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    validatedby VARCHAR(255),
    packer_name VARCHAR(255),
    order_reference VARCHAR(255),
    shipping_status VARCHAR(50),
    weight NUMERIC(10, 2)
);

-- Tabel untuk pesanan manual
CREATE TABLE IF NOT EXISTS manual_orders (
    id BIGINT PRIMARY KEY,
    reference VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL,
    status VARCHAR(100) NOT NULL,
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    customer VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    type VARCHAR(100),
    from_store VARCHAR(255),
    delivery_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(50)
);

-- Tabel Waves (Gelombang Order)
CREATE TABLE IF NOT EXISTS waves (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    wave_document_number VARCHAR(255) UNIQUE NOT NULL,
    wave_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_orders INTEGER NOT NULL,
    created_by VARCHAR(255) NOT NULL
);

-- Tabel Wave Orders (Pesanan dalam Gelombang)
CREATE TABLE IF NOT EXISTS wave_orders (
    id SERIAL PRIMARY KEY,
    wave_id INTEGER REFERENCES waves(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL,
    order_reference VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL,
    customer VARCHAR(255),
    city VARCHAR(255),
    order_date TIMESTAMP WITH TIME ZONE,
    type VARCHAR(100),
    from_store VARCHAR(255),
    delivery_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(50)
);

-- Tabel untuk dokumen Cycle Count
CREATE TABLE IF NOT EXISTS cycle_count_docs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    no_doc VARCHAR(255) UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    counter_name VARCHAR(255) NOT NULL,
    count_type VARCHAR(100) NOT NULL,
    items_to_count TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);

-- Tabel untuk dokumen Inbound (Penerimaan Barang)
CREATE TABLE IF NOT EXISTS inbound_documents (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference VARCHAR(255) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    received_by VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    barcode VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    exp_date DATE NOT NULL,
    qty INTEGER NOT NULL,
    main_status VARCHAR(50) NOT NULL
);
