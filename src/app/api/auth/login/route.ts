
import { supabaseService } from '@/lib/supabase-service';
import { NextResponse } from 'next/server';

const validPassword = 'Marketplace@soco123!!!';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // 1. Check if the password is valid
    if (password !== validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const lowercasedEmail = email.toLowerCase();
    
    // 2. Fetch user data from the database using the service client
    const { data: dbUser, error: dbError } = await supabaseService
      .from('users')
      .select('name, email, role')
      .eq('email', lowercasedEmail)
      .single();

    if (dbError || !dbUser) {
      console.error('Login DB error or user not found:', dbError?.message);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Return the user data on success
    const user = {
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
