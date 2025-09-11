
'use client';

import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';

export default function Home() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if(user) {
                redirect('/dashboard');
            } else {
                redirect('/login');
            }
        }
    }, [user, loading]);

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="text-2xl font-semibold">Market Place..</div>
        </div>
    );
}
