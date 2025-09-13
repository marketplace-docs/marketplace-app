-- Drop existing tables and functions in reverse order of dependency
DROP TABLE IF EXISTS public.menu_permissions;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.backlog_items;


-- Create the users table
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to read the users table" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own data" ON public.users;
DROP POLICY IF EXISTS "Allow super admins to manage all users" ON public.users;

-- Allow all users to view user information
CREATE POLICY "Allow all users to read the users table"
ON public.users FOR SELECT
USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Allow authenticated users to manage their own data"
ON public.users FOR UPDATE
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- Allow super admins to do anything
CREATE POLICY "Allow super admins to manage all users"
ON public.users FOR ALL
USING ((SELECT role FROM public.users WHERE email = auth.email()) = 'Super Admin');


-- Create the menu_permissions table
CREATE TABLE public.menu_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    menu_href VARCHAR(255) NOT NULL,
    is_accessible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, menu_href)
);

-- Enable Row Level Security
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow super admins to manage all permissions" ON public.menu_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to read their own permissions" ON public.menu_permissions;


-- Allow Super Admins to manage all permissions
CREATE POLICY "Allow super admins to manage all permissions"
ON public.menu_permissions FOR ALL
USING ((SELECT role FROM public.users WHERE email = auth.email()) = 'Super Admin');

-- Allow authenticated users to read their own permissions
CREATE POLICY "Allow authenticated users to read their own permissions"
ON public.menu_permissions FOR SELECT
USING ((SELECT id FROM public.users WHERE email = auth.email()) = user_id);


-- Create the backlog_items table
CREATE TABLE public.backlog_items (
    id BIGSERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    payment_accepted INT NOT NULL,
    marketplace VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for backlog_items
ALTER TABLE public.backlog_items ENABLE ROW LEVEL SECURITY;

-- Policies for backlog_items
-- Allow authenticated users to do everything
CREATE POLICY "Allow authenticated users to manage backlog items"
ON public.backlog_items FOR ALL
USING (auth.role() = 'authenticated');
