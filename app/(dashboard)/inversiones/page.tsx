import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { InvestmentsManager } from "@/components/dashboard/investments-manager";

export default async function InversionesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { investments: { orderBy: { createdAt: "desc" } } },
  });

  const serializedInvestments = (portfolio?.investments ?? []).map((inv) => ({
    ...inv,
    quantity: inv.quantity.toString(),
    purchasePrice: inv.purchasePrice.toString(),
    currentPrice: inv.currentPrice.toString(),
    purchaseDate: inv.purchaseDate.toISOString(),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Cartera</p>
        <h1 className="figure text-3xl font-medium mb-1">Inversiones</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Tu cartera: valor actual, rentabilidad y distribución por categoría.
        </p>
      </header>

      <InvestmentsManager initialInvestments={serializedInvestments} />
    </div>
  );
}
