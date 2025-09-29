-- Users Table
CREATE TABLE users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    email TEXT UNIQUE,
    role TEXT,
    status TEXT
);

-- Marketplace Stores Table
CREATE TABLE marketplace_stores (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    marketplace_name TEXT,
    store_name TEXT,
    platform TEXT
);

-- Backlog Items Table
CREATE TABLE backlog_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    store_name TEXT,
    payment_accepted BIGINT,
    marketplace TEXT
);

-- Daily Performance Table
CREATE TABLE daily_performance (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE,
    month TEXT,
    name TEXT,
    task_daily INTEGER,
    total_items INTEGER,
    job_desc TEXT,
    shift TEXT,
    target INTEGER,
    target_item INTEGER,
    task_performance INTEGER,
    items_performance INTEGER,
    result TEXT
);

-- Admin Tasks Table
CREATE TABLE admin_tasks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date TIMESTAMPTZ DEFAULT NOW(),
    name TEXT,
    job TEXT,
    shift TEXT,
    status TEXT
);

-- Putaway Documents Table
CREATE TABLE putaway_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    no_document TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    qty INTEGER,
    status TEXT,
    sku TEXT,
    barcode TEXT,
    brand TEXT,
    exp_date DATE,
    location TEXT,
    check_by TEXT
);

-- Return Documents Table
CREATE TABLE return_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date TIMESTAMPTZ DEFAULT NOW(),
    nodocument TEXT,
    qty INTEGER,
    status TEXT,
    sku TEXT,
    barcode TEXT,
    brand TEXT,
    location TEXT,
    reason TEXT,
    receivedby TEXT
);

-- Menu Permissions Table
CREATE TABLE menu_permissions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id BIGINT,
    menu_href TEXT,
    is_accessible BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, menu_href)
);

-- Log Activity Table
CREATE TABLE log_activity (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_name TEXT,
    user_email TEXT,
    action TEXT,
    details TEXT
);

-- Master Products Table
CREATE TABLE master_products (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT NOT NULL,
  brand TEXT
);

-- Locations Table
CREATE TABLE locations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL
);

-- Product Out Documents Table (for goods issue)
CREATE TABLE product_out_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nodocument TEXT NOT NULL,
    sku TEXT NOT NULL,
    barcode TEXT NOT NULL,
    expdate DATE NOT NULL,
    location TEXT NOT NULL,
    qty INTEGER NOT NULL,
    status TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    validatedby TEXT,
    packer_name TEXT,
    order_reference TEXT,
    shipping_status TEXT,
    weight NUMERIC
);

-- Manual Orders Table
CREATE TABLE manual_orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    reference TEXT UNIQUE NOT NULL,
    sku TEXT NOT NULL,
    status TEXT,
    order_date TIMESTAMPTZ,
    customer TEXT,
    city TEXT,
    address TEXT,
    phone TEXT,
    type TEXT,
    from_source TEXT, -- Renamed from 'from'
    delivery_type TEXT,
    qty INTEGER
);

-- Waves Table
CREATE TABLE waves (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    wave_document_number TEXT UNIQUE NOT NULL,
    wave_type TEXT,
    status TEXT NOT NULL,
    total_orders INTEGER,
    created_by TEXT
);

-- Wave Orders Table
CREATE TABLE wave_orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    wave_id BIGINT REFERENCES waves(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL,
    order_reference TEXT NOT NULL,
    sku TEXT NOT NULL,
    qty INTEGER NOT NULL,
    customer TEXT,
    city TEXT,
    order_date TIMESTAMPTZ,
    type TEXT,
    from_source TEXT, -- Renamed from 'from'
    delivery_type TEXT,
    address TEXT,
    phone TEXT
);

-- Inbound Documents Table
CREATE TABLE inbound_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reference TEXT,
    date TIMESTAMPTZ,
    received_by TEXT,
    sku TEXT,
    barcode TEXT,
    brand TEXT,
    exp_date DATE,
    qty INTEGER,
    main_status TEXT
);

-- Cycle Count Documents Table
CREATE TABLE cycle_count_docs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    no_doc TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    counter_name TEXT,
    count_type TEXT,
    items_to_count TEXT,
    status TEXT,
    notes TEXT
);

-- Rename 'from' column to 'from_source' in manual_orders
ALTER TABLE manual_orders RENAME COLUMN "from" TO from_source;

-- Rename 'from' column to 'from_source' in wave_orders
ALTER TABLE wave_orders RENAME COLUMN "from" TO from_source;
