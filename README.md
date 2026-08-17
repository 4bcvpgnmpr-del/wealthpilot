# WealthPilot

Aplicación de planificación financiera personal e inversión orientativa. Ver el brief original para el alcance completo (secciones 1–20).

## Estado actual — Fase 1 y arranque de Fase 2

Implementado en esta pasada:

- **Arquitectura**: Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL
- **Base de datos**: esquema Prisma completo (`prisma/schema.prisma`) con las 16 entidades del spec
- **Autenticación**: NextAuth (credentials + adapter Prisma), registro con contraseña hasheada (bcrypt)
- **Motor financiero** (`lib/finance-engine/core.ts`): funciones puras y testeadas —
  flujo mensual, progreso de objetivos, crecimiento compuesto con 3 escenarios
- **Sistema de puntuación de riesgo** (`lib/risk-profile/scoring.ts`): documentado, configurable, auditable
- **Arquitectura de brokers** (`lib/brokers/adapter.ts`): patrón adapter, todos marcados "Integración pendiente" (Fase 10, sin datos simulados)
- **Integración con Claude** (`lib/ai/financial-assistant.ts`): construye contexto real desde la BD, nunca inventa datos, guarda el historial
- **Dashboard**: server component con datos reales de Prisma, estados vacíos honestos cuando faltan datos (sin gráficas decorativas)
- **Login / registro**: funcionales contra la base de datos

## Cómo arrancar

**¿Quieres verla funcionando en una URL real sin instalar nada localmente?** Sigue **[DEPLOY.md](./DEPLOY.md)** — despliegue en Vercel + base de datos Neon, paso a paso.

Para desarrollo local:

```bash
cp .env.example .env
# rellenar DATABASE_URL, NEXTAUTH_SECRET, ANTHROPIC_API_KEY

npm install
npm run prisma:generate
npm run prisma:migrate   # crea las tablas
npm run dev
```

## Límite de funciones serverless en Vercel (plan Hobby)

El plan Hobby de Vercel permite un máximo de 12 funciones serverless por deployment.
Cada archivo `route.ts` dentro de `app/api` cuenta como una función independiente.
Los endpoints CRUD (income, expenses, assets, liabilities, goals) se consolidaron
usando rutas dinámicas opcionales de Next.js (`app/api/income/[[...id]]/route.ts`),
de modo que la colección (`GET`/`POST` sin id) y el recurso individual
(`GET`/`PATCH`/`DELETE` con id) viven en un mismo archivo. Esto bajó el conteo de
15 a 10 funciones, sin cambiar ninguna URL ni el comportamiento de la API — el
frontend sigue llamando a `/api/income` y `/api/income/{id}` exactamente igual.

## Validación contra base de datos real

El esquema (`prisma/schema.prisma`) se ha probado contra una instancia real de PostgreSQL 16:

- Las 19 tablas se crean sin errores (`prisma/migrations/0001_init/migration.sql`)
- Se insertaron datos reales (usuario, ingresos, gastos, un objetivo) y el motor financiero
  (`lib/finance-engine/core.ts`) calculó correctamente sobre ellos: capacidad de ahorro,
  disponible para invertir y progreso de objetivo
- Se verificó `ON DELETE CASCADE`: al borrar un usuario, sus ingresos/gastos/objetivos
  se eliminan automáticamente sin dejar registros huérfanos

**Nota honesta sobre este sandbox**: el motor binario de Prisma (`libquery_engine`) se
descarga de `binaries.prisma.sh`, un dominio fuera de la whitelist de red de este entorno,
así que `prisma generate` / `prisma migrate dev` no pueden ejecutarse aquí. Por eso el DDL
de `migration.sql` se escribió a mano (idéntico al schema) y se aplicó con `psql` directamente
para validar el modelo de datos. **En un entorno normal sin esa restricción de red, usa
`npm run prisma:migrate` como de costumbre** — no hace falta este rodeo.

Consecuencia de lo anterior: `npx tsc --noEmit` marca ~13 errores de tipo `implicit any` en
`dashboard/page.tsx` y `mi-dinero/page.tsx`, todos en callbacks de `.map()`/`.reduce()` sobre
resultados de Prisma. Esto ocurre porque sin el cliente generado, TypeScript no conoce los
tipos `Income`, `Expense`, etc. En cuanto se ejecute `npm run prisma:generate` en un entorno
con acceso de red normal, estos tipos se infieren automáticamente y los errores desaparecen
sin tocar el código.

