-- supabase/migrations/YYYYMMDDHHMMSS_enable_inbound_documents_access.sql

-- 1. Enable RLS for the inbound_documents table
ALTER TABLE public.inbound_documents ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy to allow authenticated users to SELECT (read) data.
-- This policy allows any user who is logged in to view the inbound documents, which is necessary for monitoring pages.
CREATE POLICY "Allow authenticated users to read inbound documents"
ON public.inbound_documents
FOR SELECT
TO authenticated
USING (true);

-- 3. Create a policy to allow users with specific roles to INSERT, UPDATE.
-- This restricts modification rights to authorized personnel only.
-- The roles are based on the existing API route logic.
CREATE POLICY "Allow authorized users to manage inbound documents"
ON public.inbound_documents
FOR ALL -- Covers INSERT, UPDATE, DELETE
TO authenticated
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin')
)
WITH CHECK (
  (SELECT role FROM public.users WHERE id = auth.uid()) IN ('Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin')
);
