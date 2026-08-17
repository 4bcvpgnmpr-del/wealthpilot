import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WealthPilot — Planifica e invierte con criterio",
  description: "Planificación financiera personal e inversión orientativa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
