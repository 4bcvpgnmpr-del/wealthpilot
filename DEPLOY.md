# Desplegar WealthPilot en Vercel

Esta guía te lleva de "tengo el código" a "tengo una URL real funcionando", usando
Vercel + una base de datos Postgres gestionada. No hace falta instalar Postgres en tu
máquina.

## 1. Sube el código a GitHub

1. Crea un repositorio nuevo (vacío) en https://github.com/new — por ejemplo `wealthpilot`.
2. Descomprime el zip que te di en una carpeta local.
3. En una terminal, dentro de esa carpeta:
   ```bash
   git init
   git add .
   git commit -m "WealthPilot - fases 1 a 4"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/wealthpilot.git
   git push -u origin main
   ```

Si prefieres no usar terminal para esto, GitHub Desktop (desktop.github.com) te permite
arrastrar la carpeta y hacer el commit/push con clics.

## 2. Crea la base de datos (Neon, integrado con Vercel)

1. En https://vercel.com, crea una cuenta (puedes usar tu cuenta de GitHub para entrar).
2. Ve a tu dashboard → pestaña **Storage** → **Create Database** → elige **Neon** (Postgres serverless, tiene plan gratuito y es la opción recomendada por Vercel).
3. Dale un nombre (ej. `wealthpilot-db`) y créala.
4. Vercel te genera automáticamente la variable `DATABASE_URL` — la conectaremos al proyecto en el siguiente paso.

## 3. Importa el proyecto en Vercel

1. En tu dashboard de Vercel, pulsa **Add New → Project**.
2. Selecciona el repositorio `wealthpilot` que acabas de subir a GitHub.
3. Framework Preset: Vercel detectará **Next.js** automáticamente. No cambies nada del build command (ya está configurado en `package.json` para ejecutar `prisma generate` antes de compilar).
4. Antes de pulsar "Deploy", ve a **Environment Variables** y añade:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | (se rellena sola si conectaste la base de datos Neon del paso 2; si no, pégala tú) |
   | `NEXTAUTH_SECRET` | genera uno con `openssl rand -base64 32`, o cualquier cadena aleatoria larga |
   | `NEXTAUTH_URL` | la URL que te va a dar Vercel, ej. `https://wealthpilot-tuusuario.vercel.app` (puedes dejarlo vacío en el primer deploy y añadirlo después, ver nota abajo) |
   | `ANTHROPIC_API_KEY` | opcional por ahora — solo hace falta para Análisis IA (Fase 8, aún no construida) |

5. Pulsa **Deploy**.

**Nota sobre `NEXTAUTH_URL`**: la primera vez no sabrás la URL final hasta que termine el deploy. Está bien — despliega igualmente, copia la URL que te da Vercel al terminar, añádela como variable `NEXTAUTH_URL`, y vuelve a desplegar (Vercel → tu proyecto → Deployments → los tres puntos del último deploy → Redeploy).

## 4. Crea las tablas en la base de datos

El deploy de Vercel compila la app pero no crea las tablas por sí solo. Tienes dos formas:

**Opción A — desde tu máquina (recomendada, un solo comando):**
```bash
# con el DATABASE_URL de Neon en tu .env local
npx prisma migrate deploy
```

**Opción B — desde el SQL Editor de Neon:**
Copia el contenido de `prisma/migrations/0001_init/migration.sql` y pégalo en el editor SQL de tu proyecto Neon (Neon dashboard → tu base de datos → SQL Editor → pegar y ejecutar).

## 5. Prueba la app

Abre la URL que te dio Vercel. Deberías ver la pantalla de login. Pulsa "Crear cuenta",
regístrate, y ya puedes usar Mi Dinero, Objetivos y Perfil del Inversor con tus propios
datos — guardados en una base de datos Postgres real en la nube.

## Después de esto

Cada vez que te pase una versión nueva del código:
1. Reemplaza los archivos en tu carpeta local (o te doy solo los archivos cambiados)
2. `git add . && git commit -m "actualización" && git push`
3. Vercel despliega automáticamente en cuanto detecta el push — no hace falta que hagas nada más

Si cambia el esquema de la base de datos (nuevas tablas/campos), habrá que repetir el paso 4 con la nueva migración.
