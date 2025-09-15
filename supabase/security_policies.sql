-- 1. Enable Row Level Security (RLS) on the 'locations' table
-- This locks down the table by default. No one can access it until a policy grants them permission.
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;


-- 2. Create a policy to ALLOW LOGGED-IN USERS to READ (SELECT) locations.
-- This policy lets any user who is authenticated (logged in) view the list of locations.
-- This is safe because location names are not sensitive data.
CREATE POLICY "Allow authenticated users to read locations"
ON public.locations
FOR SELECT
TO authenticated
USING (true);


-- 3. Create a policy to ALLOW SUPER ADMINS to DO EVERYTHING (INSERT, UPDATE, DELETE).
-- This policy gives full control (all actions) over the 'locations' table *only* to users
-- whose custom JWT claim 'user_role' is 'Super Admin'.
-- Note: This assumes you have a custom claim named 'user_role' in your JWT.
-- If you followed standard Supabase setup, the role is often in `auth.jwt() ->> 'role'`.
-- We will use the 'role' claim as it is more standard.
CREATE POLICY "Allow Super Admins full access to locations"
ON public.locations
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'role') = 'Super Admin')
WITH CHECK ((auth.jwt() ->> 'role') = 'Super Admin');


-- Info: This script is idempotent. If you run it again, it will show an
-- error that the policies already exist, which is expected and means it's working.
