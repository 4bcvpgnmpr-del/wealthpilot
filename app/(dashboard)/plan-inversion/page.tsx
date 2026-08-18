import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { calculateMonthlyFlow } from "@/lib/finance-engine/core";
import { calculateInvestmentAllocation } from "@/lib/finance-engine/allocation";
import { InvestmentPlanView } from "@/components/dashboard/investment-plan-view";
import type { RiskCategory } from "@/lib/risk-profile/scoring";

function toMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum;
  }, 0);
}

export default async function PlanInversionPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const [incomes, expenses, riskProfile] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.riskProfile.findUnique({ where: { userId } }),
  ]);

  let proposal = null;
  let error: string | null = null;

  if (incomes.length === 0 && expenses.length === 0) {
    error = "Necesitamos tus ingresos y gastos para calcular tu plan.";
  } else if (!riskProfile) {
    error = "Necesitamos tu perfil de riesgo para calcular tu plan.";
  } else {
    const flow = calculateMonthlyFlow({
      monthlyIncomeTotal: toMonthly(incomes),
      monthlyExpenseTotal: toMonthly(expenses),
    });

    if (flow.availableToInvest <= 0) {
      error = "Ahora mismo no hay capital disponible para invertir según tus datos.";
    } else {
      const allocation = calculateInvestmentAllocation({
        availableCapital: flow.availableToInvest,
        riskCategory: riskProfile.category as RiskCategory,
      });
      proposal = { flow, riskCategory: riskProfile.category, allocation };
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Estrategia</p>
        <h1 className="figure text-3xl font-medium mb-1">Plan de inversión</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Una propuesta orientativa basada en tu capital disponible y tu perfil de riesgo.
        </p>
      </header>

      <InvestmentPlanView initialProposal={proposal} initialError={error} />
    </div>
  );
}
