
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

export async function POST(request: Request) {
    const { ids, user } = await request.json();

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'An array of order IDs is required.' }, { status: 400 });
    }

    try {
        const { error } = await supabaseService
            .from('manual_orders')
            .delete()
            .in('id', ids);

        if (error) {
            console.error('Error bulk deleting manual orders:', error);
            throw new Error(error.message);
        }

        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'BULK_DELETE_MANUAL_ORDERS',
            details: `Deleted ${ids.length} manual orders. IDs: ${ids.join(', ')}`,
        });

        return NextResponse.json({ message: `${ids.length} orders deleted successfully.` }, { status: 200 });

    } catch (error: any) {
        console.error('Server error during bulk delete:', error);
        return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
    }
}
