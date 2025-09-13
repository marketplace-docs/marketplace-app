
'use server';

import { supabaseService } from './supabase-service';

type LogParams = {
    userName: string;
    userEmail: string;
    action: string;
    details?: string;
};

export async function logActivity({ userName, userEmail, action, details }: LogParams): Promise<void> {
    try {
        const { error } = await supabaseService
            .from('log_activity')
            .insert({
                user_name: userName,
                user_email: userEmail,
                action: action,
                details: details || '',
            });

        if (error) {
            console.error('Failed to log activity:', error.message);
        }
    } catch (err) {
        console.error('An unexpected error occurred while logging activity:', err);
    }
}
