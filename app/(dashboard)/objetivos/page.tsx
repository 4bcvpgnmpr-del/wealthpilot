import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { GoalsManager } from "@/components/dashboard/goals-manager";

export default async function ObjetivosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  const serializedGoals = goals.map((g) => ({
    ...g,
    targetAmount: g.targetAmount.toString(),
    currentAmount: g.currentAmount.toString(),
    monthlyContribution: g.monthlyContribution.toString(),
    targetDate: g.targetDate?.toISOString() ?? null,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="figure text-2xl font-medium mb-1">Objetivos</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Crea objetivos y haz seguimiento de tu progreso hacia cada uno.
        </p>
      </header>

      <GoalsManager initialGoals={serializedGoals} />
    </div>
  );
}
