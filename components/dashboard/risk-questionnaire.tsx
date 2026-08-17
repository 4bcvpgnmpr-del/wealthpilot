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
      <div className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-6">
        <p className="text-sm text-ink-600 dark:text-mist-400 mb-1">Tu perfil de riesgo</p>
        <p className={`figure text-3xl font-medium mb-3 ${CATEGORY_COLOR[result.category]}`}>
          {result.category.charAt(0) + result.category.slice(1).toLowerCase()}
        </p>
        <p className="text-sm text-ink-600 dark:text-mist-400 mb-4">{result.explanation}</p>

        <details className="mb-4">
          <summary className="text-xs font-medium cursor-pointer text-ink-600 dark:text-mist-400">
            Ver cómo se calculó (puntuación: {result.score}/100)
          </summary>
          <div className="mt-3 space-y-2">
            {result.breakdown.map((b) => (
              <div key={b.key} className="flex justify-between text-xs">
                <span className="text-ink-600 dark:text-mist-400">
                  {QUESTION_LABEL[b.key] ?? b.key} (peso {Math.round(b.weight * 100)}%)
                </span>
                <span className="mono-data">{Math.round(b.rawScore)}/100</span>
              </div>
            ))}
          </div>
        </details>

        <button
          onClick={() => setRetaking(true)}
          className="text-sm font-medium text-ink-900 dark:text-mist-100 underline"
        >
          Repetir cuestionario
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-ink-900 border border-mist-200 dark:border-ink-700 rounded-card p-6 space-y-5">
      <div>
        <label className="text-sm font-medium block mb-1">Edad</label>
        <input
          type="number"
          value={answers.age}
          onChange={(e) => setAnswers({ ...answers, age: e.target.value ? Number(e.target.value) : "" })}
          placeholder="34"
          className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
        />
      </div>

      <RadioGroup
        label="¿Cuánta experiencia tienes invirtiendo?"
        name="investingExperience"
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
        <label className="text-sm font-medium block mb-1">¿Cuál es tu horizonte temporal? (años)</label>
        <input
          type="number"
          value={answers.timeHorizonYears}
          onChange={(e) => setAnswers({ ...answers, timeHorizonYears: e.target.value ? Number(e.target.value) : "" })}
          placeholder="10"
          className="w-full border border-mist-300 dark:border-ink-700 bg-transparent rounded-card px-3 py-2 text-sm"
        />
      </div>

      <RadioGroup
        label="Si tu cartera cae un 20% en un mes, ¿qué haces?"
        name="lossReactionScenario"
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
        name="liquidityNeed"
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
        name="primaryGoal"
        value={answers.primaryGoal}
        onChange={(v) => setAnswers({ ...answers, primaryGoal: v })}
        options={[
          { value: "preservar_capital", label: "Preservar capital" },
          { value: "crecimiento_moderado", label: "Crecimiento moderado" },
          { value: "crecimiento_alto", label: "Crecimiento alto" },
        ]}
      />

      {error && <p className="text-xs text-signal-red">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink-900 dark:bg-mist-100 text-white dark:text-ink-900 rounded-card py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {submitting ? "Calculando..." : "Calcular mi perfil"}
      </button>
    </form>
  );
}

function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-2">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`text-sm px-3 py-2 rounded-card border text-left transition-colors ${
              value === opt.value
                ? "border-wealth-500 bg-wealth-100 dark:bg-ink-700 text-wealth-500 font-medium"
                : "border-mist-300 dark:border-ink-700 text-ink-600 dark:text-mist-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
