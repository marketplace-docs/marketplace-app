-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    status TEXT
);

-- Marketplace Stores table
CREATE TABLE IF NOT EXISTS marketplace_stores (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    marketplace_name TEXT,
    store_name TEXT,
    platform TEXT
);

-- Backlog Items table
CREATE TABLE IF NOT EXISTS backlog_items (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    store_name TEXT,
    payment_accepted BIGINT,
    marketplace TEXT
);

-- Daily Performance table
CREATE TABLE IF NOT EXISTS daily_performance (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date DATE NOT NULL,
    month TEXT,
    name TEXT,
    task_daily INTEGER,
    total_items INTEGER,
    job_desc TEXT,
    shift TEXT,
    target INTEGER,
    target_item INTEGER,
    task_performance REAL,
    items_performance REAL,
    result TEXT
);

-- Admin Tasks table
CREATE TABLE IF NOT EXISTS admin_tasks (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT,
    job TEXT,
    shift TEXT,
    status TEXT
);

-- Putaway Documents table
CREATE TABLE IF NOT EXISTS putaway_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    no_document TEXT,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    qty INTEGER,
    status TEXT,
    sku TEXT,
    barcode TEXT,
    brand TEXT,
    exp_date DATE,
    location TEXT,
    check_by TEXT
);

-- Return Documents table
CREATE TABLE IF NOT EXISTS return_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nodocument TEXT,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    qty INTEGER,
    status TEXT,
    sku TEXT,
    barcode TEXT,
    brand TEXT,
    location TEXT,
    reason TEXT,
    receivedby TEXT
);

-- Menu Permissions table
CREATE TABLE IF NOT EXISTS menu_permissions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    menu_href TEXT NOT NULL,
    is_accessible BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE (user_id, menu_href)
);

-- Log Activity table
CREATE TABLE IF NOT EXISTS log_activity (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_name TEXT,
    user_email TEXT,
    action TEXT,
    details TEXT
);

-- Master Products table
CREATE TABLE IF NOT EXISTS master_products (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT NOT NULL,
    brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Out Documents table
CREATE TABLE IF NOT EXISTS product_out_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nodocument TEXT,
    sku TEXT,
    barcode TEXT,
    expdate DATE,
    location TEXT,
    qty INTEGER,
    status TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    validatedby TEXT,
    packer_name TEXT,
    order_reference TEXT,
    shipping_status TEXT,
    weight REAL
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT UNIQUE NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inbound Documents table
CREATE TABLE IF NOT EXISTS inbound_documents (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reference TEXT,
    date TIMESTAMPTZ,
    received_by TEXT,
    sku TEXT,
    barcode TEXT,
    brand TEXT,
    exp_date DATE,
    qty INTEGER,
    main_status TEXT DEFAULT 'Assign' NOT NULL
);

-- Manual Orders table
CREATE TABLE IF NOT EXISTS manual_orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    reference TEXT UNIQUE NOT NULL,
    sku TEXT,
    status TEXT,
    order_date TIMESTAMPTZ,
    customer TEXT,
    city TEXT,
    type TEXT,
    "from" TEXT,
    delivery_type TEXT,
    qty INTEGER,
    total_stock_on_hand INTEGER,
    location TEXT,
    address TEXT,
    phone TEXT
);

-- Waves table
CREATE TABLE IF NOT EXISTS waves (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    wave_document_number TEXT UNIQUE NOT NULL,
    wave_type TEXT,
    status TEXT,
    total_orders INTEGER,
    created_by TEXT
);

-- Wave Orders table
CREATE TABLE IF NOT EXISTS wave_orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    wave_id BIGINT NOT NULL REFERENCES waves(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL,
    order_reference TEXT NOT NULL,
    sku TEXT,
    qty INTEGER,
    customer TEXT,
    city TEXT,
    order_date TIMESTAMPTZ,
    type TEXT,
    "from" TEXT,
    delivery_type TEXT,
    address TEXT,
    phone TEXT
);

-- Cycle Count Documents table
CREATE TABLE IF NOT EXISTS cycle_count_docs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    no_doc TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    counter_name TEXT NOT NULL,
    count_type TEXT NOT NULL,
    items_to_count TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT
);

-- Function to decrement wave order count
CREATE OR REPLACE FUNCTION decrement_wave_orders()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE waves
    SET total_orders = total_orders - 1
    WHERE id = OLD.wave_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger for wave order deletion
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'after_wave_order_delete_decrement'
    ) THEN
        CREATE TRIGGER after_wave_order_delete_decrement
        AFTER DELETE ON wave_orders
        FOR EACH ROW
        EXECUTE FUNCTION decrement_wave_orders();
    END IF;
END
$$;
