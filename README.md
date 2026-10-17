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

## Estado — Fase 6 completa

- Simulador en `/simulador`: recálculo instantáneo en el cliente (matemática pura, sin llamada a servidor), usando `simulateThreeScenarios` de Fase 1
- Sliders para capital inicial, aportación mensual, crecimiento anual de la aportación, años e inflación — actualiza el gráfico al instante al mover cualquiera
- Gráfico de líneas (Recharts) con los 3 escenarios (conservador 4%, moderado 7%, optimista 9%) superpuestos
- Tarjetas de resultado final por escenario: valor nominal, valor real ajustado a inflación, total aportado y crecimiento

## Estado — Fase 7 completa

- Motor de asignación de inversión (`lib/finance-engine/allocation.ts`): tabla documentada de distribución base por perfil de riesgo (5 categorías × 4 clases de activo), determinista y testeada — no es una caja negra ni una IA decidiendo cifras
- API en `app/api/investment-plan` (GET calcula sin guardar, POST genera y persiste `InvestmentPlan` + `Recommendation` con snapshot de los datos usados, para trazabilidad)
- UI en `/plan-inversion`: capital disponible, distribución propuesta con barra de composición, **por qué** de la propuesta, **qué riesgo tiene** explícito, y el disclaimer obligatorio de "propuesta orientativa, no es una orden de inversión" (spec sección 20)
- Validado contra Postgres real: usuario con 750€ disponibles y perfil EQUILIBRADO → 337,50€ ETF / 187,50€ renta fija / 112,50€ USA / 112,50€ liquidez
- **Nota de límite**: con esta fase llegamos a 12 funciones serverless — el máximo exacto del plan Hobby de Vercel. (Actualizado: tras unificar las rutas de Mi Dinero, el proyecto usa 9.)

## Estado — Fase 8 completa

- Chat de Análisis IA en `/analisis-ia`: historial de conversaciones en el lateral, sugerencias de preguntas, respuestas en streaming visual (indicador de "escribiendo")
- Reutiliza el endpoint `app/api/ai/chat` ya construido en Fase 1 (sin crear función nueva — seguimos en 12, el límite de Vercel Hobby) — le añadí un `GET` para listar/cargar conversaciones pasadas
- El motor (`lib/ai/financial-assistant.ts`) construye el contexto SIEMPRE desde datos reales de la base de datos; si algo falta, el system prompt le indica a Claude decirlo explícitamente en vez de inventar cifras
- Actualizado el modelo a `claude-sonnet-5` (el anterior estaba desactualizado)
- Guardado de historial validado contra Postgres real: conversación + mensajes usuario/asistente

## Estado — Fase 9 completa

- Motor de alertas (`lib/finance-engine/alerts.ts`): reglas puras y testeadas para cada tipo del spec — disponible mensual, progreso de objetivos (50/75/100%), fondo de emergencia bajo, cambio de cartera, aportación insuficiente
- API consolidada en `app/api/alerts/[[...id]]/route.ts`: el `GET` recalcula alertas candidatas a partir de datos reales, evita duplicados (clave `type+mensaje`), y las persiste; `PATCH` marca como leída o activa/desactiva; `DELETE` borra
- **Para hacer sitio a esta función nueva sin superar el límite de 12 de Vercel**, eliminé `app/api/finance/summary` — era código muerto, ningún componente lo llamaba (el Dashboard y Mi Dinero ya calculan el flujo directamente en el servidor)
- UI en `/alertas`: lista con icono por tipo, distinción visual leída/no leída, activar/desactivar por alerta, borrar
- Validado contra Postgres real: alerta de disponible mensual (500€) y de objetivo al 60% (cruza el umbral del 50%), más verificación de que la deduplicación por `type+message` evita duplicados

## Estado — Fase 10 completa (10 de 10 fases del plan original)

- UI de Plataformas en `/plataformas`: lee la lista de brokers **directamente del registro real** (`BROKER_ADAPTER_REGISTRY` en `lib/brokers/adapter.ts`), no de una lista duplicada — si algún adapter pasa a implementarse de verdad, se reflejaría aquí sin tocar la página
- Cada tarjeta muestra claramente "Integración pendiente" y explica, al pulsar "Conectar", que la arquitectura (adapters, tokenización) ya está lista pero la conexión real aún no — tal como exige el spec (sección 18: nada de integraciones simuladas)
- **Sin endpoints nuevos**: como no hay ninguna conexión real que gestionar todavía, esta fase es puramente informativa del lado del cliente — seguimos en 12 funciones

## Mejora — Edición, categorías propias e iconos en Mi Dinero

