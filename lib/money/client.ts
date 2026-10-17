// Utilidades de cliente compartidas por las pestañas de Mi Dinero.

/**
 * Extrae un mensaje legible de una respuesta de error de la API. Cubre los dos
 * formatos que devuelve: { error: "texto" } y { error: zodError.flatten() }.
 * (Antes solo se leía formErrors, y los errores de campo de Zod — que van en
 * fieldErrors — nunca llegaban a mostrarse.)
 */
export function extractApiError(data: any, fallback: string): string {
  const e = data?.error;
  if (typeof e === "string") return e;
  if (e?.formErrors?.[0]) return e.formErrors[0];
  const firstField = e?.fieldErrors && Object.values(e.fieldErrors as Record<string, string[]>).find((v) => v?.length);
  return firstField?.[0] ?? fallback;
}

/** POST (crear) o PATCH (editar) contra /api/{resource}. Devuelve el registro o un error. */
export async function saveRecord<T>(
  resource: string,
  body: Record<string, unknown>,
  id: string | null,
  fallbackError: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(id ? `/api/${resource}/${id}` : `/api/${resource}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: extractApiError(data, fallbackError) };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Sin conexión. Inténtalo de nuevo." };
  }
}

export function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

export const RECURRENCE_LABEL: Record<string, string> = { MONTHLY: "Mensual", ANNUAL: "Anual", ONE_TIME: "Puntual" };

export function toMonthly(items: { amount: string | number; recurrence: string }[]) {
  return items.reduce((sum, i) => {
    const amt = Number(i.amount);
    if (i.recurrence === "MONTHLY") return sum + amt;
    if (i.recurrence === "ANNUAL") return sum + amt / 12;
    return sum;
  }, 0);
}
