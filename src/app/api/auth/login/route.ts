
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

const superAdminPassword = 'Marketplace^soco@123!!!';
const standardUserPassword = 'Marketplace^^@socomp123!!!';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    const lowercasedEmail = email.toLowerCase();
    
    // 1. Fetch user data from the database first
    const { data: dbUser, error: dbError } = await supabaseService
      .from('users')
      .select('id, name, email, role')
      .eq('email', lowercasedEmail)
      .single();

    if (dbError || !dbUser) {
      console.error('Login DB error or user not found:', dbError?.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // 2. Check password based on user role
    const isValidPassword = 
      (dbUser.role === 'Super Admin' && password === superAdminPassword) ||
      (dbUser.role !== 'Super Admin' && password === standardUserPassword);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Return the user data on success
    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 });
  }
}
