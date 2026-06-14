import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ListingRow = {
  id: string;
  projectId: string;
  productName: string | null;
  title: string | null;
  bullets: string;
  description: string | null;
  keywords: string;
  score: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function parseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toDashboardListing(l: ListingRow) {
  return {
    id: l.id,
    projectId: l.projectId,
    productName: l.productName ?? "",
    title: l.title ?? "",
    bullets: parseArray(l.bullets),
    description: l.description ?? "",
    keywords: parseArray(l.keywords),
    complianceScore: l.score,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

const upsertSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  projectId: z.string().min(1),
  productName: z.string().trim().max(200).optional(),
  title: z.string().max(400).optional(),
  bullets: z.array(z.string().max(1000)).max(20).optional(),
  description: z.string().max(20_000).optional(),
  keywords: z.array(z.string().max(120)).max(100).optional(),
  complianceScore: z.number().int().min(0).max(100).optional(),
  status: z.string().trim().max(20).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.string().trim().max(20).optional(),
  complianceScore: z.number().int().min(0).max(100).optional(),
});

export async function GET(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "listings-get", limit: 120, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const listings = await db.listing.findMany({
    where: { project: { organizationId: ctx.organizationId } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ listings: listings.map(toDashboardListing) });
}

export async function POST(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "listings-post", limit: 60, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid listing." }, { status: 400 });

  const { id, projectId, productName, title, bullets, description, keywords, complianceScore, status } = parsed.data;
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId: ctx.organizationId },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const data = {
    projectId,
    productName: productName ?? null,
    title: title ?? null,
    bullets: JSON.stringify(bullets ?? []),
    description: description ?? null,
    keywords: JSON.stringify(keywords ?? []),
    score: complianceScore ?? 0,
    status: status || "generated",
  };

  // Don't upsert on the bare global id: a caller could otherwise pass a victim's
  // listing id with their own projectId and re-parent/overwrite it. Only update a
  // listing whose project we own; otherwise create.
  if (id) {
    const owned = await db.listing.findFirst({
      where: { id, project: { organizationId: ctx.organizationId } },
      select: { id: true },
    });
    if (owned) {
      const listing = await db.listing.update({ where: { id }, data });
      return NextResponse.json({ listing: toDashboardListing(listing) }, { status: 200 });
    }
    const taken = await db.listing.findUnique({ where: { id }, select: { id: true } });
    if (taken) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const listing = await db.listing.create({ data: { ...(id ? { id } : {}), ...data } });
  return NextResponse.json({ listing: toDashboardListing(listing) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "listings-patch", limit: 60, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const { id, status, complianceScore } = parsed.data;
  const existing = await db.listing.findFirst({
    where: { id, project: { organizationId: ctx.organizationId } },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const listing = await db.listing.update({
    where: { id },
    data: { ...(status ? { status } : {}), ...(complianceScore != null ? { score: complianceScore } : {}) },
  });
  return NextResponse.json({ listing: toDashboardListing(listing) });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "listings-delete", limit: 60, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing listing id." }, { status: 400 });
  await db.listing.deleteMany({ where: { id, project: { organizationId: ctx.organizationId } } });
  return NextResponse.json({ success: true });
}
