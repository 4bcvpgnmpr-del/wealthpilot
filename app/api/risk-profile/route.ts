import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";
import { calculateRiskProfile } from "@/lib/risk-profile/scoring";

const AnswersSchema = z.object({
  age: z.number().int().min(16).max(100),
  investingExperience: z.enum(["ninguna", "basica", "intermedia", "avanzada"]),
  timeHorizonYears: z.number().min(0).max(60),
  lossReactionScenario: z.enum(["vendo_todo", "vendo_parte", "no_hago_nada", "compro_mas"]),
  liquidityNeed: z.enum(["alta", "media", "baja"]),
  primaryGoal: z.enum(["preservar_capital", "crecimiento_moderado", "crecimiento_alto"]),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const profile = await prisma.riskProfile.findUnique({ where: { userId } });
  return NextResponse.json(profile);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const parsed = AnswersSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // El cálculo del perfil vive ÚNICAMENTE en lib/risk-profile/scoring.ts —
  // esta ruta nunca decide el resultado por su cuenta.
  const result = calculateRiskProfile(parsed.data);

  const riskProfile = await prisma.riskProfile.upsert({
    where: { userId },
    create: {
      userId,
      answers: parsed.data,
      score: result.score,
      category: result.category,
    },
    update: {
      answers: parsed.data,
      score: result.score,
      category: result.category,
      computedAt: new Date(),
    },
  });

  return NextResponse.json({ ...riskProfile, explanation: result.explanation, breakdown: result.breakdown });
}
