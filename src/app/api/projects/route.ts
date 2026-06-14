import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  marketplace: string;
  country: string;
  status: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDashboardProject(p: ProjectRow) {
  return {
    id: p.id,
    name: p.name,
    marketplace: p.marketplace,
    country: p.country,
    status: p.status,
    agentId: p.agentId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const createSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  name: z.string().trim().min(1).max(160),
  marketplace: z.string().trim().max(60).optional(),
  country: z.string().trim().max(60).optional(),
  status: z.string().trim().max(20).optional(),
  agentId: z.string().trim().max(40).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(160).optional(),
  status: z.string().trim().max(20).optional(),
  marketplace: z.string().trim().max(60).optional(),
  country: z.string().trim().max(60).optional(),
  agentId: z.string().trim().max(40).optional(),
});

export async function GET(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "projects-get", limit: 120, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const projects = await db.project.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ projects: projects.map(toDashboardProject) });
}

export async function POST(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "projects-post", limit: 60, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project." }, { status: 400 });

  const { id, name, marketplace, country, status, agentId } = parsed.data;

  // A client-generated id keeps the row stable across optimistic create + sync.
  // We must NOT upsert on the bare global id: that would let a caller overwrite
  // another org's project by guessing its id. Only update a row we own; otherwise
  // create a fresh one (ignoring the supplied id if it collides with someone else's).
  if (id) {
    const owned = await db.project.findFirst({
      where: { id, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (owned) {
      const project = await db.project.update({
        where: { id },
        data: { name, ...(status ? { status } : {}) },
      });
      return NextResponse.json({ project: toDashboardProject(project) }, { status: 200 });
    }
    // id belongs to another org (or doesn't exist yet): fall through to create.
    const taken = await db.project.findUnique({ where: { id }, select: { id: true } });
    if (taken) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const project = await db.project.create({
    data: {
      ...(id ? { id } : {}),
      organizationId: ctx.organizationId,
      name,
      marketplace: marketplace || "Amazon Egypt",
      country: country || "Egypt",
      status: status || "draft",
      agentId: agentId || "ali",
    },
  });
  return NextResponse.json({ project: toDashboardProject(project) }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "projects-patch", limit: 60, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });

  const { id, ...patch } = parsed.data;
  const existing = await db.project.findFirst({ where: { id, organizationId: ctx.organizationId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const project = await db.project.update({ where: { id }, data: patch });
  return NextResponse.json({ project: toDashboardProject(project) });
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireOrg(request, { scope: "projects-delete", limit: 60, windowMs: 60_000 });
  if (!ctx.ok) return ctx.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing project id." }, { status: 400 });
  await db.project.deleteMany({ where: { id, organizationId: ctx.organizationId } });
  return NextResponse.json({ success: true });
}
