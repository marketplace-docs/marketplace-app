-- Enable Row Level Security (RLS) for the locations table.
-- This is a critical security measure to ensure data is not publicly accessible.
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts.
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON public.locations;
DROP POLICY IF EXISTS "Allow Super Admins to manage locations" ON public.locations;

-- Policy: Allow authenticated users to read locations.
-- This policy grants read-only (SELECT) access to any user who is logged in.
-- The data in the 'locations' table is considered non-sensitive and can be viewed by all internal users.
CREATE POLICY "Allow authenticated users to read locations"
ON public.locations
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow Super Admins to manage locations.
-- This policy grants full access (INSERT, UPDATE, DELETE) to users with the 'Super Admin' role.
-- It checks the 'role' from the 'users' table, matching it against the logged-in user's ID.
-- This ensures that only authorized administrators can modify the location data.
CREATE POLICY "Allow Super Admins to manage locations"
ON public.locations
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'Super Admin'
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'Super Admin'
);
