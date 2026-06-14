'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings2, Loader2, Save, Plug, ChevronUp, ChevronDown, ShieldCheck, Cloud, Copy, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AdminSecrets } from '@/components/dashboard/modules/admin-secrets';

type ProviderId = 'anthropic' | 'gemini' | 'openrouter';

interface Settings {
  models: {
    anthropic: string;
    gemini: string;
    openrouter: string;
    openai: string;
    geminiImage: string;
    openrouterTextFallbacks: string[];
    openrouterImageFallbacks: string[];
  };
  providerOrder: ProviderId[];
  features: { openRouterFallback: boolean; imageGeneration: boolean };
  compliance: { extraBlockedTerms: string[] };
}

interface GoogleDriveAdminConfig {
  configured: boolean;
  clientId: string;
  secretConfigured: boolean;
  source: 'admin' | 'environment' | null;
  callbackUrl: string;
}

const PROVIDER_META: Record<string, { label: string }> = {
  anthropic: { label: 'Anthropic (Claude)' },
  gemini: { label: 'Google Gemini' },
  openrouter: { label: 'OpenRouter' },
  openai: { label: 'OpenAI' },
};

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [configured, setConfigured] = useState<Record<string, boolean>>({});
  const [blockedTermsText, setBlockedTermsText] = useState('');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [googleDrive, setGoogleDrive] = useState<GoogleDriveAdminConfig | null>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [tests, setTests] = useState<Record<string, { loading: boolean; ok?: boolean; message?: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes, gdRes] = await Promise.all([
        fetch('/api/admin/settings', { credentials: 'include' }),
        fetch('/api/admin/status', { credentials: 'include' }),
        fetch('/api/admin/google-drive', { credentials: 'include' }),
      ]);
      if (sRes.status === 401 || sRes.status === 403) {
        setForbidden(true);
        return;
      }
      const sData = await sRes.json();
      setSettings(sData.settings);
      setBlockedTermsText((sData.settings.compliance.extraBlockedTerms ?? []).join('\n'));
      if (stRes.ok) {
        const stData = await stRes.json();
        const map: Record<string, boolean> = {};
        for (const p of stData.providers ?? []) map[p.id] = p.configured;
        setConfigured(map);
      }
      if (gdRes.ok) {
        const gdData = await gdRes.json();
        setGoogleDrive(gdData);
        setGoogleClientId(gdData.clientId || '');
      }
    } catch {
      toast.error('Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGoogleDrive = async () => {
    setSavingGoogle(true);
    try {
      const res = await fetch('/api/admin/google-drive', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: googleClientId.trim(),
          clientSecret: googleClientSecret.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not save Google Drive settings.');
      setGoogleDrive(data);
      setGoogleClientId(data.clientId || '');
      setGoogleClientSecret('');
      toast.success('Google Drive OAuth settings saved securely.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save Google Drive settings.');
    } finally {
      setSavingGoogle(false);
    }
  };

  const clearGoogleDriveOverride = async () => {
    setSavingGoogle(true);
    try {
      const res = await fetch('/api/admin/google-drive', { method: 'DELETE' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Could not restore environment settings.');
      setGoogleDrive(data);
      setGoogleClientId(data.clientId || '');
      setGoogleClientSecret('');
      toast.success(data.source === 'environment' ? 'Using environment credentials.' : 'Google Drive OAuth cleared.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not restore environment settings.');
    } finally {
      setSavingGoogle(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload = {
        ...settings,
        compliance: {
          extraBlockedTerms: blockedTermsText.split('\n').map((t) => t.trim()).filter(Boolean).slice(0, 200),
        },
      };
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error('Save failed.');
        return;
      }
      const data = await res.json();
      setSettings(data.settings);
      setBlockedTermsText((data.settings.compliance.extraBlockedTerms ?? []).join('\n'));
      toast.success('Settings saved.');
    } catch {
      toast.error('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider: string) => {
    setTests((t) => ({ ...t, [provider]: { loading: true } }));
    try {
      const res = await fetch('/api/admin/test-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTests((t) => ({ ...t, [provider]: { loading: false, ok: data.ok, message: data.message || data.error } }));
    } catch {
      setTests((t) => ({ ...t, [provider]: { loading: false, ok: false, message: 'Request failed.' } }));
    }
  };

  const moveProvider = (index: number, dir: -1 | 1) => {
    if (!settings) return;
    const order = [...settings.providerOrder];
    const target = index + dir;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    setSettings({ ...settings, providerOrder: order });
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="h-10 w-10 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-800">Admin access required</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Settings are restricted to platform administrators.</p>
      </div>
    );
  }
  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  const setModel = (key: 'anthropic' | 'gemini' | 'openrouter' | 'openai' | 'geminiImage', value: string) =>
    setSettings({ ...settings, models: { ...settings.models, [key]: value } });
  const setModelList = (key: 'openrouterTextFallbacks' | 'openrouterImageFallbacks', value: string) =>
    setSettings({
      ...settings,
      models: {
        ...settings.models,
        [key]: value.split('\n').map((model) => model.trim()).filter(Boolean),
      },
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-slate-500" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Settings & API</h2>
            <p className="text-sm text-slate-500">Configure AI providers, models, fallback order, and compliance.</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2 bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save changes
        </Button>
      </div>

      {/* API keys & secrets — admin-managed, encrypted in DB */}
      <AdminSecrets />

      {/* Providers / API */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Plug className="h-4 w-4 text-[#035EF9]" />
          <h3 className="text-sm font-semibold text-slate-800">AI Providers & Models</h3>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          Keys are managed above in “API Keys & Secrets”. Here you choose the model per provider and test connectivity.
        </p>
        <div className="space-y-3">
          {(['anthropic', 'gemini', 'openrouter', 'openai'] as const).map((id) => {
            const test = tests[id];
            return (
              <div key={id} className="rounded-lg border border-slate-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{PROVIDER_META[id].label}</span>
                    <Badge variant="outline" className={configured[id] ? 'text-emerald-600 border-emerald-200' : 'text-slate-400'}>
                      {configured[id] ? 'Key set' : 'No key'}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={test?.loading} onClick={() => testProvider(id)}>
                    {test?.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
                    Test
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Label className="w-16 text-xs text-slate-500">Model</Label>
                  <Input
                    value={settings.models[id]}
                    onChange={(e) => setModel(id, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {id === 'openrouter' && (
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-xs text-slate-500">Text fallback models</Label>
                    <Textarea
                      value={settings.models.openrouterTextFallbacks.join('\n')}
                      onChange={(event) => setModelList('openrouterTextFallbacks', event.target.value)}
                      className="min-h-[96px] font-mono text-xs"
                    />
                    <p className="text-[11px] text-slate-400">
                      Content, analysis, policy review, and agent reports only. One model per line, in fallback order.
                    </p>
                  </div>
                )}
                {test?.message && (
                  <p className={`mt-1.5 text-xs ${test.ok ? 'text-emerald-600' : 'text-red-500'}`}>{test.message}</p>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-2">
            <Label className="w-16 text-xs text-slate-500">Image</Label>
            <Input
              value={settings.models.geminiImage}
              onChange={(e) => setModel('geminiImage', e.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-xs text-slate-400">OpenRouter image model</span>
          </div>
          <div className="space-y-1.5 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
            <Label className="text-xs font-medium text-slate-600">Image fallback models</Label>
            <Textarea
              value={settings.models.openrouterImageFallbacks.join('\n')}
              onChange={(event) => setModelList('openrouterImageFallbacks', event.target.value)}
              className="min-h-[86px] bg-white font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400">
              Used exclusively to generate product images. They are never routed to copywriting, analysis, or compliance tasks.
            </p>
          </div>
        </div>
      </Card>

      {/* Google Drive OAuth */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-[#035EF9]" />
              <h3 className="text-sm font-semibold text-slate-800">Google Drive & Sheets OAuth</h3>
              <Badge
                variant="outline"
                className={googleDrive?.configured ? 'border-emerald-200 text-emerald-600' : 'border-amber-200 text-amber-600'}
              >
                {googleDrive?.configured ? 'Configured' : 'Not configured'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Manage the credentials used when users connect their own Google Drive account.
            </p>
          </div>
          {googleDrive?.source && (
            <Badge variant="secondary">
              Source: {googleDrive.source === 'admin' ? 'Admin dashboard' : 'Environment'}
            </Badge>
          )}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="google-client-id" className="text-xs text-slate-600">Google OAuth Client ID</Label>
            <Input
              id="google-client-id"
              value={googleClientId}
              onChange={(event) => setGoogleClientId(event.target.value)}
              placeholder="123456789.apps.googleusercontent.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-client-secret" className="text-xs text-slate-600">Google OAuth Client Secret</Label>
            <Input
              id="google-client-secret"
              type="password"
              value={googleClientSecret}
              onChange={(event) => setGoogleClientSecret(event.target.value)}
              placeholder={googleDrive?.secretConfigured ? 'Stored securely - enter only to replace' : 'Enter client secret'}
              autoComplete="new-password"
            />
            <p className="text-[11px] text-slate-400">The stored secret is encrypted and is never returned to this page.</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Authorized redirect URI</Label>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-700">
              {googleDrive?.callbackUrl || 'http://localhost:3000/api/google-drive/callback'}
            </code>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={async () => {
                await navigator.clipboard.writeText(googleDrive?.callbackUrl || 'http://localhost:3000/api/google-drive/callback');
                toast.success('Callback URL copied.');
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {googleDrive?.source === 'admin' && (
            <Button type="button" variant="outline" onClick={clearGoogleDriveOverride} disabled={savingGoogle}>
              <Trash2 className="mr-2 h-4 w-4" />
              Use environment values
            </Button>
          )}
          <Button
            type="button"
            onClick={saveGoogleDrive}
            disabled={savingGoogle || !googleClientId.trim()}
            className="bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90"
          >
            {savingGoogle ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Google settings
          </Button>
        </div>
      </Card>

      {/* Provider order */}
      <Card className="p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Provider fallback order</h3>
        <p className="mb-3 text-xs text-slate-400">Text generation tries providers in this order until one succeeds.</p>
        <div className="space-y-2">
          {settings.providerOrder.map((id, i) => (
            <div key={id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
              <span className="text-sm text-slate-700">{i + 1}. {PROVIDER_META[id].label}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === 0} onClick={() => moveProvider(i, -1)}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" disabled={i === settings.providerOrder.length - 1} onClick={() => moveProvider(i, 1)}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Features */}
      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Features</h3>
        <div className="space-y-3">
          <ToggleRow
            label="OpenRouter fallback"
            description="Allow OpenRouter in the configured provider order for workflow generation."
            checked={settings.features.openRouterFallback}
            onChange={(v) => setSettings({ ...settings, features: { ...settings.features, openRouterFallback: v } })}
          />
          <ToggleRow
            label="Product image generation"
            description="Generate listing images through the configured OpenRouter image model."
            checked={settings.features.imageGeneration}
            onChange={(v) => setSettings({ ...settings, features: { ...settings.features, imageGeneration: v } })}
          />
        </div>
      </Card>

      {/* Compliance */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#E82E33]" />
          <h3 className="text-sm font-semibold text-slate-800">Compliance hard-gate</h3>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          Extra blocked terms (one per line). Any listing input containing these is blocked before the AI workflow runs — on top of the built-in prohibited-claim patterns.
        </p>
        <Textarea
          value={blockedTermsText}
          onChange={(e) => setBlockedTermsText(e.target.value)}
          placeholder={'miracle cure\nfastest on the market\nclinically proven'}
          className="min-h-[120px] text-sm"
        />
      </Card>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
