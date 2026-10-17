import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";

// Icono propio opcional: "" o null → icono por defecto del tipo/categoría
const optionalIcon = z
  .string()
  .trim()
  .max(16, "Icono no válido.")
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const GoalSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre a este objetivo."),
  icon: optionalIcon,
  type: z.enum([
    "HOME",
    "CAR",
    "TRIP",
    "EMERGENCY_FUND",
    "RETIREMENT",
    "FINANCIAL_INDEPENDENCE",
    "NET_WORTH_TARGET",
    "CUSTOM",
  ]),
  targetAmount: z.number().positive("El importe objetivo debe ser mayor que 0."),
  currentAmount: z.number().nonnegative("El importe actual no puede ser negativo.").default(0),
  targetDate: z.string().datetime().optional().nullable(),
  monthlyContribution: z.number().nonnegative().default(0),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  riskTolerance: z.enum(["conservador", "moderado", "dinamico"]).optional().nullable(),
});

const GoalUpdateSchema = GoalSchema.partial();

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (id) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) return NextResponse.json({ error: "Objetivo no encontrado." }, { status: 404 });
    return NextResponse.json(goal);
  }

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(goals);
}

export async function POST(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (getId(params)) {
    return NextResponse.json({ error: "Método no permitido en este recurso." }, { status: 405 });
  }

  const parsed = GoalSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { targetDate, ...rest } = parsed.data;
  const goal = await prisma.goal.create({
    data: { ...rest, targetDate: targetDate ? new Date(targetDate) : null, userId },
  });
  return NextResponse.json(goal, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del objetivo." }, { status: 400 });

  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Objetivo no encontrado." }, { status: 404 });

  const parsed = GoalUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { targetDate, ...rest } = parsed.data;
  const updated = await prisma.goal.update({
    where: { id },
    data: { ...rest, ...(targetDate !== undefined ? { targetDate: targetDate ? new Date(targetDate) : null } : {}) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id del objetivo." }, { status: 400 });

  const existing = await prisma.goal.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Objetivo no encontrado." }, { status: 404 });

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
