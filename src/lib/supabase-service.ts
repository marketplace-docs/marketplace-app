
import { createClient } from '@supabase/supabase-js'

// Note: supabaseUrl and serviceRoleKey are intentionally NOT prefixed with NEXT_PUBLIC_
// They are server-side environment variables.
const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This client is for server-side use only (in API routes).
// It bypasses all RLS policies.
export const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
