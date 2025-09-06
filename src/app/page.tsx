
'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

export default function Home() {
    const { user } = useAuth();

    useEffect(() => {
        if(user) {
            redirect('/dashboard');
        } else {
            redirect('/login');
        }
    }, [user]);

    return null; 
}
