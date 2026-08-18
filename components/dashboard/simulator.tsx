"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { simulateThreeScenarios } from "@/lib/finance-engine/core";

function formatEUR(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function formatEURCompact(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }).format(n);
}

const SCENARIO_META = {
  conservador: { label: "Conservador", color: "#A6AFBD", pct: "4%" },
  moderado: { label: "Moderado", color: "#0E9F6E", pct: "7%" },
  optimista: { label: "Optimista", color: "#D97706", pct: "9%" },
} as const;

export function Simulator() {
  const [initialCapital, setInitialCapital] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(300);
  const [annualContributionGrowth, setAnnualContributionGrowth] = useState(2);
  const [years, setYears] = useState(20);
  const [annualInflationRate, setAnnualInflationRate] = useState(2.5);

  const scenarios = useMemo(
    () =>
      simulateThreeScenarios({
        initialCapital,
        monthlyContribution,
        annualContributionGrowth: annualContributionGrowth / 100,
        years,
        annualInflationRate: annualInflationRate / 100,
      }),
    [initialCapital, monthlyContribution, annualContributionGrowth, years, annualInflationRate]
  );

  // Combinar los 3 escenarios en un único dataset para el gráfico
  const chartData = scenarios.moderado.yearlyBreakdown.map((point, i) => ({
    year: point.year,
    conservador: scenarios.conservador.yearlyBreakdown[i]?.nominalValue ?? 0,
    moderado: point.nominalValue,
    optimista: scenarios.optimista.yearlyBreakdown[i]?.nominalValue ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="card p-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SliderField
          label="Capital inicial"
          value={initialCapital}
          onChange={setInitialCapital}
          min={0}
          max={100000}
          step={500}
          format={(v) => formatEUR(v)}
        />
        <SliderField
          label="Aportación mensual"
          value={monthlyContribution}
          onChange={setMonthlyContribution}
          min={0}
          max={3000}
          step={50}
          format={(v) => formatEUR(v)}
        />
        <SliderField
          label="Crecimiento anual aportación"
          value={annualContributionGrowth}
          onChange={setAnnualContributionGrowth}
          min={0}
          max={10}
          step={0.5}
          format={(v) => `${v}%`}
        />
        <SliderField
          label="Años"
          value={years}
          onChange={setYears}
          min={1}
          max={40}
          step={1}
          format={(v) => `${v} años`}
        />
        <SliderField
          label="Inflación anual"
          value={annualInflationRate}
          onChange={setAnnualInflationRate}
          min={0}
          max={10}
          step={0.5}
          format={(v) => `${v}%`}
        />
      </div>

      {/* Gráfico */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium">Proyección de crecimiento compuesto</p>
          <div className="flex items-center gap-4">
            {Object.entries(SCENARIO_META).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-mist-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                {meta.label} ({meta.pct})
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-ink-600 dark:text-mist-400 mb-4">
          Escenarios hipotéticos, no garantías de rentabilidad futura.
        </p>
        <div className="h-72 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#D7DBE2" vertical={false} />
              <XAxis
                dataKey="year"
                tickFormatter={(y) => `${y}a`}
                stroke="#A6AFBD"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatEURCompact(v)}
                stroke="#A6AFBD"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value: number) => formatEUR(value)}
                labelFormatter={(y) => `Año ${y}`}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #D7DBE2",
                  fontSize: 12,
                  fontFamily: "IBM Plex Mono, monospace",
                }}
              />
              <Line type="monotone" dataKey="conservador" stroke={SCENARIO_META.conservador.color} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="moderado" stroke={SCENARIO_META.moderado.color} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="optimista" stroke={SCENARIO_META.optimista.color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resultados finales por escenario */}
      <div className="grid sm:grid-cols-3 gap-3">
        {(Object.keys(SCENARIO_META) as (keyof typeof SCENARIO_META)[]).map((key) => {
          const scenario = scenarios[key];
          const meta = SCENARIO_META[key];
          return (
            <div key={key} className="card p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                <p className="eyebrow text-mist-400">{meta.label} · {meta.pct}/año</p>
              </div>
              <p className="figure text-2xl font-medium mb-1">{formatEUR(scenario.finalNominalValue)}</p>
              <p className="text-xs text-ink-600 dark:text-mist-400 mb-3">
                Valor real (ajustado a inflación): {formatEUR(scenario.finalRealValue)}
              </p>
              <div className="pt-3 border-t border-mist-100 dark:border-ink-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-600 dark:text-mist-400">Aportado</span>
                  <span className="mono-data">{formatEUR(scenario.totalContributed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600 dark:text-mist-400">Crecimiento</span>
                  <span className="mono-data text-wealth-500">+{formatEUR(scenario.totalGrowth)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="field-label mb-0">{label}</label>
        <span className="mono-data text-xs font-medium text-ink-900 dark:text-mist-100">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-wealth-500"
      />
    </div>
  );
}
