'use server';

import {NextResponse} from 'next/server';
import {query} from '@/lib/db';

// This is a placeholder. In a real app, you'd want to validate this more robustly.
const isValidUser = (user: any): boolean => {
  return (
    user &&
    typeof user.name === 'string' &&
    typeof user.status === 'string' &&
    typeof user.role === 'string' &&
    ['Leader', 'Reguler', 'Event'].includes(user.status)
  );
};

export async function PATCH(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        {error: 'Invalid user ID'},
        {status: 400}
      );
    }

    const body = await request.json();

    if (!isValidUser(body)) {
      return NextResponse.json(
        {error: 'Invalid user data provided'},
        {status: 400}
      );
    }

    const {name, status, role} = body;
    const {
      rows,
    } = await query(
      'UPDATE users SET name = $1, status = $2, role = $3 WHERE id = $4 RETURNING *',
      [name, status, role, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    return NextResponse.json(rows[0], {status: 200});
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {error: 'Failed to update user', details: errorMessage},
      {status: 500}
    );
  }
}

export async function DELETE(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        {error: 'Invalid user ID'},
        {status: 400}
      );
    }

    const {
      rows,
    } = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (rows.length === 0) {
      return NextResponse.json({error: 'User not found'}, {status: 404});
    }

    return NextResponse.json(
      {message: 'User deleted successfully'},
      {status: 200}
    );
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {error: 'Failed to delete user', details: errorMessage},
      {status: 500}
    );
  }
}
