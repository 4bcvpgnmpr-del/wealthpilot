"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { IncomeTab } from "./income-tab";
import { ExpenseTab } from "./expense-tab";
import { AssetsTab } from "./assets-tab";
import { LiabilitiesTab } from "./liabilities-tab";

const TABS = [
  { key: "ingresos", label: "Ingresos" },
  { key: "gastos", label: "Gastos" },
  { key: "ahorros", label: "Ahorros" },
  { key: "deudas", label: "Deudas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MoneyManager({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState<TabKey>("ingresos");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-mist-200 dark:border-ink-700">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.key
                ? "border-wealth-500 text-ink-900 dark:text-mist-100"
                : "border-transparent text-ink-600 dark:text-mist-400"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ingresos" && <IncomeTab initialIncomes={initialData.incomes} />}
      {activeTab === "gastos" && <ExpenseTab initialExpenses={initialData.expenses} />}
      {activeTab === "ahorros" && <AssetsTab initialAssets={initialData.assets} />}
      {activeTab === "deudas" && <LiabilitiesTab initialLiabilities={initialData.liabilities} />}
    </div>
  );
}