- **Edición**: cada ingreso, gasto, activo y deuda tiene un botón de lápiz que carga el movimiento en el formulario ("Guardar cambios" / "Cancelar"). Borrar ahora pide confirmación y, si falla, el movimiento vuelve a la lista en vez de desaparecer en silencio
- **Categorías propias**: chip "+ Nueva" en el selector de categoría (nombre + icono). Se pueden renombrar, cambiar de icono o borrar con el lápiz del chip. Al renombrar, los movimientos que la usaban pasan al nombre nuevo en la misma transacción; al borrar, los movimientos se conservan con su nombre como texto
- **Iconos**: cada movimiento puede tener su propio emoji; si no, usa el de su categoría. Fuente única de categorías e iconos predefinidos en `lib/money/categories.ts`
- **Esquema**: `Asset.type` deja de ser el enum rígido `AssetType` y pasa a texto (como el resto), columna `icon` en las 4 tablas y nueva tabla `user_categories` — migración `0002_custom_categories_icons`, validada contra Postgres 16 real con datos existentes
- **Funciones de Vercel: de 12 a 9.** Las 4 rutas de Mi Dinero más la nueva de categorías viven en un solo archivo, `app/api/[resource]/[[...id]]/route.ts`, con las mismas URLs de siempre (las rutas estáticas como `/api/goals` tienen prioridad sobre el segmento dinámico)
- **Arreglos encontrados por el camino**:
  - Al cambiar de pestaña se perdía lo recién añadido hasta recargar (las pestañas se desmontaban). Ahora permanecen montadas y las tarjetas de resumen se refrescan al guardar
  - Los mensajes de validación de campo (Zod `fieldErrors`) nunca se mostraban; ahora sí
  - Los botones de editar/borrar solo aparecían con hover, así que en el móvil eran invisibles; ahora se ven siempre en pantallas táctiles
  - `Alert.type` era enum en Prisma pero `TEXT` en la base de datos y el tipo `AlertType` no existía, lo que hacía fallar el guardado de alertas — migración `0003_fix_alert_type_enum`
- Por primera vez se generaron los tipos de Prisma en el sandbox (`prisma generate --no-engine`), así que el código nuevo y `mi-dinero/page.tsx` se han verificado con `tsc --strict` sin errores. La ruta unificada se probó con 13 tests contra una base de datos en memoria (validación, edición parcial, aislamiento entre usuarios, rename en cascada, duplicados); `lib/money/categories.test.ts` añade 5 tests permanentes

## Mejora — Edición e iconos en Objetivos e Inversiones

- Lápiz en cada objetivo y en cada posición de la cartera: el formulario de arriba pasa a modo edición ("Guardar cambios" / "Cancelar"). En Inversiones esto permite por fin actualizar el **precio actual** sin borrar y recrear la posición
- Icono propio (emoji) por objetivo e inversión, con icono por defecto según tipo/categoría (`GOAL_TYPE_ICONS`, `INVESTMENT_CATEGORY_ICONS` en `lib/money/categories.ts`). Migración `0004_goal_investment_icons`
- Aquí las categorías siguen siendo fijas a propósito: el tipo de objetivo y la categoría de inversión los usan el motor de alertas, la distribución de la cartera y el plan de inversión
- Borrar pide confirmación y, si falla, el elemento vuelve a la lista; botones visibles en pantallas táctiles; el Dashboard se refresca al guardar
- Sin endpoints nuevos (las rutas ya tenían PATCH): siguen siendo 9 funciones. Verificado con `tsc --strict` y 5 tests de ejecución de ambas rutas (edición parcial sin perder el icono, aislamiento entre usuarios, categoría fuera del enum rechazada)

## Qué falta

Las 10 fases del plan de desarrollo original están completas. Quedan pendientes, para cuando se decida priorizarlas:

- Implementar el primer adapter de broker real (cuando se decida cuál, y tras revisión legal del acceso a cuentas de terceros)
- Formularios completos del flujo de onboarding guiado (spec sección 16) — actualmente el registro lleva directo al Dashboard con estados vacíos
- Activar `ANTHROPIC_API_KEY` en producción para el chat de Análisis IA (Fase 8), pendiente de que el usuario decida sobre el coste
- Revisión legal de los disclaimers de "propuesta orientativa" frente a normativa de asesoramiento financiero regulado (MiFID II), tal como se señaló en el análisis de arquitectura inicial, antes de cualquier lanzamiento con usuarios reales
- Fase 7: endpoint `/api/finance/plan` que combina objetivos + perfil + capital disponible
- Fase 9: motor de alertas (cron/job)
- Fase 10: implementar el primer adapter real de broker cuando se decida cuál priorizar

## Notas de seguridad

- Ninguna credencial de broker se almacena en texto plano — `BrokerConnection` solo guarda tokens
- Todas las rutas API verifican sesión y filtran por `userId`
- Contraseñas hasheadas con bcrypt (12 rounds)

## Notas legales

Como se señaló en el análisis de arquitectura: antes de lanzar con usuarios reales, conviene que un abogado especializado en fintech revise los disclaimers de "propuesta orientativa" frente a normativa de asesoramiento financiero regulado (MiFID II en la UE).
