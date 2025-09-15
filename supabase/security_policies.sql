-- supabase/security_policies.sql

-- =================================================================
-- Step 1: Enable Row Level Security (RLS) on the 'locations' table
-- This is the main fix for the "RLS Disabled" error.
-- =================================================================
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- Step 2: Create Policies to Define Access Rules
-- After enabling RLS, no one can access the table until we define policies.
-- =================================================================

-- Drop existing policies if they exist, to ensure a clean slate.
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON public.locations;
DROP POLICY IF EXISTS "Allow Super Admins to manage locations" ON public.locations;


-- Policy 1: Allow any logged-in (authenticated) user to READ location data.
-- This is safe because location names and types are not sensitive information.
CREATE POLICY "Allow authenticated users to read locations"
ON public.locations
FOR SELECT
TO authenticated
USING (true);


-- Policy 2: Allow ONLY users with the 'Super Admin' role to INSERT, UPDATE, or DELETE locations.
-- This secures modification actions to the highest permission level.
-- It checks the 'role' from the 'users' table based on the logged-in user's ID.
CREATE POLICY "Allow Super Admins to manage locations"
ON public.locations
FOR ALL -- Applies to INSERT, UPDATE, DELETE
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = (SELECT uid FROM auth.users LIMIT 1)) = 'Super Admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = (SELECT uid FROM auth.users LIMIT 1)) = 'Super Admin'
);


-- =================================================================
-- How to Apply:
-- 1. Go to your Supabase project dashboard.
-- 2. Navigate to the "SQL Editor".
-- 3. Click "New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN".
-- =================================================================
