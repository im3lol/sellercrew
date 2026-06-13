'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useAppStore } from '@/lib/store';

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (data?.authenticated && data.user) {
          // Hydrate the store so the shell can show the user / sign out cleanly.
          useAppStore.getState().applyAccount({ user: data.user, workspace: data.workspace ?? null }, false);
          if (data.user.role === 'admin') {
            setAuthorized(true);
            return;
          }
        }
        router.replace('/');
      } catch {
        router.replace('/');
      }
    })();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AdminDashboard />;
}
