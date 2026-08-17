import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";

const AssetSchema = z.object({
  label: z.string().min(1, "Ponle un nombre a este activo."),
  type: z.enum(["CASH", "BANK_ACCOUNT", "DEPOSIT", "EMERGENCY_FUND", "OTHER"]),
  amount: z.number().nonnegative("El importe no puede ser negativo."),
});

const AssetUpdateSchema = AssetSchema.partial();

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (id) {
    const asset = await prisma.asset.findFirst({ where: { id, userId } });
    if (!asset) return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });
    return NextResponse.json(asset);
  }

  const assets = await prisma.asset.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(assets);
}

export async function POST(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (getId(params)) {
    return NextResponse.json({ error: "Método no permitido en este recurso." }, { status: 405 });
  }

  const parsed = AssetSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const asset = await prisma.asset.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(asset, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del activo." }, { status: 400 });

  const existing = await prisma.asset.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });

  const parsed = AssetUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.asset.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del activo." }, { status: 400 });

  const existing = await prisma.asset.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Activo no encontrado." }, { status: 404 });

  await prisma.asset.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