## Tests

```bash
npm run test
```

Cubre el motor financiero (`lib/finance-engine/core.test.ts`): flujo mensual, progreso de objetivos y crecimiento compuesto.

## Estado — Fase 2 completa

- CRUD completo de ingresos, gastos, activos y deudas: API REST (`app/api/income`, `/expenses`, `/assets`, `/liabilities`, cada uno con colección + `[id]`) y UI en `/mi-dinero` con pestañas, formularios validados y listas con borrado
- Todas las rutas verifican sesión y filtran por `userId` (`lib/session.ts`)
- Validación de inputs con Zod en cada endpoint, tanto en creación como en edición
- La página `/mi-dinero` muestra un resumen en vivo (capacidad de ahorro, disponible para invertir, deudas totales) calculado con el mismo motor financiero puro y testeado de la Fase 1 — nunca se recalcula la lógica en el frontend

## Estado — Fase 3 completa

- CRUD completo de objetivos: API REST (`app/api/goals`, colección + `[id]`) y UI en `/objetivos`
- Cada tarjeta de objetivo usa `calculateGoalProgress` (motor de Fase 1) para mostrar: % completado, cantidad faltante, meses restantes, aportación necesaria y si la aportación actual del usuario es suficiente ("en camino" / "insuficiente")
- Validación con Zod, sesión verificada y filtrado por `userId` en cada endpoint
- **Hallazgo real durante la validación**: al probar con fechas reales que cruzan un año bisiesto, `monthsRemaining` da 25 en vez de 24 para un plazo "de 2 años" — es la aproximación esperada de 30,44 días/mes (no un error), pero se documentó con un test permanente para que no sorprenda más adelante

## Estado — Fase 4 completa

- Cuestionario de perfil de riesgo en `/perfil-riesgo`: 6 preguntas, selección tipo botón (no dropdowns), envía respuestas a `/api/risk-profile`
- El cálculo vive únicamente en `lib/risk-profile/scoring.ts` (Fase 1) — la ruta API nunca decide el resultado por su cuenta, solo lo persiste
- `upsert` por `userId`: repetir el cuestionario actualiza el perfil existente en vez de duplicarlo (verificado contra Postgres real)
- El resultado muestra la categoría, una explicación en lenguaje llano, y un desglose expandible con la contribución ponderada de cada pregunta — así el usuario puede ver por qué se le asignó ese perfil, no solo el resultado
- Tests permanentes añadidos en `lib/risk-profile/scoring.test.ts`: casos extremos (conservador/agresivo), verificación de que los pesos suman 1.0, y que el breakdown es consistente

## Estado — Fase 5 completa

- Cartera de inversiones: API consolidada en `app/api/investments/[[...id]]/route.ts` (11 funciones totales, dentro del límite de Vercel Hobby) — crea automáticamente el `Portfolio` del usuario si no existe
- UI en `/inversiones`: formulario con ticker/ISIN opcionales, categoría, cantidad, precios y fecha de compra
- Motor de cálculo puro y testeado (`lib/finance-engine/portfolio.ts`): rentabilidad €/%, peso de cada activo, distribución por categoría — validado contra Postgres real con una cartera ETF+Bitcoin

## Qué falta (siguiente pasada)

Siguiendo el plan de fases acordado:

- Fase 6: UI del simulador (usa `simulateThreeScenarios`, ya implementado)
- Fase 7: endpoint `/api/finance/plan` que combina objetivos + perfil + capital disponible
- Fase 9: motor de alertas (cron/job)
- Fase 10: implementar el primer adapter real de broker cuando se decida cuál priorizar

## Notas de seguridad

- Ninguna credencial de broker se almacena en texto plano — `BrokerConnection` solo guarda tokens
- Todas las rutas API verifican sesión y filtran por `userId`
- Contraseñas hasheadas con bcrypt (12 rounds)

## Notas legales

Como se señaló en el análisis de arquitectura: antes de lanzar con usuarios reales, conviene que un abogado especializado en fintech revise los disclaimers de "propuesta orientativa" frente a normativa de asesoramiento financiero regulado (MiFID II en la UE).
