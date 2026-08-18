import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db/client";
import { calculateMonthlyFlow, simulateThreeScenarios } from "@/lib/finance-engine/core";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Construye el contexto financiero REAL de un usuario a partir de la base
 * de datos. Nunca se rellena con valores inventados: si un dato no existe,
 * se marca explícitamente como "no_proporcionado" para que el modelo lo
 * comunique al usuario en vez de asumir cifras.
 */
async function buildUserFinancialContext(userId: string) {
  const [incomes, expenses, goals, riskProfile, portfolio] = await Promise.all([
    prisma.income.findMany({ where: { userId } }),
    prisma.expense.findMany({ where: { userId } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.riskProfile.findUnique({ where: { userId } }),
    prisma.portfolio.findUnique({ where: { userId }, include: { investments: true } }),
  ]);

  const monthlyIncomeTotal = sumMonthly(incomes);
  const monthlyExpenseTotal = sumMonthly(expenses);

  const flow =
    incomes.length > 0 || expenses.length > 0
      ? calculateMonthlyFlow({ monthlyIncomeTotal, monthlyExpenseTotal })
      : null;

  return {
    ingresos: incomes.length ? incomes.map(serializeIncome) : "no_proporcionado",
    gastos: expenses.length ? expenses.map(serializeExpense) : "no_proporcionado",
    flujo_mensual: flow ?? "no_calculable_faltan_datos",
    objetivos: goals.length ? goals.map(serializeGoal) : "no_proporcionado",
    perfil_riesgo: riskProfile
      ? { categoria: riskProfile.category, score: riskProfile.score }
      : "no_realizado",
    cartera: portfolio?.investments.length
      ? portfolio.investments.map(serializeInvestment)
      : "no_proporcionado",
  };
}

const SYSTEM_PROMPT = `Eres el asistente financiero educativo de WealthPilot.

REGLAS ESTRICTAS:
1. Usa ÚNICAMENTE los datos financieros reales proporcionados en el bloque <contexto_usuario>. 
2. Si un dato necesario para responder aparece como "no_proporcionado" o "no_realizado", dilo explícitamente y pide al usuario que lo introduzca en la sección correspondiente de la app. NUNCA inventes ni asumas cifras.
3. Tus respuestas son educativas y orientativas, nunca una orden de compra/venta ni una garantía de rentabilidad.
4. Cuando propongas una distribución de inversión, explica el porqué, el riesgo asociado y qué podría pasar en distintos escenarios.
5. Sé claro y conciso, en español, evitando jerga innecesaria.`;

export async function askFinancialAssistant(userId: string, question: string) {
  const context = await buildUserFinancialContext(userId);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `<contexto_usuario>\n${JSON.stringify(context, null, 2)}\n</contexto_usuario>\n\nPregunta: ${question}`,
      },
    ],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n");

  return { text, contextSnapshot: context };
}

// ── helpers de serialización (evitan pasar objetos Decimal/Date crudos) ──

function sumMonthly(items: { amount: any; recurrence: string }[]) {
  return items.reduce((sum, item) => {
    const amount = Number(item.amount);
    if (item.recurrence === "MONTHLY") return sum + amount;
    if (item.recurrence === "ANNUAL") return sum + amount / 12;
    return sum; // ONE_TIME no cuenta en el flujo mensual recurrente
  }, 0);
}

function serializeIncome(i: any) {
  return { label: i.label, categoria: i.category, importe: Number(i.amount), recurrencia: i.recurrence };
}
function serializeExpense(e: any) {
  return {
    label: e.label,
    categoria: e.category,
    importe: Number(e.amount),
    tipo: e.type,
    recurrencia: e.recurrence,
  };
}
function serializeGoal(g: any) {
  return {
    nombre: g.name,
    tipo: g.type,
    objetivo: Number(g.targetAmount),
    actual: Number(g.currentAmount),
    fecha_objetivo: g.targetDate,
    aportacion_mensual: Number(g.monthlyContribution),
  };
}
function serializeInvestment(inv: any) {
  return {
    nombre: inv.name,
    categoria: inv.category,
    cantidad: Number(inv.quantity),
    precio_compra: Number(inv.purchasePrice),
    precio_actual: Number(inv.currentPrice),
  };
}

export { simulateThreeScenarios };
