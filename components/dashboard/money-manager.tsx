"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { IncomeTab } from "./income-tab";
import { ExpenseTab } from "./expense-tab";
import { AssetsTab } from "./assets-tab";
import { LiabilitiesTab } from "./liabilities-tab";
import type { UserCategory } from "./category-picker";

const TABS = [
  { key: "ingresos", label: "Ingresos", icon: "ti-arrow-down-circle" },
  { key: "gastos", label: "Gastos", icon: "ti-arrow-up-circle" },
  { key: "ahorros", label: "Ahorros", icon: "ti-pig-money" },
  { key: "deudas", label: "Deudas", icon: "ti-credit-card" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MoneyManager({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState<TabKey>("ingresos");
  // Las categorías propias viven aquí (no en cada pestaña) para que una creada o
  // renombrada se refleje al instante en todas.
  const [categories, setCategories] = useState<UserCategory[]>(initialData.categories ?? []);
  const shared = { categories, onCategoriesChange: setCategories };

  return (
    <div>
      <div role="tablist" className="flex gap-1 mb-6 p-1 bg-mist-200/60 dark:bg-ink-800 rounded-lg w-fit max-w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-white dark:bg-ink-700 text-ink-900 dark:text-mist-100 shadow-sm"
                : "text-ink-600 dark:text-mist-400 hover:text-ink-900 dark:hover:text-mist-200"
            )}
          >
            <i className={`ti ${tab.icon} text-[15px]`} aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Las 4 pestañas permanecen montadas (solo se ocultan): antes se desmontaban
          al cambiar, y lo añadido o editado desaparecía hasta recargar la página. */}
      <div hidden={activeTab !== "ingresos"}>
        <IncomeTab initialIncomes={initialData.incomes} {...shared} />
      </div>
      <div hidden={activeTab !== "gastos"}>
        <ExpenseTab initialExpenses={initialData.expenses} {...shared} />
      </div>
      <div hidden={activeTab !== "ahorros"}>
        <AssetsTab initialAssets={initialData.assets} {...shared} />
      </div>
      <div hidden={activeTab !== "deudas"}>
        <LiabilitiesTab initialLiabilities={initialData.liabilities} {...shared} />
      </div>
    </div>
  );
}
