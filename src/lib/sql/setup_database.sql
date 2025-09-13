-- 1. Reset Tables for a clean slate
DROP TABLE IF EXISTS public.menu_permissions;
DROP TABLE IF EXISTS public.users;

-- 2. Create Users Table
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to read user data" ON public.users;
DROP POLICY IF EXISTS "Allow individual users to manage their own data" ON public.users;
DROP POLICY IF EXISTS "Allow super admins to manage all data" ON public.users;

-- 5. Create new, simplified policies for Users table
-- Policy 1: Allow public read-only access to all users.
CREATE POLICY "Allow all users to read user data"
ON public.users
FOR SELECT
USING (true);

-- Policy 2: Allow authenticated users to insert, update, or delete THEIR OWN data.
-- The check for 'Super Admin' will be handled at the API level to avoid recursive functions.
CREATE POLICY "Allow individual users to manage their own data"
ON public.users
FOR ALL -- Applies to INSERT, UPDATE, DELETE
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- 6. Insert Initial User Data
INSERT INTO public.users (id, name, email, role, status) VALUES
(1, 'Arlan Saputra', 'arlan.saputra@marketplace.com', 'Super Admin', 'Leader'),
(2, 'Rudi Setiawan', 'rudi.setiawan@marketplace.com', 'Admin', 'Reguler'),
(3, 'Nova Aurelia', 'nova.aurelia@marketplace.com', 'Admin', 'Reguler'),
(4, 'Nurul Tanzilla', 'nurul.tanzilla@marketplace.com', 'Event Staff', 'Event'),
(5, 'Regina Rifana', 'regina.rifana@marketplace.com', 'Captain', 'Leader');

-- 7. Create Menu Permissions Table
CREATE TABLE public.menu_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    menu_href VARCHAR(255) NOT NULL,
    is_accessible BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, menu_href)
);

-- 8. Enable Row Level Security for Menu Permissions
ALTER TABLE public.menu_permissions ENABLE ROW LEVEL SECURITY;

-- 9. Drop old policies for Menu Permissions table
DROP POLICY IF EXISTS "Allow super admins full access" ON public.menu_permissions;
DROP POLICY IF EXISTS "Allow users to read their own permissions" ON public.menu_permissions;

-- 10. Create new policies for Menu Permissions table
-- Policy 1: Allow Super Admins to do anything on this table.
CREATE POLICY "Allow super admins full access"
ON public.menu_permissions
FOR ALL
USING (
    (SELECT role FROM public.users WHERE id = auth.uid()::text::bigint) = 'Super Admin'
)
WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()::text::bigint) = 'Super Admin'
);

-- Policy 2: Allow authenticated users to read their own permissions.
CREATE POLICY "Allow users to read their own permissions"
ON public.menu_permissions
FOR SELECT
USING (user_id = auth.uid()::text::bigint);
