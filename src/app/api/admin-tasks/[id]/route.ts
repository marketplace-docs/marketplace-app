
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { name, job, shift, status } = body;
  const user = { name: body.userName, email: body.userEmail };

  const { data, error } = await supabaseService
    .from('admin_tasks')
    .update({ name, job, shift, status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE',
        details: `Admin Task ID: ${id}`,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = { 
      name: request.headers.get('X-User-Name'), 
      email: request.headers.get('X-User-Email') 
  };


  const { error } = await supabaseService
    .from('admin_tasks')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'DELETE',
        details: `Admin Task ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
}
