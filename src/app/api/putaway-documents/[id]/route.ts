'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { format } from 'date-fns';

async function generateNewDocumentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `UPD-EXP-${year}`;
  
  const { data, error } = await supabaseService
    .from('putaway_documents')
    .select('no_document')
    .like('no_document', `${prefix}-%`)
    .order('no_document', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error("Error fetching last document number:", error);
    // Fallback in case of error
    return `${prefix}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  }

  let newSeq = 1;
  if (data) {
    const lastSeq = parseInt(data.no_document.split('-').pop() || '0', 10);
    newSeq = lastSeq + 1;
  }
  
  return `${prefix}-${newSeq.toString().padStart(5, '0')}`;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  const { userName, userEmail } = body;

  // Check for the new stock splitting/updating logic
  if (body.originalDoc && body.update) {
    const { originalDoc, update } = body;
    const { qty: originalQty, location: originalLocation, exp_date: originalExpDate } = originalDoc;
    const { qty: qtyToUpdate, location: newLocation, exp_date: newExpDate } = update;

    // --- LOGIC: If qtyToUpdate is the same as originalQty, it's a simple UPDATE, not a split. ---
    if (qtyToUpdate === originalQty) {
      const { data, error } = await supabaseService
        .from('putaway_documents')
        .update({ location: newLocation, exp_date: newExpDate })
        .eq('id', originalDoc.id)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase PATCH (simple update) error:", error);
        return NextResponse.json({ error: "Failed to update document: " + error.message }, { status: 500 });
      }

      if (userName && userEmail) {
        const logDetails = [];
        const oldExpFormatted = format(new Date(originalExpDate), 'dd/MM/yyyy');
        const newExpFormatted = format(new Date(newExpDate), 'dd/MM/yyyy');
        if (newLocation !== originalLocation) logDetails.push(`location from "${originalLocation}" to "${newLocation}"`);
        if (newExpFormatted !== oldExpFormatted) logDetails.push(`exp date from ${oldExpFormatted} to ${newExpFormatted}`);
        
        await logActivity({
          userName,
          userEmail,
          action: 'UPDATE_BATCH',
          details: `Updated ${originalQty} items for Doc ID ${originalDoc.id}. ${logDetails.join(' & ')}.`,
        });
      }

      return NextResponse.json(data);
    }

    // --- LOGIC: If qtyToUpdate is less than originalQty, it's a SPLIT. ---
    const newOriginalQty = originalQty - qtyToUpdate;

    // 1. Update the original document to reduce its quantity
    const { error: updateError } = await supabaseService
      .from('putaway_documents')
      .update({ qty: newOriginalQty })
      .eq('id', originalDoc.id);

    if (updateError) {
      console.error("Supabase PATCH (update original) error:", updateError);
      return NextResponse.json({ error: "Failed to update original document: " + updateError.message }, { status: 500 });
    }
    
    // 2. Generate a new document number for the split-off quantity
    const newDocNumber = await generateNewDocumentNumber();

    // 3. Create a new document for the split-off quantity
    const { error: insertError } = await supabaseService
      .from('putaway_documents')
      .insert({
        ...originalDoc,
        id: undefined, // Let Supabase generate a new ID
        created_at: undefined,
        no_document: newDocNumber, // Use the new document number
        qty: qtyToUpdate,
        location: newLocation,
        exp_date: newExpDate,
        status: 'Done', // Assume the split batch is confirmed
        check_by: userName,
        date: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error("Supabase PATCH (insert new) error:", insertError);
      // Potentially roll back the update here if needed, though it's complex.
      // For now, we'll just report the error.
      return NextResponse.json({ error: "Failed to create new split document: " + insertError.message }, { status: 500 });
    }
    
    if (userName && userEmail) {
      const logDetails = [];
      const oldExpFormatted = format(new Date(originalExpDate), 'dd/MM/yyyy');
      const newExpFormatted = format(new Date(newExpDate), 'dd/MM/yyyy');

      if (newLocation !== originalLocation) {
         logDetails.push(`location from "${originalLocation}" to "${newLocation}"`);
      }
      if (newExpFormatted !== oldExpFormatted) {
         logDetails.push(`exp date from ${oldExpFormatted} to ${newExpFormatted}`);
      }

      const detailsString = `Split ${qtyToUpdate} items from Doc ID ${originalDoc.id}. ${logDetails.join(' & ')}. New Doc: ${newDocNumber}`;

      await logActivity({
        userName,
        userEmail,
        action: 'UPDATE_BATCH',
        details: detailsString || `Split ${qtyToUpdate} items from Doc ID ${originalDoc.id}.`,
      });
    }

    return NextResponse.json({ message: 'Stock split successful' });

  } else {
    // Fallback to the original simple update logic for other PATCH requests
    const { no_document, qty, status, sku, barcode, brand, exp_date, location, check_by } = body;

    const { data, error } = await supabaseService
      .from('putaway_documents')
      .update({ no_document, qty, status, sku, barcode, brand, exp_date, location, check_by })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Supabase PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (userName && userEmail) {
      await logActivity({
          userName,
          userEmail,
          action: 'UPDATE',
          details: `Putaway Document ID: ${id}`,
      });
    }

    return NextResponse.json(data);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const user = {
      name: request.headers.get('X-User-Name'),
      email: request.headers.get('X-User-Email')
  };

  const { error } = await supabaseService
    .from('putaway_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Supabase DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (user.name && user.email) {
    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'DELETE',
        details: `Putaway Document ID: ${id}`,
    });
  }

  return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
}
