import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSessionUserId } from "@/lib/session";
import { collidesWithDefault, type CategoryKind } from "@/lib/money/categories";

// Ruta unificada de Mi Dinero: /api/income, /api/expenses, /api/assets,
// /api/liabilities y /api/categories — cada uno con colección (GET/POST) e
// item /{id} (GET/PATCH/DELETE). Antes eran 4 archivos = 4 funciones serverless;
// juntarlos en uno deja el proyecto en 9 de las 12 que permite Vercel Hobby, con
// las mismas URLs de siempre.
//
// Las rutas estáticas (/api/goals, /api/alerts, /api/auth…) tienen prioridad en
// Next.js sobre este segmento dinámico, así que no hay interferencias. Cualquier
// recurso que no esté en RESOURCES devuelve 404.

const optionalIcon = z
  .string()
  .trim()
  .max(16, "Icono no válido.")
  .nullable()
  .optional()
  .transform((v) => (v ? v : null)); // "" o null → icono por defecto de la categoría

const categoryText = (msg: string) =>
  z.string().trim().min(1, msg).max(40, "El nombre de la categoría es demasiado largo.");

const recurrence = z.enum(["ONE_TIME", "MONTHLY", "ANNUAL"]);

const IncomeSchema = z.object({
  label: z.string().trim().min(1, "Ponle un nombre a este ingreso."),
  category: categoryText("Elige una categoría."),
  icon: optionalIcon,
  amount: z.number().positive("El importe debe ser mayor que 0."),
  recurrence,
});

const ExpenseSchema = z.object({
  label: z.string().trim().min(1, "Ponle un nombre a este gasto."),
  category: categoryText("Elige una categoría."),
  icon: optionalIcon,
  amount: z.number().positive("El importe debe ser mayor que 0."),
  type: z.enum(["FIXED", "VARIABLE"]),
  recurrence,
});

const AssetSchema = z.object({
  label: z.string().trim().min(1, "Ponle un nombre a este activo."),
  type: categoryText("Elige un tipo."),
  icon: optionalIcon,
  amount: z.number().nonnegative("El importe no puede ser negativo."),
});

const LiabilitySchema = z.object({
  label: z.string().trim().min(1, "Ponle un nombre a esta deuda."),
  type: categoryText("Elige un tipo."),
  icon: optionalIcon,
  outstanding: z.number().nonnegative("El importe pendiente no puede ser negativo."),
  interestRate: z.number().min(0).max(100, "El interés debe estar entre 0 y 100."),
  monthlyPayment: z.number().nonnegative("La cuota mensual no puede ser negativa."),
  endDate: z.string().datetime().optional().nullable(),
});

const CategorySchema = z.object({
  kind: z.enum(["INCOME", "EXPENSE", "ASSET", "LIABILITY"]),
  name: categoryText("Ponle un nombre a la categoría."),
  icon: z.string().trim().min(1, "Elige un icono.").max(16, "Icono no válido."),
});
const CategoryUpdateSchema = CategorySchema.omit({ kind: true }).partial();

type ResourceConfig = {
  model: "income" | "expense" | "asset" | "liability";
  schema: z.ZodObject<any>;
  notFound: string;
  // Campo donde el registro guarda su categoría (para renombrar en cascada)
  categoryField: "category" | "type";
  kind: CategoryKind;
};

const RESOURCES: Record<string, ResourceConfig> = {
  income: { model: "income", schema: IncomeSchema, notFound: "Ingreso no encontrado.", categoryField: "category", kind: "INCOME" },
  expenses: { model: "expense", schema: ExpenseSchema, notFound: "Gasto no encontrado.", categoryField: "category", kind: "EXPENSE" },
  assets: { model: "asset", schema: AssetSchema, notFound: "Activo no encontrado.", categoryField: "type", kind: "ASSET" },
  liabilities: { model: "liability", schema: LiabilitySchema, notFound: "Deuda no encontrada.", categoryField: "type", kind: "LIABILITY" },
};

const KIND_TO_RESOURCE: Record<CategoryKind, ResourceConfig> = {
  INCOME: RESOURCES.income,
  EXPENSE: RESOURCES.expenses,
  ASSET: RESOURCES.assets,
  LIABILITY: RESOURCES.liabilities,
};

type Params = { params: { resource: string; id?: string[] } };

const json = NextResponse.json;
const err = (message: string, status: number) => json({ error: message }, { status });

function getId(params: Params["params"]): string | null {
  return params.id?.[0] ?? null;
}

// Los delegados de Prisma (prisma.income, prisma.expense…) comparten la misma API
// para estas operaciones; los tratamos de forma genérica.
function delegate(model: ResourceConfig["model"]): any {
  return (prisma as any)[model];
}

async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function validationError(error: z.ZodError) {
  return json({ error: error.flatten() }, { status: 400 });
}

