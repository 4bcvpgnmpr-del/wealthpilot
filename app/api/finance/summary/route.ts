import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { calculateMonthlyFlow } from "@/lib/finance-engine/core";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
  ]);

  const monthlyIncomeTotal = toMonthly(incomes);
  const monthlyExpenseTotal = toMonthly(expenses);

  if (incomes.length === 0 && expenses.length === 0) {
    return NextResponse.json({
      hasData: false,
      message: "Todavía no has introducido ingresos ni gastos.",
    });
  }

  const flow = calculateMonthlyFlow({ monthlyIncomeTotal, monthlyExpenseTotal });

  return NextResponse.json({ hasData: true, flow });
}

function toMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum;
  }, 0);
}
