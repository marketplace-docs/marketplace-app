import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function Home() {
  const cookieStore = cookies();
  const userCookie = cookieStore.get('user');

  if (userCookie) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }

  // This part will not be rendered due to the redirects above,
  // but it's good practice to have a fallback return.
  return null;
}
