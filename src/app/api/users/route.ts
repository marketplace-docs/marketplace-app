
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  try {
    if (email) {
      // Get a single user by email
      const { rows } = await query('SELECT * FROM users WHERE LOWER(name) = LOWER($1) OR name ILIKE $2 LIMIT 1', [email.split('@')[0].replace('.', ' ') + ' %', email.split('@')[0].replace('.', ' ') + '%']);
      // A bit of a hack to match email to name, ideally we'd store email in DB
      const userByName = await query('SELECT * FROM users WHERE name ILIKE $1 LIMIT 1', [formatUserName(email) + '%']);
      if (userByName.rows.length > 0) {
        return NextResponse.json(userByName.rows[0], { status: 200 });
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 });

    } else {
      // Get all users
      const { rows } = await query('SELECT * FROM users ORDER BY id ASC');
      return NextResponse.json(rows, { status: 200 });
    }
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch users', details: errorMessage }, { status: 500 });
  }
}

function formatUserName(email: string) {
    const namePart = email.split('@')[0];
    return namePart
        .split('.')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
