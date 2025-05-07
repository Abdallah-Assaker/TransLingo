
import { redirect } from 'next/navigation';

export default function UserPage() {
  redirect('/admin/dashboard');
  // Optionally, you can return null or a loading indicator,
  // but redirect() will typically prevent rendering.
  return null;
}
