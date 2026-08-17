import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";

// Consolidado en un solo archivo (igual que income/expenses/etc.) para no
// superar el límite de funciones serverless de Vercel Hobby.
// GET sin id -> lista de inversiones (crea el Portfolio del usuario si no existe)
// POST sin id -> crea inversión
// PATCH/DELETE con id -> actualiza/borra una inversión concreta

const InvestmentSchema = z.object({
  name: z.string().min(1, "Ponle un nombre a esta inversión."),
  ticker: z.string().optional().nullable(),
  isin: z.string().optional().nullable(),
  category: z.enum(["ETF", "STOCK", "FUND", "BOND", "DEPOSIT", "CRYPTO", "OTHER"]),
  quantity: z.number().positive("La cantidad debe ser mayor que 0."),
  purchasePrice: z.number().nonnegative("El precio de compra no puede ser negativo."),
  currentPrice: z.number().nonnegative("El precio actual no puede ser negativo."),
  purchaseDate: z.string().datetime(),
});

const InvestmentUpdateSchema = InvestmentSchema.partial();

function getId(params: { id?: string[] }): string | null {
  return params.id?.[0] ?? null;
}

async function getOrCreatePortfolio(userId: string) {
  let portfolio = await prisma.portfolio.findUnique({ where: { userId } });
  if (!portfolio) {
    portfolio = await prisma.portfolio.create({ data: { userId } });
  }
  return portfolio;
}

export async function GET(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const portfolio = await getOrCreatePortfolio(userId);

  const id = getId(params);
  if (id) {
    const investment = await prisma.investment.findFirst({ where: { id, portfolioId: portfolio.id } });
    if (!investment) return NextResponse.json({ error: "Inversión no encontrada." }, { status: 404 });
    return NextResponse.json(investment);
  }

  const investments = await prisma.investment.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(investments);
}

export async function POST(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  if (getId(params)) {
    return NextResponse.json({ error: "Método no permitido en este recurso." }, { status: 405 });
  }

  const parsed = InvestmentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const portfolio = await getOrCreatePortfolio(userId);
  const { purchaseDate, ...rest } = parsed.data;
  const investment = await prisma.investment.create({
    data: { ...rest, purchaseDate: new Date(purchaseDate), portfolioId: portfolio.id },
  });
  return NextResponse.json(investment, { status: 201 });
}

export async function PATCH(req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id de la inversión." }, { status: 400 });

  const portfolio = await getOrCreatePortfolio(userId);
  const existing = await prisma.investment.findFirst({ where: { id, portfolioId: portfolio.id } });
  if (!existing) return NextResponse.json({ error: "Inversión no encontrada." }, { status: 404 });

  const parsed = InvestmentUpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { purchaseDate, ...rest } = parsed.data;
  const updated = await prisma.investment.update({
    where: { id },
    data: { ...rest, ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id?: string[] } }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const id = getId(params);
  if (!id) return NextResponse.json({ error: "Falta el id de la inversión." }, { status: 400 });

  const portfolio = await getOrCreatePortfolio(userId);
  const existing = await prisma.investment.findFirst({ where: { id, portfolioId: portfolio.id } });
  if (!existing) return NextResponse.json({ error: "Inversión no encontrada." }, { status: 404 });

  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
