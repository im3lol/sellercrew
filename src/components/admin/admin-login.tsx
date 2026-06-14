'use client';

import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLogin({ onAuthenticated }: { onAuthenticated: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.authenticated) {
        setError(data?.error || 'Invalid email or password.');
        return;
      }
      onAuthenticated(data.email);
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F8F9FB] px-4 py-10">
      <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#7E44E6]/10 blur-3xl" />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#035EF9] via-[#7E44E6] to-[#FC7403] p-1 shadow-lg shadow-[#7E44E6]/15">
              <div className="h-full w-full overflow-hidden rounded-[12px] bg-white">
                <img src="/agents/ali.png" alt="SellerCrew" className="h-full w-full object-cover" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-extrabold tracking-[-0.055em] text-[#07101f]">sellercrew</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7E44E6]">Secure administration</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B0F1A] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#0B0F1A]">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Use the dedicated SellerCrew administrator credentials.</p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@sellercrew.ai"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-6 h-11 w-full bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
            Sign in securely
          </Button>
        </form>
      </div>
    </div>
  );
}
