import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";

const ExpenseSchema = z.object({
  label: z.string().min(1, "Ponle un nombre a este gasto."),
  category: z.enum([
    "vivienda",
    "alimentacion",
    "transporte",
    "seguros",
    "ocio",
    "viajes",
    "prestamos",
    "suscripciones",
    "otros",
  ]),
  amount: z.number().positive("El importe debe ser mayor que 0."),
  type: z.enum(["FIXED", "VARIABLE"]),
  recurrence: z.enum(["ONE_TIME", "MONTHLY", "ANNUAL"]),
});

const ExpenseUpdateSchema = ExpenseSchema.partial();

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (id) {
    const expense = await prisma.expense.findFirst({ where: { id, userId } });
    if (!expense) return NextResponse.json({ error: "Gasto no encontrado." }, { status: 404 });
    return NextResponse.json(expense);
  }

  const expenses = await prisma.expense.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (getId(params)) {
    return NextResponse.json({ error: "Método no permitido en este recurso." }, { status: 405 });
  }

  const parsed = ExpenseSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const expense = await prisma.expense.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(expense, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del gasto." }, { status: 400 });

  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Gasto no encontrado." }, { status: 404 });

  const parsed = ExpenseUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.expense.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del gasto." }, { status: 400 });

  const existing = await prisma.expense.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Gasto no encontrado." }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
