-- Drop tables to ensure a clean slate
DROP TABLE IF EXISTS public.menu_permissions;
DROP TABLE IF EXISTS public.users;

-- Create the users table
CREATE TABLE public.users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for users to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access" ON public.users;
DROP POLICY IF EXISTS "Allow management for Super Admins" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;

-- Policies for users table
CREATE POLICY "Allow public read access" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Allow management for Super Admins" ON public.users
FOR ALL USING (
  (SELECT role FROM public.users WHERE email = auth.email()) = 'Super Admin'
) WITH CHECK (
  (SELECT role FROM public.users WHERE email = auth.email()) = 'Super Admin'
);

CREATE POLICY "Allow users to update their own data" ON public.users
FOR UPDATE USING (email = auth.email()) WITH CHECK (email = auth.email());


-- Insert initial user data
INSERT INTO public.users (name, email, role, status) VALUES
('Arlan Saputra', 'arlan.saputra@marketplace.com', 'Super Admin', 'Leader'),
('Rudi Setiawan', 'rudi.setiawan@marketplace.com', 'Admin', 'Reguler'),
('Nova Aurelia', 'nova.aurelia@marketplace.com', 'Admin', 'Reguler'),
('Nurul Tanzilla', 'nurul.tanzilla@marketplace.com', 'Event Staff', 'Event'),
('Regina Rifana', 'regina.rifana@marketplace.com', 'Captain', 'Leader');

-- Create the menu_permissions table
CREATE TABLE public.menu_permissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  menu_href VARCHAR(255) NOT NULL,
  is_accessible BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, menu_href)
);

-- Enable Row Level Security for menu_permissions
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for menu_permissions to avoid conflicts
DROP POLICY IF EXISTS "Allow full access for Super Admins" ON public.menu_permissions;
DROP POLICY IF EXISTS "Allow individual read access" ON public.menu_permissions;

-- Policies for menu_permissions table
CREATE POLICY "Allow full access for Super Admins" ON public.menu_permissions
FOR ALL USING (
  (SELECT role FROM public.users WHERE email = auth.email()) = 'Super Admin'
) WITH CHECK (
  (SELECT role FROM public.users WHERE email = auth.email()) = 'Super Admin'
);

CREATE POLICY "Allow individual read access" ON public.menu_permissions
FOR SELECT USING (
  user_id = (SELECT id FROM public.users WHERE email = auth.email())
);