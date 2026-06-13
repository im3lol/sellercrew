'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings2, Loader2, Save, Plug, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

type ProviderId = 'anthropic' | 'gemini' | 'openrouter';

interface Settings {
  models: { anthropic: string; gemini: string; openrouter: string; openai: string; geminiImage: string };
  providerOrder: ProviderId[];
  features: { openRouterFallback: boolean; imageGeneration: boolean };
  compliance: { extraBlockedTerms: string[] };
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
  const [tests, setTests] = useState<Record<string, { loading: boolean; ok?: boolean; message?: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, stRes] = await Promise.all([
        fetch('/api/admin/settings', { credentials: 'include' }),
        fetch('/api/admin/status', { credentials: 'include' }),
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
    } catch {
      toast.error('Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

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
        <p className="mt-1 max-w-sm text-sm text-slate-500">Settings are managed by workspace owners and admins only.</p>
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

  const setModel = (key: keyof Settings['models'], value: string) =>
    setSettings({ ...settings, models: { ...settings.models, [key]: value } });

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

      {/* Providers / API */}
      <Card className="p-5">
        <div className="mb-1 flex items-center gap-2">
          <Plug className="h-4 w-4 text-[#035EF9]" />
          <h3 className="text-sm font-semibold text-slate-800">AI Providers & API</h3>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          API keys are configured securely via environment variables (.env). Here you set the model per provider and test connectivity.
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
            <span className="text-xs text-slate-400">Gemini image model</span>
          </div>
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
            description="Fall back to OpenRouter when Anthropic and Gemini fail or run out of quota."
            checked={settings.features.openRouterFallback}
            onChange={(v) => setSettings({ ...settings, features: { ...settings.features, openRouterFallback: v } })}
          />
          <ToggleRow
            label="Product image generation"
            description="Generate listing images in the workflow (uses the Gemini image model)."
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
