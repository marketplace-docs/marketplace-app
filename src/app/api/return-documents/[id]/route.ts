
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';

const UPDATE_ROLES = ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { nodocument, qty, status, sku, barcode, brand, location, reason, receivedby, userName, userEmail, userRole } = body;

  if (!userRole || !UPDATE_ROLES.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { data, error } = await supabaseService
    .from('return_documents')
    .update({ nodocument, qty, status, sku, barcode, brand, location, reason, receivedby })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (userName && userEmail) {
    await logActivity({
        userName,
        userEmail,
        action: 'UPDATE',
        details: `Return Document ID: ${id}`,
    });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = { 
      name: request.headers.get('X-User-Name'), 
      email: request.headers.get('X-User-Email'),
      role: request.headers.get('X-User-Role')
  };

  if (user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  const { error } = await supabaseService
    .from('return_documents')
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
        details: `Return Document ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
}
