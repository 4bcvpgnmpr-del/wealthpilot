import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";

const LiabilitySchema = z.object({
  label: z.string().min(1, "Ponle un nombre a esta deuda."),
  type: z.enum(["hipoteca", "prestamo_personal", "prestamo_coche", "tarjeta", "otros"]),
  outstanding: z.number().nonnegative("El importe pendiente no puede ser negativo."),
  interestRate: z.number().min(0).max(100, "El interés debe estar entre 0 y 100."),
  monthlyPayment: z.number().nonnegative("La cuota mensual no puede ser negativa."),
  endDate: z.string().datetime().optional().nullable(),
});

const LiabilityUpdateSchema = LiabilitySchema.partial();

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (id) {
    const liability = await prisma.liability.findFirst({ where: { id, userId } });
    if (!liability) return NextResponse.json({ error: "Deuda no encontrada." }, { status: 404 });
    return NextResponse.json(liability);
  }

  const liabilities = await prisma.liability.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(liabilities);
}

export async function POST(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (getId(params)) {
    return NextResponse.json({ error: "Método no permitido en este recurso." }, { status: 405 });
  }

  const parsed = LiabilitySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { endDate, ...rest } = parsed.data;
  const liability = await prisma.liability.create({
    data: { ...rest, endDate: endDate ? new Date(endDate) : null, userId },
  });
  return NextResponse.json(liability, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id de la deuda." }, { status: 400 });

  const existing = await prisma.liability.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Deuda no encontrada." }, { status: 404 });

  const parsed = LiabilityUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { endDate, ...rest } = parsed.data;
  const updated = await prisma.liability.update({
    where: { id },
    data: { ...rest, ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id de la deuda." }, { status: 400 });

  const existing = await prisma.liability.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Deuda no encontrada." }, { status: 404 });

  await prisma.liability.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
