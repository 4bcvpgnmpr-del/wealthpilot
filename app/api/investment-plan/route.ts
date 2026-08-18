import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";
import { calculateMonthlyFlow } from "@/lib/finance-engine/core";
import { calculateInvestmentAllocation } from "@/lib/finance-engine/allocation";
import type { RiskCategory } from "@/lib/risk-profile/scoring";

// GET: calcula (sin persistir) la propuesta actual a partir de los datos reales del usuario.
// POST: genera y persiste un InvestmentPlan + Recommendation con snapshot de los datos usados
//       (igual que exige el spec en la sección 8: trazabilidad de por qué se generó cada propuesta).

async function buildProposal(userId: string) {
  const [incomes, expenses, riskProfile] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.riskProfile.findUnique({ where: { userId } }),
  ]);

  if (incomes.length === 0 && expenses.length === 0) {
    return { error: "Necesitamos tus ingresos y gastos para calcular tu plan." as const };
  }
  if (!riskProfile) {
    return { error: "Necesitamos tu perfil de riesgo para calcular tu plan." as const };
  }

  const flow = calculateMonthlyFlow({
    monthlyIncomeTotal: toMonthly(incomes),
    monthlyExpenseTotal: toMonthly(expenses),
  });

  if (flow.availableToInvest <= 0) {
    return { error: "Ahora mismo no hay capital disponible para invertir según tus datos." as const };
  }

  const allocation = calculateInvestmentAllocation({
    availableCapital: flow.availableToInvest,
    riskCategory: riskProfile.category as RiskCategory,
  });

  return {
    flow,
    riskCategory: riskProfile.category as RiskCategory,
    allocation,
    dataSnapshot: { flow, riskCategory: riskProfile.category, incomeCount: incomes.length, expenseCount: expenses.length },
  };
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const proposal = await buildProposal(userId);
  if ("error" in proposal) return NextResponse.json({ error: proposal.error }, { status: 200 });

  return NextResponse.json(proposal);
}

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const proposal = await buildProposal(userId);
  if ("error" in proposal) return NextResponse.json({ error: proposal.error }, { status: 400 });

  const plan = await prisma.investmentPlan.create({
    data: {
      userId,
      availableCapital: proposal.allocation.availableCapital,
      allocation: proposal.allocation.allocations as any,
      rationale: proposal.allocation.rationale,
    },
  });

  await prisma.recommendation.create({
    data: {
      investmentPlanId: plan.id,
      summary: proposal.allocation.rationale,
      dataSnapshot: proposal.dataSnapshot as any,
    },
  });

  return NextResponse.json({ ...proposal, planId: plan.id }, { status: 201 });
}

function toMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum;
  }, 0);
}
