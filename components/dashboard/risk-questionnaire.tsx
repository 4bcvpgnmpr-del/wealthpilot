"use client";

import { useState } from "react";

type Answers = {
  age: number | "";
  investingExperience: string;
  timeHorizonYears: number | "";
  lossReactionScenario: string;
  liquidityNeed: string;
  primaryGoal: string;
};

type RiskResult = {
  score: number;
  category: "CONSERVADOR" | "MODERADO" | "EQUILIBRADO" | "DINAMICO" | "AGRESIVO";
  explanation: string;
  breakdown: { key: string; rawScore: number; weight: number; weightedContribution: number }[];
};

const emptyAnswers: Answers = {
  age: "",
  investingExperience: "",
  timeHorizonYears: "",
  lossReactionScenario: "",
  liquidityNeed: "",
  primaryGoal: "",
};

const CATEGORY_COLOR: Record<string, string> = {
  CONSERVADOR: "text-signal-red",
  MODERADO: "text-signal-amber",
  EQUILIBRADO: "text-ink-900 dark:text-mist-100",
  DINAMICO: "text-wealth-400",
  AGRESIVO: "text-wealth-500",
};

const QUESTION_LABEL: Record<string, string> = {
  age: "Edad",
  investingExperience: "Experiencia invirtiendo",
  timeHorizonYears: "Horizonte temporal",
  lossReactionScenario: "Reacción ante una caída",
  liquidityNeed: "Necesidad de liquidez",
  primaryGoal: "Objetivo principal",
};

export function RiskQuestionnaire({ existingResult }: { existingResult: RiskResult | null }) {
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [result, setResult] = useState<RiskResult | null>(existingResult);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retaking, setRetaking] = useState(!existingResult);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const allAnswered = Object.values(answers).every((v) => v !== "");
    if (!allAnswered) {
      setError("Responde todas las preguntas para calcular tu perfil.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/risk-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...answers,
        age: Number(answers.age),
        timeHorizonYears: Number(answers.timeHorizonYears),
      }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] ?? "No se pudo calcular tu perfil.");
      return;
    }

    const data = await res.json();
    setResult({ score: data.score, category: data.category, explanation: data.explanation, breakdown: data.breakdown });
    setRetaking(false);
  }

  if (result && !retaking) {
    return (
      <div className="card p-7">
        <p className="eyebrow text-mist-400 mb-2">Tu perfil de riesgo</p>
        <p className={`figure text-4xl font-medium mb-4 ${CATEGORY_COLOR[result.category]}`}>
          {result.category.charAt(0) + result.category.slice(1).toLowerCase()}
        </p>
        <p className="text-sm text-ink-600 dark:text-mist-400 mb-5 leading-relaxed">{result.explanation}</p>

        <details className="mb-5 group">
          <summary className="text-xs font-medium cursor-pointer text-ink-600 dark:text-mist-400 flex items-center gap-1.5">
            <i className="ti ti-chevron-right text-sm transition-transform group-open:rotate-90" aria-hidden="true" />
            Ver cómo se calculó (puntuación: {result.score}/100)
          </summary>
          <div className="mt-4 space-y-2.5 pl-5">
            {result.breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-600 dark:text-mist-400">
                    {QUESTION_LABEL[b.key] ?? b.key} <span className="text-mist-300 dark:text-ink-600">· peso {Math.round(b.weight * 100)}%</span>
                  </span>
                  <span className="mono-data">{Math.round(b.rawScore)}/100</span>
                </div>
                <div className="h-1 rounded-full bg-mist-100 dark:bg-ink-700 overflow-hidden">
                  <div className="h-full bg-mist-400 dark:bg-ink-600" style={{ width: `${b.rawScore}%` }} />
                </div>
              </div>
            ))}
          </div>
        </details>

        <button onClick={() => setRetaking(true)} className="btn-secondary">
          <i className="ti ti-refresh text-base" aria-hidden="true" />
          Repetir cuestionario
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-7 space-y-6">
      <div>
        <label className="field-label">Edad</label>
        <input
          type="number"
          value={answers.age}
          onChange={(e) => setAnswers({ ...answers, age: e.target.value ? Number(e.target.value) : "" })}
          placeholder="34"
          className="field-input"
        />
      </div>

      <RadioGroup
        label="¿Cuánta experiencia tienes invirtiendo?"
        value={answers.investingExperience}
        onChange={(v) => setAnswers({ ...answers, investingExperience: v })}
        options={[
          { value: "ninguna", label: "Ninguna" },
          { value: "basica", label: "Básica" },
          { value: "intermedia", label: "Intermedia" },
          { value: "avanzada", label: "Avanzada" },
        ]}
      />

      <div>
        <label className="field-label">¿Cuál es tu horizonte temporal? (años)</label>
        <input
          type="number"
          value={answers.timeHorizonYears}
          onChange={(e) => setAnswers({ ...answers, timeHorizonYears: e.target.value ? Number(e.target.value) : "" })}
          placeholder="10"
          className="field-input"
        />
      </div>

      <RadioGroup
        label="Si tu cartera cae un 20% en un mes, ¿qué haces?"
        value={answers.lossReactionScenario}
        onChange={(v) => setAnswers({ ...answers, lossReactionScenario: v })}
        options={[
          { value: "vendo_todo", label: "Vendo todo" },
          { value: "vendo_parte", label: "Vendo una parte" },
          { value: "no_hago_nada", label: "No hago nada" },
          { value: "compro_mas", label: "Compro más" },
        ]}
      />

      <RadioGroup
        label="¿Cuánta liquidez necesitas a corto plazo?"
        value={answers.liquidityNeed}
        onChange={(v) => setAnswers({ ...answers, liquidityNeed: v })}
        options={[
          { value: "alta", label: "Alta" },
          { value: "media", label: "Media" },
          { value: "baja", label: "Baja" },
        ]}
      />

      <RadioGroup
        label="¿Cuál es tu objetivo principal?"
        value={answers.primaryGoal}
        onChange={(v) => setAnswers({ ...answers, primaryGoal: v })}
        options={[
          { value: "preservar_capital", label: "Preservar capital" },
          { value: "crecimiento_moderado", label: "Crecimiento moderado" },
          { value: "crecimiento_alto", label: "Crecimiento alto" },
        ]}
      />

      {error && <p className="text-xs text-signal-red">{error}</p>}
      <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
        {submitting ? "Calculando..." : "Calcular mi perfil"}
      </button>
    </form>
  );
}

function RadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="field-label mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-sm px-3.5 py-2.5 rounded-lg border text-left transition-all ${
              value === opt.value
                ? "border-wealth-500 bg-wealth-100 dark:bg-wealth-500/10 text-wealth-500 font-medium ring-1 ring-wealth-500/20"
                : "border-mist-200 dark:border-ink-700 text-ink-600 dark:text-mist-300 hover:border-mist-300 dark:hover:border-ink-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
