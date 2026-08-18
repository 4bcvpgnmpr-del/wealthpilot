import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { AiChat } from "@/components/dashboard/ai-chat";

export default async function AnalisisIAPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const conversations = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  const serialized = conversations.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <p className="eyebrow text-mist-400 mb-2">Asistente</p>
        <h1 className="figure text-3xl font-medium mb-1">Análisis IA</h1>
        <p className="text-sm text-ink-600 dark:text-mist-400">
          Pregunta sobre tu situación financiera — respuestas basadas siempre en tus datos reales.
        </p>
      </header>

      <AiChat initialConversations={serialized} />
    </div>
  );
}
