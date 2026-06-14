'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { AdminLogin } from '@/components/admin/admin-login';

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/admin/auth/status', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.authenticated) setAdminEmail(data.email);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F8F9FB]">
        <Loader2 className="h-6 w-6 animate-spin text-[#7E44E6]" />
      </div>
    );
  }

  if (!adminEmail) return <AdminLogin onAuthenticated={setAdminEmail} />;
  return <AdminDashboard adminEmail={adminEmail} onSignedOut={() => setAdminEmail(null)} />;
}
