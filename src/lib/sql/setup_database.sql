-- Drop tables with CASCADE to remove dependent objects
DROP TABLE IF EXISTS public.menu_permissions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.admin_tasks CASCADE;
DROP TABLE IF EXISTS public.return_documents CASCADE;
DROP TABLE IF EXISTS public.marketplace_stores CASCADE;
DROP TABLE IF EXISTS public.backlog_items CASCADE;
DROP TABLE IF EXISTS public.daily_performance CASCADE;

-- 1. USERS TABLE
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Policies for users table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.users;
CREATE POLICY "Allow all access for service_role" ON public.users FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow authenticated users to read" ON public.users;
CREATE POLICY "Allow authenticated users to read" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;
CREATE POLICY "Allow users to update their own data" ON public.users FOR UPDATE USING (id = (SELECT u.id FROM public.users u WHERE u.email = auth.email())) WITH CHECK (id = (SELECT u.id FROM public.users u WHERE u.email = auth.email()));

-- Insert initial data for users
INSERT INTO public.users (name, email, role, status) VALUES
('Arlan Saputra', 'arlan.saputra@marketplace.com', 'Super Admin', 'Leader'),
('Rudi Setiawan', 'rudi.setiawan@marketplace.com', 'Admin', 'Reguler'),
('Nova Aurelia', 'nova.aurelia@marketplace.com', 'Admin', 'Reguler'),
('Nurul Tanzilla', 'nurul.tanzilla@marketplace.com', 'Event Staff', 'Event'),
('Regina Rifana', 'regina.rifana@marketplace.com', 'Captain', 'Leader');


-- 2. MENU_PERMISSIONS TABLE
CREATE TABLE public.menu_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    menu_href VARCHAR(255) NOT NULL,
    is_accessible BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, menu_href)
);
-- Enable Row Level Security
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;
-- Policies for menu_permissions table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.menu_permissions;
CREATE POLICY "Allow all access for service_role" ON public.menu_permissions FOR ALL USING (true);
DROP POLICY IF EXISTS "Allow users to read their own permissions" ON public.menu_permissions;
CREATE POLICY "Allow users to read their own permissions" ON public.menu_permissions FOR SELECT USING (user_id = (SELECT u.id FROM public.users u WHERE u.email = auth.email()));


-- 3. ADMIN_TASKS TABLE
CREATE TABLE public.admin_tasks (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    job VARCHAR(255) NOT NULL,
    shift VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Row Level Security
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
-- Policies for admin_tasks table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.admin_tasks;
CREATE POLICY "Allow all access for service_role" ON public.admin_tasks FOR ALL USING (true);


-- 4. RETURN_DOCUMENTS TABLE
CREATE TABLE public.return_documents (
  id BIGSERIAL PRIMARY KEY,
  noDocument VARCHAR(255) NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  qty INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  sku VARCHAR(255) NOT NULL,
  barcode VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NOT NULL,
  reason TEXT,
  receivedBy VARCHAR(255) NOT NULL
);
-- Enable Row Level Security
ALTER TABLE public.return_documents ENABLE ROW LEVEL SECURITY;
-- Policies for return_documents table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.return_documents;
CREATE POLICY "Allow all access for service_role" ON public.return_documents FOR ALL USING (true);


-- 5. MARKETPLACE_STORES TABLE
CREATE TABLE public.marketplace_stores (
  id BIGSERIAL PRIMARY KEY,
  marketplace_name VARCHAR(255) NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  platform VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Row Level Security
ALTER TABLE public.marketplace_stores ENABLE ROW LEVEL SECURITY;
-- Policies for marketplace_stores table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.marketplace_stores;
CREATE POLICY "Allow all access for service_role" ON public.marketplace_stores FOR ALL USING (true);


-- 6. BACKLOG_ITEMS TABLE
CREATE TABLE public.backlog_items (
  id BIGSERIAL PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL,
  payment_accepted INT NOT NULL,
  marketplace VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Row Level Security
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;
-- Policies for backlog_items table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.backlog_items;
CREATE POLICY "Allow all access for service_role" ON public.backlog_items FOR ALL USING (true);

-- 7. DAILY_PERFORMANCE TABLE
CREATE TABLE public.daily_performance (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    month VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    task_daily INT NOT NULL,
    total_items INT NOT NULL,
    job_desc VARCHAR(100) NOT NULL,
    shift VARCHAR(50) NOT NULL,
    target INT NOT NULL,
    target_item INT NOT NULL,
    task_performance INT NOT NULL,
    items_performance INT NOT NULL,
    result VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable Row Level Security
ALTER TABLE public.daily_performance ENABLE ROW LEVEL SECURITY;
-- Policies for daily_performance table
DROP POLICY IF EXISTS "Allow all access for service_role" ON public.daily_performance;
CREATE POLICY "Allow all access for service_role" ON public.daily_performance FOR ALL USING (true);
