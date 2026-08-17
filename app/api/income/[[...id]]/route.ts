import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";

// Ruta consolidada: /api/income (colección) y /api/income/[id] (item) viven en
// el mismo archivo mediante un segmento dinámico opcional ([[...id]]). Esto
// reduce el número de funciones serverless generadas en Vercel — el plan
// Hobby permite un máximo de 12; separar cada recurso en 2 archivos duplicaba
// el conteo innecesariamente.

const IncomeSchema = z.object({
  label: z.string().min(1, "Ponle un nombre a este ingreso."),
  category: z.enum(["salario", "alquileres", "trabajos_extra", "dividendos", "otros"]),
  amount: z.number().positive("El importe debe ser mayor que 0."),
  recurrence: z.enum(["ONE_TIME", "MONTHLY", "ANNUAL"]),
});

const IncomeUpdateSchema = IncomeSchema.partial();

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (id) {
    const income = await prisma.income.findFirst({ where: { id, userId } });
    if (!income) return NextResponse.json({ error: "Ingreso no encontrado." }, { status: 404 });
    return NextResponse.json(income);
  }

  const incomes = await prisma.income.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(incomes);
}

export async function POST(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (getId(params)) {
    return NextResponse.json({ error: "Método no permitido en este recurso." }, { status: 405 });
  }

  const parsed = IncomeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const income = await prisma.income.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(income, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del ingreso." }, { status: 400 });

  const existing = await prisma.income.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Ingreso no encontrado." }, { status: 404 });

  const parsed = IncomeUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.income.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del ingreso." }, { status: 400 });

  const existing = await prisma.income.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Ingreso no encontrado." }, { status: 404 });

  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
