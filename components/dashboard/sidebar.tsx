"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "ti-layout-dashboard" },
  { href: "/mi-dinero", label: "Mi dinero", icon: "ti-wallet" },
  { href: "/inversiones", label: "Inversiones", icon: "ti-chart-line" },
  { href: "/objetivos", label: "Objetivos", icon: "ti-target-arrow" },
  { href: "/plan-inversion", label: "Plan de inversión", icon: "ti-route" },
  { href: "/perfil-riesgo", label: "Perfil del inversor", icon: "ti-user-check" },
  { href: "/simulador", label: "Simulador", icon: "ti-calculator" },
  { href: "/analisis-ia", label: "Análisis IA", icon: "ti-sparkles" },
  { href: "/plataformas", label: "Plataformas", icon: "ti-plug-connected" },
  { href: "/alertas", label: "Alertas", icon: "ti-bell" },
  { href: "/configuracion", label: "Configuración", icon: "ti-settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-ink-950 px-4 py-6">
      <div className="px-2 mb-8 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-wealth-500 flex items-center justify-center shrink-0">
          <i className="ti ti-compass text-ink-950 text-base" aria-hidden="true" />
        </div>
        <span className="figure text-lg font-medium text-white tracking-tight">WealthPilot</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors border-l-2",
                active
                  ? "bg-white/[0.06] text-white font-medium border-wealth-500"
                  : "text-mist-400 border-transparent hover:bg-white/[0.03] hover:text-mist-200"
              )}
            >
              <i className={`ti ${item.icon} text-[15px]`} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** Navegación inferior para móvil — solo las secciones más usadas */
export function MobileNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-ink-900 border-t border-mist-200 dark:border-ink-700 flex justify-around py-2 z-20">
      {items.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 px-2 py-1 text-[11px]",
              active ? "text-wealth-500" : "text-ink-600 dark:text-mist-300"
            )}
          >
            <i className={`ti ${item.icon} text-lg`} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
