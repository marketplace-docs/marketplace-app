--
-- SETUP SCRIPT
-- This script will reset and configure the 'users' and 'menu_permissions' tables.
-- Run this script in your Supabase SQL Editor to apply changes.
--

-- ========= USERS TABLE =========

-- Create a function to get the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_to_check uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM users WHERE id = user_id_to_check;
$$;


-- 1. Drop existing tables to start fresh.
DROP TABLE IF EXISTS public.menu_permissions;
DROP TABLE IF EXISTS public.users;


-- 2. Create the 'users' table.
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) on the 'users' table.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts.
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow users to manage their own data" ON public.users;
DROP POLICY IF EXISTS "Allow Super Admins to manage all users" ON public.users;


-- 5. Create Policies for 'users' table.
-- Policy 1: Allow anyone to view users (for dropdowns, etc.)
CREATE POLICY "Allow public read access to users"
ON public.users
FOR SELECT
USING (true);

-- Policy 2: Allow authenticated users to insert new users.
CREATE POLICY "Allow authenticated user to insert users"
ON public.users
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');


-- Policy 3: Allow users to update their own data, and Super Admins to update any.
CREATE POLICY "Allow users to update their own data and Super Admins to update any"
ON public.users
FOR UPDATE
USING (
  (SELECT public.get_user_role(auth.uid())) = 'Super Admin'
  OR id = auth.uid()::text::bigint
);

-- Policy 4: Allow users to delete their own data, and Super Admins to delete any.
CREATE POLICY "Allow users to delete their own data and Super Admins to delete any"
ON public.users
FOR DELETE
USING (
  (SELECT public.get_user_role(auth.uid())) = 'Super Admin'
  OR id = auth.uid()::text::bigint
);


-- 6. Insert initial data into the 'users' table.
INSERT INTO public.users (name, email, role, status) VALUES
('Arlan Saputra', 'arlan.saputra@marketplace.com', 'Super Admin', 'Leader'),
('Rudi Setiawan', 'rudi.setiawan@marketplace.com', 'Admin', 'Reguler'),
('Nova Aurelia', 'nova.aurelia@marketplace.com', 'Admin', 'Reguler'),
('Nurul Tanzilla', 'nurul.tanzilla@marketplace.com', 'Event Staff', 'Event'),
('Regina Rifana', 'regina.rifana@marketplace.com', 'Captain', 'Leader');


-- ========= MENU PERMISSIONS TABLE =========

-- 1. Create the 'menu_permissions' table.
CREATE TABLE public.menu_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    menu_href VARCHAR(255) NOT NULL,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    UNIQUE (user_id, menu_href)
);

-- 2. Enable RLS on the 'menu_permissions' table.
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policy to avoid conflicts.
DROP POLICY IF EXISTS "Allow all access for Super Admins" ON public.menu_permissions;
DROP POLICY IF EXISTS "Allow user to read their own permissions" ON public.menu_permissions;


-- 4. Create Policies for 'menu_permissions' table.
-- Policy 1: Super Admins can do anything.
CREATE POLICY "Allow all access for Super Admins"
ON public.menu_permissions
FOR ALL
USING ((SELECT public.get_user_role(auth.uid())) = 'Super Admin')
WITH CHECK ((SELECT public.get_user_role(auth.uid())) = 'Super Admin');

-- Policy 2: Users can read their own permissions (important for sidebar).
CREATE POLICY "Allow user to read their own permissions"
ON public.menu_permissions
FOR SELECT
USING (user_id = auth.uid()::text::bigint);

-- Notify Supabase of schema changes
NOTIFY pgrst, 'reload schema';
