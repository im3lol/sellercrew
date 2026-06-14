'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, KeyRound, Loader2, Save, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SecretStatus {
  name: string;
  label: string;
  group: string;
  groupTitle: string;
  groupDescription: string;
  configured: boolean;
  source: 'admin' | 'environment' | null;
}

interface SecretGroup {
  id: string;
  title: string;
  description: string;
  items: SecretStatus[];
}

export function AdminSecrets() {
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/secrets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSecrets(data.secrets ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group secrets by their group, preserving the server-defined order.
  const groups = useMemo<SecretGroup[]>(() => {
    const byId = new Map<string, SecretGroup>();
    const ordered: SecretGroup[] = [];
    for (const s of secrets) {
      let g = byId.get(s.group);
      if (!g) {
        g = { id: s.group, title: s.groupTitle, description: s.groupDescription, items: [] };
        byId.set(s.group, g);
        ordered.push(g);
      }
      g.items.push(s);
    }
    return ordered;
  }, [secrets]);

  const save = async (name: string) => {
    const value = (values[name] ?? '').trim();
    if (!value) return;
    setBusy(name);
    try {
      const res = await fetch('/api/admin/secrets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || 'Could not save the secret.');
        return;
      }
      setSecrets(data.secrets ?? []);
      setValues((v) => ({ ...v, [name]: '' }));
      toast.success(`${name} saved securely.`);
    } catch {
      toast.error('Could not save the secret.');
    } finally {
      setBusy(null);
    }
  };

  const clear = async (name: string) => {
    setBusy(name);
    try {
      const res = await fetch(`/api/admin/secrets?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setSecrets(data.secrets ?? []);
        toast.success(`${name} cleared (falls back to .env if present).`);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-[#FC7403]" />
        <h3 className="text-sm font-semibold text-slate-800">API Keys & Secrets</h3>
      </div>
      <p className="mb-4 text-xs text-slate-400">
        Stored encrypted in the database and used at runtime (overrides .env). Paste a value to set or replace it —
        existing values are never shown.
      </p>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isCollapsed = collapsed[group.id];
            const setCount = group.items.filter((s) => s.configured).length;
            return (
              <div key={group.id} className="rounded-xl border border-slate-200">
                <button
                  type="button"
                  aria-expanded={!isCollapsed}
                  onClick={() => setCollapsed((c) => ({ ...c, [group.id]: !isCollapsed }))}
                  className="flex w-full items-center justify-between gap-2 rounded-t-xl bg-slate-50 px-4 py-2.5 text-left hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-700">{group.title}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] text-slate-500">
                    {setCount}/{group.items.length} set
                  </Badge>
                </button>

                {!isCollapsed && (
                  <div className="space-y-3 p-3">
                    {group.description && <p className="px-1 text-xs text-slate-400">{group.description}</p>}
                    {group.items.map((s) => (
                      <div key={s.name} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{s.label}</span>
                            <Badge
                              variant="outline"
                              className={s.configured ? 'border-emerald-200 text-emerald-600' : 'text-slate-400'}
                            >
                              {s.source === 'admin'
                                ? 'Set (dashboard)'
                                : s.source === 'environment'
                                ? 'From .env'
                                : 'Not set'}
                            </Badge>
                          </div>
                          {s.source === 'admin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-xs text-slate-400 hover:text-red-500"
                              disabled={busy === s.name}
                              onClick={() => clear(s.name)}
                            >
                              <Trash2 className="h-3 w-3" /> Clear
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            type="password"
                            placeholder={s.configured ? '•••••••• (paste to replace)' : 'Paste value'}
                            value={values[s.name] ?? ''}
                            onChange={(e) => setValues((v) => ({ ...v, [s.name]: e.target.value }))}
                            className="h-8 text-sm"
                          />
                          <Button
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            disabled={busy === s.name || !(values[s.name] ?? '').trim()}
                            onClick={() => save(s.name)}
                          >
                            {busy === s.name ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}{' '}
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
