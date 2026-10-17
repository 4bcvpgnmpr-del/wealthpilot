// Categorías predefinidas de Mi Dinero, con su icono por defecto.
// Fuente única de verdad: la usan tanto la API (para validar y evitar duplicados)
// como la interfaz (selectores e iconos). Los valores ("key") son los mismos que
// ya estaban guardados en la base de datos desde la Fase 2, así que los registros
// existentes siguen mostrándose con su nombre e icono correctos.

export type CategoryKind = "INCOME" | "EXPENSE" | "ASSET" | "LIABILITY";

export interface CategoryOption {
  key: string; // lo que se guarda en Income.category / Expense.category / Asset.type / Liability.type
  label: string;
  icon: string;
  custom?: boolean; // true = creada por el usuario
  id?: string; // id de UserCategory, solo en las propias
}

export const DEFAULT_CATEGORIES: Record<CategoryKind, CategoryOption[]> = {
  INCOME: [
    { key: "salario", label: "Salario", icon: "💼" },
    { key: "alquileres", label: "Alquileres", icon: "🏠" },
    { key: "trabajos_extra", label: "Trabajos extra", icon: "🛠️" },
    { key: "dividendos", label: "Dividendos", icon: "📈" },
    { key: "otros", label: "Otros", icon: "💶" },
  ],
  EXPENSE: [
    { key: "vivienda", label: "Vivienda", icon: "🏠" },
    { key: "alimentacion", label: "Alimentación", icon: "🛒" },
    { key: "transporte", label: "Transporte", icon: "🚗" },
    { key: "seguros", label: "Seguros", icon: "🛡️" },
    { key: "ocio", label: "Ocio", icon: "🎉" },
    { key: "viajes", label: "Viajes", icon: "✈️" },
    { key: "prestamos", label: "Préstamos", icon: "🏦" },
    { key: "suscripciones", label: "Suscripciones", icon: "📺" },
    { key: "otros", label: "Otros", icon: "🧾" },
  ],
  ASSET: [
    { key: "CASH", label: "Efectivo", icon: "💵" },
    { key: "BANK_ACCOUNT", label: "Cuenta bancaria", icon: "🏦" },
    { key: "DEPOSIT", label: "Depósito", icon: "🔒" },
    { key: "EMERGENCY_FUND", label: "Fondo de emergencia", icon: "🛟" },
    { key: "OTHER", label: "Otro", icon: "💰" },
  ],
  LIABILITY: [
    { key: "hipoteca", label: "Hipoteca", icon: "🏠" },
    { key: "prestamo_personal", label: "Préstamo personal", icon: "🤝" },
    { key: "prestamo_coche", label: "Préstamo coche", icon: "🚗" },
    { key: "tarjeta", label: "Tarjeta de crédito", icon: "💳" },
    { key: "otros", label: "Otros", icon: "📄" },
  ],
};

// Paleta de iconos que ofrece el selector. Se puede escribir cualquier otro emoji
// a mano; esta lista es solo para elegir rápido.
export const ICON_CHOICES: string[] = [
  "💼", "💶", "💵", "💰", "🪙", "💳", "🏦", "📈", "📉", "🧾",
  "🏠", "🔑", "🛋️", "💡", "🔥", "💧", "📶", "📱", "💻", "📺",
  "🛒", "🍽️", "☕", "🍺", "🚗", "⛽", "🚌", "🚲", "✈️", "🏖️",
  "🎉", "🎮", "🎬", "📚", "🎓", "🏋️", "⚽", "🎵", "🐶", "👶",
  "❤️", "💊", "🩺", "🛡️", "🎁", "👕", "💇", "🛠️", "🌱", "🛟",
  "🔒", "🤝", "📄", "⭐", "🧸", "🚀",
];

/** Normaliza para comparar nombres sin importar mayúsculas, tildes ni espacios extra. */
export function normalizeCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s_]+/g, " ");
}

/** ¿Choca este nombre con una categoría predefinida (por clave o por etiqueta)? */
export function collidesWithDefault(kind: CategoryKind, name: string): boolean {
  const n = normalizeCategoryName(name);
  return DEFAULT_CATEGORIES[kind].some(
    (c) => normalizeCategoryName(c.key) === n || normalizeCategoryName(c.label) === n,
  );
}

/** Lista completa para un selector: predefinidas + propias del usuario. */
export function mergeCategories(
  kind: CategoryKind,
  custom: { id: string; kind: string; name: string; icon: string }[],
): CategoryOption[] {
  const own = custom
    .filter((c) => c.kind === kind)
    .map((c) => ({ key: c.name, label: c.name, icon: c.icon, custom: true, id: c.id }));
  return [...DEFAULT_CATEGORIES[kind], ...own];
}

/**
 * Nombre e icono que se muestran para un registro. Prioridad del icono:
 * icono propio del registro → icono de su categoría → genérico.
 * Una categoría que ya no existe (p. ej. se borró una propia) se muestra con su
 * texto tal cual: el registro nunca se pierde ni queda sin nombre.
 */
export function resolveCategory(
  options: CategoryOption[],
  key: string,
  recordIcon?: string | null,
): { label: string; icon: string } {
  const match = options.find((o) => o.key === key);
  return {
    label: match?.label ?? key,
    icon: recordIcon || match?.icon || "🏷️",
  };
}

// ────────────────────────────────
// Iconos por defecto de Objetivos e Inversiones
// (aquí las categorías siguen siendo fijas: las usan el motor de alertas, la
// distribución de la cartera y el plan de inversión; el usuario personaliza
// con el nombre y un icono propio por registro)
// ────────────────────────────────

export const GOAL_TYPE_ICONS: Record<string, string> = {
  HOME: "🏠",
  CAR: "🚗",
  TRIP: "✈️",
  EMERGENCY_FUND: "🛟",
  RETIREMENT: "🏖️",
  FINANCIAL_INDEPENDENCE: "🕊️",
  NET_WORTH_TARGET: "📈",
  CUSTOM: "🎯",
};

export const INVESTMENT_CATEGORY_ICONS: Record<string, string> = {
  ETF: "🌍",
  STOCK: "📊",
  FUND: "🧺",
  BOND: "📜",
  DEPOSIT: "🔒",
  CRYPTO: "🪙",
  OTHER: "💼",
};
