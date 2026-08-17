import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { RiskQuestionnaire } from "@/components/dashboard/risk-questionnaire";
import { calculateRiskProfile, type RiskQuestionnaireAnswers } from "@/lib/risk-profile/scoring";

export default async function PerfilRiesgoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const existing = await prisma.riskProfile.findUnique({ where: { userId } });

  // Si ya existe un perfil, recalculamos la explicación/breakdown a partir de las
  // respuestas guardadas (nunca se persiste el texto de explicación, solo el resultado
  // numérico + categoría — así el texto siempre refleja la lógica de scoring.ts actual).
  const existingResult = existing
    ? (() => {
        const r = calculateRiskProfile(existing.answers as unknown as RiskQuestionnaireAnswers);
        return { score: existing.score, category: existing.category, explanation: r.explanation, breakdown: r.breakdown };
      })()
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="figure text-2xl font-medium mb-1">Perfil del inversor</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Unas preguntas para orientar tu plan de inversión a tu situación real.
        </p>
      </header>

      <RiskQuestionnaire existingResult={existingResult} />
    </div>
  );
}
