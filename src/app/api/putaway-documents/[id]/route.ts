
'use server';

import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/logger';
import { format } from 'date-fns';
import { getAuthenticatedUser } from '@/lib/auth-service';

const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  CAPTAIN: 'Captain',
  ADMIN: 'Admin'
};

const UPDATE_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.SUPERVISOR, ROLES.CAPTAIN, ROLES.ADMIN];
const DELETE_ROLES = [ROLES.SUPER_ADMIN];


async function generateNewDocumentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MP-UPD-EXP-${year}`;
  
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
  const user = await getAuthenticatedUser(request);
  if (!user || !UPDATE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }

  // The `id` from params is now potentially misleading. The true ID is in the body.
  const body = await request.json();

  // Check for the new stock splitting/updating logic
  if (body.originalDoc && body.update) {
    const { originalDoc, update } = body;
    const { qty: originalQty, location: originalLocation, exp_date: originalExpDate } = originalDoc;
    const { qty: qtyToUpdate, location: newLocation, exp_date: newExpDate } = update;
    
    // IMPORTANT: The ID from the batch product is a composite key, we need to find the putaway doc.
    // Let's find the original putaway document based on its unique properties.
    // A single batch might be composed of multiple putaway documents. For this action, we'll target the latest one to split from.
    const { data: sourcePutawayDoc, error: findError } = await supabaseService
        .from('putaway_documents')
        .select('id, qty')
        .eq('barcode', originalDoc.barcode)
        .eq('location', originalDoc.location)
        .eq('exp_date', originalDoc.exp_date)
        .order('date', { ascending: false })
        .limit(1)
        .single();
    
    if (findError || !sourcePutawayDoc) {
        console.error("Supabase PATCH (find source doc) error:", findError);
        return NextResponse.json({ error: "Could not find the source putaway document to split or update." }, { status: 404 });
    }
    
    const originalDocId = sourcePutawayDoc.id;
    const sourceQty = sourcePutawayDoc.qty;


    // --- LOGIC: If qtyToUpdate is the same as sourceQty, it's a simple UPDATE, not a split. ---
    if (qtyToUpdate === sourceQty) {
      const { data, error } = await supabaseService
        .from('putaway_documents')
        .update({ location: newLocation, exp_date: newExpDate })
        .eq('id', originalDocId)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase PATCH (simple update) error:", error);
        return NextResponse.json({ error: "Failed to update document: " + error.message }, { status: 500 });
      }

      const logDetails = [];
      const oldExpFormatted = format(new Date(originalExpDate), 'dd/MM/yyyy');
      const newExpFormatted = format(new Date(newExpDate), 'dd/MM/yyyy');
      if (newLocation !== originalLocation) logDetails.push(`location from "${originalLocation}" to "${newLocation}"`);
      if (newExpFormatted !== oldExpFormatted) logDetails.push(`exp date from ${oldExpFormatted} to ${newExpFormatted}`);
      
      await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE_BATCH',
        details: `Updated ${originalQty} items for Doc ID ${originalDocId}. ${logDetails.join(' & ')}.`,
      });

      return NextResponse.json(data);
    }

    // --- LOGIC: If qtyToUpdate is less than sourceQty, it's a SPLIT. ---
    const newOriginalQty = sourceQty - qtyToUpdate;

    // 1. Update the original document to reduce its quantity
    const { error: updateError } = await supabaseService
      .from('putaway_documents')
      .update({ qty: newOriginalQty })
      .eq('id', originalDocId);

    if (updateError) {
      console.error("Supabase PATCH (update original) error:", updateError);
      return NextResponse.json({ error: "Failed to update original document: " + updateError.message }, { status: 500 });
    }
    
    // 2. Generate a new document number for the split-off quantity
    const newDocNumber = await generateNewDocumentNumber();

    // 3. Create a new document for the split-off quantity
    const { data: newDoc, error: insertError } = await supabaseService
      .from('putaway_documents')
      .insert({
        // Copy relevant fields, let DB generate id, created_at
        no_document: newDocNumber,
        date: new Date().toISOString(),
        qty: qtyToUpdate,
        status: 'Done', // Assume the split batch is confirmed
        sku: originalDoc.sku,
        barcode: originalDoc.barcode,
        brand: originalDoc.brand,
        exp_date: newExpDate, // Use the new expiration date
        location: newLocation, // Use the new location
        check_by: user.name,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Supabase PATCH (insert new) error:", insertError);
      // Potentially roll back the update here if needed, though it's complex.
      // For now, we'll just report the error.
      return NextResponse.json({ error: "Failed to create new split document: " + insertError.message }, { status: 500 });
    }
    
    const logDetails = [];
    const oldExpFormatted = format(new Date(originalExpDate), 'dd/MM/yyyy');
    const newExpFormatted = format(new Date(newExpDate), 'dd/MM/yyyy');

    if (newLocation !== originalLocation) {
        logDetails.push(`location to "${newLocation}"`);
    }
    if (newExpFormatted !== oldExpFormatted) {
        logDetails.push(`exp date to ${newExpFormatted}`);
    }

    const detailsString = logDetails.length > 0 ? logDetails.join(' & ') : "No changes in location or exp date";

    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'SPLIT_BATCH',
        details: `Split ${qtyToUpdate} items from Doc ID ${originalDocId}. New Doc: ${newDocNumber}. Changes: ${detailsString}.`,
    });

    return NextResponse.json({ message: 'Stock split successful', newDocument: newDoc });

  } else {
    const { id } = params; // Fallback to URL id for simple updates
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

    await logActivity({
        userName: user.name,
        userEmail: user.email,
        action: 'UPDATE',
        details: `Putaway Document ID: ${id}`,
    });

    return NextResponse.json(data);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(request);
  if (!user || !DELETE_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
  }
  
  const { id } = params;

  const { error } = await supabaseService
    .from('putaway_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Supabase DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
      userName: user.name,
      userEmail: user.email,
      action: 'DELETE',
      details: `Putaway Document ID: ${id}`,
  });

  return NextResponse.json({ message: 'Document deleted successfully' }, { status: 200 });
}
