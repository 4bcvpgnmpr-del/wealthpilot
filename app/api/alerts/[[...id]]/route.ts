import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";
import { calculateMonthlyFlow, calculateGoalProgress } from "@/lib/finance-engine/core";
import {
  generateMonthlyAvailableAlert,
  generateGoalProgressAlerts,
  generateMissedContributionAlerts,
  type AlertType,
} from "@/lib/finance-engine/alerts";

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

function toMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum;
  }, 0);
}

/**
 * GET: recalcula las alertas candidatas a partir de los datos reales del
 * usuario, crea las que aún no existan (evitando duplicados por type+mensaje)
 * y devuelve la lista completa (nuevas + históricas), ordenada por fecha.
 */
export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (id) {
    const alert = await prisma.alert.findFirst({ where: { id, userId } });
    if (!alert) return NextResponse.json({ error: "Alerta no encontrada." }, { status: 404 });
    return NextResponse.json(alert);
  }

  const [incomes, expenses, goals] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
  ]);

  const candidates: { type: AlertType; message: string }[] = [];

  if (incomes.length > 0 || expenses.length > 0) {
    const flow = calculateMonthlyFlow({
      monthlyIncomeTotal: toMonthly(incomes),
      monthlyExpenseTotal: toMonthly(expenses),
    });
    const monthlyAlert = generateMonthlyAvailableAlert(flow.availableToInvest);
    if (monthlyAlert) candidates.push(monthlyAlert);
  }

  const goalsWithProgress = goals.map((g) => {
    const progress = calculateGoalProgress({
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
      monthlyContribution: Number(g.monthlyContribution),
      targetDate: g.targetDate ?? undefined,
    });
    return { name: g.name, progressPct: progress.progressPct, monthlyContribution: Number(g.monthlyContribution), onTrack: progress.onTrack };
  });

  candidates.push(...generateGoalProgressAlerts(goalsWithProgress));
  candidates.push(...generateMissedContributionAlerts(goalsWithProgress));

  // Evitar duplicados: solo crear las que no existan ya (mismo type + mensaje)
  const existing = await prisma.alert.findMany({ where: { userId }, select: { type: true, message: true } });
  const existingKeys = new Set(existing.map((e) => `${e.type}::${e.message}`));

  const toCreate = candidates.filter((c) => !existingKeys.has(`${c.type}::${c.message}`));
  if (toCreate.length > 0) {
    await prisma.alert.createMany({
      data: toCreate.map((c) => ({ userId, type: c.type, message: c.message })),
    });
  }

  const alerts = await prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(alerts);
}

const AlertUpdateSchema = z.object({
  isRead: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id de la alerta." }, { status: 400 });

  const existing = await prisma.alert.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Alerta no encontrada." }, { status: 404 });

  const parsed = AlertUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.alert.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id de la alerta." }, { status: 400 });

  const existing = await prisma.alert.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Alerta no encontrada." }, { status: 404 });

  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