// ────────────────────────────────
// HANDLERS
// ────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return err("No autenticado.", 401);
  const id = getId(params);

  if (params.resource === "categories") {
    const categories = await prisma.userCategory.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
    return json(categories);
  }

  const cfg = RESOURCES[params.resource];
  if (!cfg) return err("Recurso no encontrado.", 404);

  if (id) {
    const item = await delegate(cfg.model).findFirst({ where: { id, userId } });
    return item ? json(item) : err(cfg.notFound, 404);
  }
  const items = await delegate(cfg.model).findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return json(items);
}

export async function POST(req: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return err("No autenticado.", 401);
  if (getId(params)) return err("Método no permitido en este recurso.", 405);

  if (params.resource === "categories") {
    const parsed = CategorySchema.safeParse(await readBody(req));
    if (!parsed.success) return validationError(parsed.error);
    const { kind, name, icon } = parsed.data;

    if (collidesWithDefault(kind, name)) return err("Ya existe una categoría predefinida con ese nombre.", 409);
    const duplicate = await prisma.userCategory.findFirst({
      where: { userId, kind, name: { equals: name, mode: "insensitive" } },
    });
    if (duplicate) return err("Ya tienes una categoría con ese nombre.", 409);

    const created = await prisma.userCategory.create({ data: { userId, kind, name, icon } });
    return json(created, { status: 201 });
  }

  const cfg = RESOURCES[params.resource];
  if (!cfg) return err("Recurso no encontrado.", 404);

  const parsed = cfg.schema.safeParse(await readBody(req));
  if (!parsed.success) return validationError(parsed.error);

  const created = await delegate(cfg.model).create({ data: { ...parsed.data, userId } });
  return json(created, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return err("No autenticado.", 401);
  const id = getId(params);
  if (!id) return err("Falta el id.", 400);

  if (params.resource === "categories") {
    const existing = await prisma.userCategory.findFirst({ where: { id, userId } });
    if (!existing) return err("Categoría no encontrada.", 404);

    const parsed = CategoryUpdateSchema.safeParse(await readBody(req));
    if (!parsed.success) return validationError(parsed.error);
    const { name, icon } = parsed.data;
    const renaming = name !== undefined && name !== existing.name;

    if (renaming) {
      if (collidesWithDefault(existing.kind as CategoryKind, name)) {
        return err("Ya existe una categoría predefinida con ese nombre.", 409);
      }
      const duplicate = await prisma.userCategory.findFirst({
        where: { userId, kind: existing.kind, name: { equals: name, mode: "insensitive" }, NOT: { id } },
      });
      if (duplicate) return err("Ya tienes una categoría con ese nombre.", 409);
    }

    // Al renombrar, los movimientos que usaban el nombre antiguo pasan al nuevo
    // en la misma transacción, para que no queden "huérfanos" de su categoría.
    const target = KIND_TO_RESOURCE[existing.kind as CategoryKind];
    const oldName = existing.name; // capturado antes de actualizar
    const [updated] = await prisma.$transaction([
      prisma.userCategory.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(icon !== undefined && { icon }) } }),
      ...(renaming
        ? [
            delegate(target.model).updateMany({
              where: { userId, [target.categoryField]: oldName },
              data: { [target.categoryField]: name },
            }),
          ]
        : []),
    ]);
    return json(updated);
  }

  const cfg = RESOURCES[params.resource];
  if (!cfg) return err("Recurso no encontrado.", 404);

  const existing = await delegate(cfg.model).findFirst({ where: { id, userId } });
  if (!existing) return err(cfg.notFound, 404);

  const parsed = cfg.schema.partial().safeParse(await readBody(req));
  if (!parsed.success) return validationError(parsed.error);

  // Solo se actualizan los campos que vinieron en el body. Un "icon" ausente queda
  // undefined (no se toca); un icon "" o null vuelve al icono de la categoría.
  const data = Object.fromEntries(
    Object.entries(parsed.data as Record<string, unknown>).filter(([, v]) => v !== undefined),
  );
  const updated = await delegate(cfg.model).update({ where: { id }, data });
  return json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const userId = await getSessionUserId();
  if (!userId) return err("No autenticado.", 401);
  const id = getId(params);
  if (!id) return err("Falta el id.", 400);

  if (params.resource === "categories") {
    const existing = await prisma.userCategory.findFirst({ where: { id, userId } });
    if (!existing) return err("Categoría no encontrada.", 404);
    // Los movimientos que la usan NO se borran: conservan el nombre como texto.
    await prisma.userCategory.delete({ where: { id } });
    return json({ deleted: true });
  }

  const cfg = RESOURCES[params.resource];
  if (!cfg) return err("Recurso no encontrado.", 404);

  const existing = await delegate(cfg.model).findFirst({ where: { id, userId } });
  if (!existing) return err(cfg.notFound, 404);

  await delegate(cfg.model).delete({ where: { id } });
  return json({ deleted: true });
}
