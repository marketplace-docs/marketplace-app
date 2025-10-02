
import { supabaseService } from '@/lib/supabase-service';
import type { User } from '@/types/user';

export async function getAuthenticatedUser(request: Request): Promise<User | null> {
    const email = request.headers.get('X-User-Email');

    if (!email) {
        return null;
    }

    try {
        const { data: dbUser, error } = await supabaseService
            .from('users')
            .select('id, name, email, role, status')
            .eq('email', email)
            .single();

        if (error || !dbUser) {
            return null;
        }
        
        return dbUser;

    } catch (e) {
        console.error("Authentication error in getAuthenticatedUser:", e);
        return null;
    }
}
