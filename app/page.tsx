// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect from root to /x/folder immediately
  redirect('/convert-to/png');
  return null; // The redirect takes effect immediately
}
