
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { logActivity } from '@/lib/logger';

const ALLOWED_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin', 'Staff'];

// Helper function to calculate performance metrics
const calculateMetrics = (entry: { task_daily: number; total_items: number; }) => {
    const target = 400; // Mock target, adjust as needed
    const target_item = 1000; // Mock target item, adjust as needed
    const task_performance = target > 0 ? Math.round((entry.task_daily / target) * 100) : 0;
    const items_performance = target_item > 0 ? Math.round((entry.total_items / target_item) * 100) : 0;
    const result = task_performance >= 100 ? 'BERHASIL' : 'GAGAL';

    return { target, target_item, task_performance, items_performance, result };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const job_desc = searchParams.get('job_desc');

  let query = supabaseService.from('daily_performance').select('*');

  if (from) {
    query = query.gte('date', from);
  }
  if (to) {
    query = query.lte('date', to);
  }
  if (job_desc && job_desc !== 'All') {
    query = query.eq('job_desc', job_desc);
  }
  
  query = query.order('date', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
    const { entries, user } = await request.json();

    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!Array.isArray(entries)) {
        return NextResponse.json({ error: 'Request body must be an array of performance entries.' }, { status: 400 });
    }

    const entriesToInsert = entries.map(entry => {
        const entryDate = new Date(entry.date);
        const { target, target_item, task_performance, items_performance, result } = calculateMetrics(entry);
        return {
            ...entry,
            date: entry.date,
            month: format(entryDate, 'MMMM - yy'),
            target,
            target_item,
            task_performance,
            items_performance,
            result,
        };
    });

    const { data, error } = await supabaseService
        .from('daily_performance')
        .insert(entriesToInsert)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (user && user.name && user.email) {
      await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'CREATE',
        details: `Added ${entries.length} daily performance entries`,
      });
    }

    return NextResponse.json(data, { status: 201 });
}


export async function PATCH(request: Request) {
    const { updates, user } = await request.json();

    const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];
    if (!user?.role || !UPDATE_ROLES.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!Array.isArray(updates)) {
        return NextResponse.json({ error: 'Request body must be an array of updates.' }, { status: 400 });
    }

    const updatePromises = updates.map(async (update) => {
        const { id, ...fieldsToUpdate } = update;
        
        const { data: existingData, error: fetchError } = await supabaseService
            .from('daily_performance')
            .select('task_daily, total_items')
            .eq('id', id)
            .single();

        if (fetchError) {
             console.error(`Error fetching record ${id}:`, fetchError);
            return { id, error: fetchError };
        }
        
        const updatedFields = { ...existingData, ...fieldsToUpdate };
        const { task_performance, items_performance, result } = calculateMetrics(updatedFields);

        const finalUpdate = { ...fieldsToUpdate, task_performance, items_performance, result };
        
        return supabaseService.from('daily_performance').update(finalUpdate).eq('id', id);
    });

    const results = await Promise.all(updatePromises);
    
    const errors = results.filter(res => res && res.error);
    if (errors.length > 0) {
        console.error('Some updates failed:', errors);
        return NextResponse.json({ error: `Failed to update ${errors.length} records.`, details: errors.map(e => e.error?.message) }, { status: 500 });
    }

    if (user && user.name && user.email) {
        await logActivity({
            userName: user.name,
            userEmail: user.email,
            action: 'UPDATE',
            details: `Updated ${updates.length} daily performance entries. IDs: ${updates.map(u => u.id).join(', ')}`,
        });
    }


    return NextResponse.json({ message: 'Performance data updated successfully.' });
}
