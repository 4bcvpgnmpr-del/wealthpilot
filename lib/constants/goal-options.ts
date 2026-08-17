export const GOAL_TYPES = [
  { value: "HOME", label: "Comprar vivienda" },
  { value: "CAR", label: "Comprar coche" },
  { value: "TRIP", label: "Viaje" },
  { value: "EMERGENCY_FUND", label: "Fondo de emergencia" },
  { value: "RETIREMENT", label: "Jubilación" },
  { value: "FINANCIAL_INDEPENDENCE", label: "Independencia financiera" },
  { value: "NET_WORTH_TARGET", label: "Patrimonio objetivo" },
  { value: "CUSTOM", label: "Objetivo personalizado" },
] as const;

export const GOAL_PRIORITIES = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
] as const;

export const RISK_TOLERANCE_OPTIONS = [
  { value: "conservador", label: "Conservador" },
  { value: "moderado", label: "Moderado" },
  { value: "dinamico", label: "Dinámico" },
] as const;
