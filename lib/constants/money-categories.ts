export const INCOME_CATEGORIES = [
  { value: "salario", label: "Salario" },
  { value: "alquileres", label: "Alquileres" },
  { value: "trabajos_extra", label: "Trabajos extra" },
  { value: "dividendos", label: "Dividendos" },
  { value: "otros", label: "Otros" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "vivienda", label: "Vivienda" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "transporte", label: "Transporte" },
  { value: "seguros", label: "Seguros" },
  { value: "ocio", label: "Ocio" },
  { value: "viajes", label: "Viajes" },
  { value: "prestamos", label: "Préstamos" },
  { value: "suscripciones", label: "Suscripciones" },
  { value: "otros", label: "Otros" },
] as const;

export const ASSET_TYPES = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_ACCOUNT", label: "Cuenta bancaria" },
  { value: "DEPOSIT", label: "Depósito" },
  { value: "EMERGENCY_FUND", label: "Fondo de emergencia" },
  { value: "OTHER", label: "Otro" },
] as const;

export const LIABILITY_TYPES = [
  { value: "hipoteca", label: "Hipoteca" },
  { value: "prestamo_personal", label: "Préstamo personal" },
  { value: "prestamo_coche", label: "Préstamo coche" },
  { value: "tarjeta", label: "Tarjeta de crédito" },
  { value: "otros", label: "Otros" },
] as const;

export const RECURRENCE_OPTIONS = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "ANNUAL", label: "Anual" },
  { value: "ONE_TIME", label: "Puntual" },
] as const;
