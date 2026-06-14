'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Upload,
  Trash2,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PolicyRule {
  id: string;
  category: string;
  title: string;
  ruleText: string;
  severity: string;
  keywords: string[];
  status: string;
  duplicateOfId: string | null;
  note: string | null;
}

interface PolicyDocument {
  id: string;
  title: string;
  fileName: string;
  status: string;
  createdAt: string;
  rules: PolicyRule[];
}

const CATEGORY_LABELS: Record<string, string> = {
  health_medical_claims: 'Health & Medical Claims',
  restricted_prohibited_products: 'Restricted & Prohibited',
  ip_trademark_brand: 'IP, Trademark & Brand',
  images_media: 'Images & Media',
  pricing_offers: 'Pricing & Offers',
  reviews_ratings: 'Reviews & Ratings',
  product_safety: 'Product Safety',
  listing_content_format: 'Listing Content & Format',
  general: 'General',
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export function PolicyBank() {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/policies', { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setDocuments(data.documents ?? []);
      setTotals(data.totals ?? {});
    } catch {
      toast.error('Could not load the policy bank.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const markdown = await file.text();
        if (!markdown.trim()) {
          toast.error(`${file.name} is empty.`);
          continue;
        }
        const res = await fetch('/api/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, markdown }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error(data?.error || `Failed to process ${file.name}.`);
          continue;
        }
        const s = data.summary;
        toast.success(
          `${file.name}: ${s.created} new rule(s), ${s.exactDuplicates + s.semanticDuplicates} duplicate(s) flagged.`
        );
      }
      await load();
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteDocument = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}" and all its rules?`)) return;
    const res = await fetch(`/api/policies?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Document deleted.');
      await load();
    } else {
      toast.error('Could not delete the document.');
    }
  };

  const resolveRule = async (id: string, action: 'keep' | 'archive') => {
    const res = await fetch('/api/policies/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      toast.success(action === 'keep' ? 'Rule kept as active.' : 'Rule archived.');
      await load();
    } else {
      toast.error('Could not update the rule.');
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="h-10 w-10 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-800">Admin access required</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          The policy knowledge base is restricted to platform administrators.
        </p>
      </div>
    );
  }

  const allRules = documents.flatMap((doc) => doc.rules);
  const activeRules = allRules.filter((r) => r.status === 'active');
  const duplicates = allRules.filter((r) => r.status === 'duplicate');

  return (
    <div className="space-y-6">
      {/* Header / upload */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E82E33]/10">
              <ShieldCheck className="h-6 w-6 text-[#E82E33]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Policy Knowledge Base</h2>
              <p className="mt-0.5 max-w-xl text-sm text-slate-500">
                Saleem&apos;s compliance memory. Upload .md policy files — they are parsed into
                organized, deduplicated rules that Saleem references during every review.
              </p>
            </div>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.markdown,text/markdown,text/plain"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="gap-2 bg-[#0B0F1A] text-white hover:bg-[#0B0F1A]/90"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Processing...' : 'Upload .md policy'}
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Documents" value={documents.length} />
          <Stat label="Active rules" value={totals.active ?? activeRules.length} />
          <Stat label="Duplicates flagged" value={totals.duplicate ?? duplicates.length} accent="amber" />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-base font-semibold text-slate-800">No policies yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Upload your first Amazon policy document (.md) to start building Saleem&apos;s knowledge base.
          </p>
        </Card>
      ) : (
        <>
          {/* Duplicates review */}
          {duplicates.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/40 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">
                  {duplicates.length} duplicate rule(s) detected — review before they go live
                </h3>
              </div>
              <div className="mt-4 space-y-3">
                {duplicates.map((rule) => (
                  <div key={rule.id} className="rounded-lg border border-amber-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{rule.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{rule.ruleText}</p>
                        {rule.note && (
                          <p className="mt-1 text-xs italic text-amber-700">{rule.note}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => resolveRule(rule.id, 'keep')}>
                          <RotateCcw className="h-3 w-3" /> Keep
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs text-slate-500" onClick={() => resolveRule(rule.id, 'archive')}>
                          <Archive className="h-3 w-3" /> Discard
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents */}
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{doc.title}</p>
                      <p className="text-xs text-slate-400">
                        {doc.fileName} · {doc.rules.length} rule(s)
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1 text-xs text-slate-400 hover:text-red-500"
                    onClick={() => deleteDocument(doc.id, doc.title)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
                <div className="divide-y divide-slate-50">
                  {doc.rules
                    .filter((r) => r.status === 'active')
                    .map((rule) => (
                      <div key={rule.id} className="flex items-start gap-3 px-5 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{rule.title}</span>
                            <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLES[rule.severity] ?? ''}`}>
                              {rule.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-slate-500">
                              {CATEGORY_LABELS[rule.category] ?? rule.category}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">{rule.ruleText}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'amber' }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <p className={`text-2xl font-bold ${accent === 'amber' ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
