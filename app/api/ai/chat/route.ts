import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { askFinancialAssistant } from "@/lib/ai/financial-assistant";

const ChatSchema = z.object({
  question: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

// GET: lista las conversaciones del usuario (para el historial lateral del chat),
// o los mensajes de una concreta si se pasa ?conversationId=
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  const userId = (session.user as any).id as string;

  const conversationId = new URL(req.url).searchParams.get("conversationId");

  if (conversationId) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
    return NextResponse.json(conversation);
  }

  const conversations = await prisma.aIConversation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });
  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  const parsed = ChatSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { question, conversationId } = parsed.data;

  const conversation = conversationId
    ? await prisma.aIConversation.findFirst({ where: { id: conversationId, userId } })
    : await prisma.aIConversation.create({ data: { userId, title: question.slice(0, 60) } });

  if (!conversation) {
    return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
  }

  const { text, contextSnapshot } = await askFinancialAssistant(userId, question);

  await prisma.aIMessage.createMany({
    data: [
      { conversationId: conversation.id, role: "user", content: question },
      {
        conversationId: conversation.id,
        role: "assistant",
        content: text,
        contextSnapshot: contextSnapshot as any,
      },
    ],
  });

  return NextResponse.json({ conversationId: conversation.id, answer: text });
}
