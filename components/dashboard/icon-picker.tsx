"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { ICON_CHOICES } from "@/lib/money/categories";

// Selector de icono (emoji). Muestra el icono actual en un botón cuadrado; al
// pulsarlo abre una rejilla con iconos sugeridos y un campo para pegar cualquier
// otro emoji. "fallbackIcon" es el que se usa si el usuario no elige ninguno
// (normalmente, el de la categoría).

export function IconPicker({
  value,
  onChange,
  fallbackIcon,
  allowReset = true,
  label = "Icono",
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
  fallbackIcon?: string;
  allowReset?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = value || fallbackIcon || "🏷️";

  function pick(icon: string | null) {
    onChange(icon);
    setOpen(false);
    setCustom("");
  }

  function submitCustom() {
    // Nos quedamos con el primer "carácter visible" (un emoji puede ocupar varios code points)
    const seg = typeof Intl !== "undefined" && "Segmenter" in Intl
      ? [...new (Intl as any).Segmenter("es", { granularity: "grapheme" }).segment(custom.trim())][0]?.segment
      : [...custom.trim()][0];
    if (seg) pick(seg);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${label}: ${shown}. Cambiar icono`}
        aria-expanded={open}
        className={clsx(
          "h-[38px] w-[42px] flex items-center justify-center rounded-md border text-xl transition-colors",
          "bg-white dark:bg-ink-800 border-mist-200 dark:border-ink-700 hover:border-wealth-400",
          !value && "opacity-80",
        )}
      >
        <span aria-hidden="true">{shown}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir icono"
          className="absolute z-30 left-0 mt-1.5 w-[268px] p-3 rounded-card border border-mist-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-card-hover"
        >
          <div className="grid grid-cols-8 gap-1 max-h-[180px] overflow-y-auto">
            {ICON_CHOICES.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => pick(icon)}
                aria-label={`Icono ${icon}`}
                className={clsx(
                  "h-8 w-8 flex items-center justify-center rounded-md text-lg hover:bg-mist-100 dark:hover:bg-ink-800",
                  value === icon && "bg-wealth-100 dark:bg-ink-700 ring-1 ring-wealth-500",
                )}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 mt-3">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitCustom();
                }
              }}
              placeholder="Pega otro emoji…"
              aria-label="Otro emoji"
              className="field-input flex-1 !py-1.5 text-sm"
            />
            <button type="button" onClick={submitCustom} className="px-2.5 text-xs font-medium rounded-md bg-mist-100 dark:bg-ink-800 hover:bg-mist-200 dark:hover:bg-ink-700">
              Usar
            </button>
          </div>

          {allowReset && value && (
            <button
              type="button"
              onClick={() => pick(null)}
              className="mt-2.5 text-xs text-ink-600 dark:text-mist-400 hover:text-wealth-500"
            >
              {fallbackIcon ? `Usar el de la categoría (${fallbackIcon})` : "Quitar icono"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
