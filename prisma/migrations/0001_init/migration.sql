-- WealthPilot — DDL inicial, equivalente al esquema en prisma/schema.prisma
-- Generado a mano porque el motor de Prisma no pudo descargarse en este sandbox
-- (binaries.prisma.sh fuera de la whitelist de red). En un entorno normal,
-- esto se sustituye por `npx prisma migrate dev`.

CREATE TYPE "Recurrence" AS ENUM ('ONE_TIME', 'MONTHLY', 'ANNUAL');
CREATE TYPE "ExpenseType" AS ENUM ('FIXED', 'VARIABLE');
CREATE TYPE "AssetType" AS ENUM ('CASH', 'BANK_ACCOUNT', 'DEPOSIT', 'EMERGENCY_FUND', 'OTHER');
CREATE TYPE "GoalType" AS ENUM ('HOME', 'CAR', 'TRIP', 'EMERGENCY_FUND', 'RETIREMENT', 'FINANCIAL_INDEPENDENCE', 'NET_WORTH_TARGET', 'CUSTOM');
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "RiskCategory" AS ENUM ('CONSERVADOR', 'MODERADO', 'EQUILIBRADO', 'DINAMICO', 'AGRESIVO');
CREATE TYPE "InvestmentCategory" AS ENUM ('ETF', 'STOCK', 'FUND', 'BOND', 'DEPOSIT', 'CRYPTO', 'OTHER');
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL', 'DIVIDEND', 'CONTRIBUTION', 'FEE');
CREATE TYPE "BrokerProvider" AS ENUM ('INTERACTIVE_BROKERS', 'TRADE_REPUBLIC', 'DEGIRO', 'ETORO', 'OTHER');
CREATE TYPE "BrokerConnectionStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED');

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT,
  "name" TEXT,
  "emailVerified" TIMESTAMP,
  "image" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "accounts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  UNIQUE ("provider", "providerAccountId")
);

CREATE TABLE "sessions" (
  "id" TEXT PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" TIMESTAMP NOT NULL
);

CREATE TABLE "profiles" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "age" INTEGER,
  "country" TEXT DEFAULT 'ES',
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "onboardingStep" INTEGER NOT NULL DEFAULT 0,
  "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "incomes" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "recurrence" "Recurrence" NOT NULL DEFAULT 'MONTHLY',
  "startDate" TIMESTAMP NOT NULL DEFAULT now(),
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "incomes" ("userId");

CREATE TABLE "expenses" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "type" "ExpenseType" NOT NULL DEFAULT 'VARIABLE',
  "recurrence" "Recurrence" NOT NULL DEFAULT 'MONTHLY',
  "startDate" TIMESTAMP NOT NULL DEFAULT now(),
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "expenses" ("userId");

CREATE TABLE "assets" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "type" "AssetType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "assets" ("userId");

CREATE TABLE "liabilities" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "outstanding" DECIMAL(14,2) NOT NULL,
  "interestRate" DECIMAL(6,3) NOT NULL,
  "monthlyPayment" DECIMAL(14,2) NOT NULL,
  "endDate" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "liabilities" ("userId");

CREATE TABLE "goals" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" "GoalType" NOT NULL,
  "targetAmount" DECIMAL(14,2) NOT NULL,
  "currentAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "targetDate" TIMESTAMP,
  "monthlyContribution" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "priority" "GoalPriority" NOT NULL DEFAULT 'MEDIUM',
  "riskTolerance" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "goals" ("userId");

CREATE TABLE "risk_profiles" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "answers" JSONB NOT NULL,
  "score" INTEGER NOT NULL,
  "category" "RiskCategory" NOT NULL,
  "computedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "portfolios" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "investments" (
  "id" TEXT PRIMARY KEY,
  "portfolioId" TEXT NOT NULL REFERENCES "portfolios"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "ticker" TEXT,
  "isin" TEXT,
  "category" "InvestmentCategory" NOT NULL,
  "quantity" DECIMAL(18,6) NOT NULL,
  "purchasePrice" DECIMAL(14,4) NOT NULL,
  "currentPrice" DECIMAL(14,4) NOT NULL,
  "purchaseDate" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "investments" ("portfolioId");

CREATE TABLE "broker_connections" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" "BrokerProvider" NOT NULL,
  "status" "BrokerConnectionStatus" NOT NULL DEFAULT 'PENDING',
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "externalAccountId" TEXT,
  "connectedAt" TIMESTAMP,
  "lastSyncAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "broker_connections" ("userId");

CREATE TABLE "transactions" (
  "id" TEXT PRIMARY KEY,
  "investmentId" TEXT REFERENCES "investments"("id") ON DELETE SET NULL,
  "brokerConnectionId" TEXT REFERENCES "broker_connections"("id") ON DELETE SET NULL,
  "type" "TransactionType" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "quantity" DECIMAL(18,6),
  "price" DECIMAL(14,4),
  "date" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "transactions" ("investmentId");

CREATE TABLE "investment_plans" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "availableCapital" DECIMAL(14,2) NOT NULL,
  "allocation" JSONB NOT NULL,
  "rationale" TEXT,
  "generatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "investment_plans" ("userId");

CREATE TABLE "recommendations" (
  "id" TEXT PRIMARY KEY,
  "investmentPlanId" TEXT NOT NULL REFERENCES "investment_plans"("id") ON DELETE CASCADE,
  "summary" TEXT NOT NULL,
  "dataSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE "alerts" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "alerts" ("userId");

CREATE TABLE "ai_conversations" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "ai_conversations" ("userId");

CREATE TABLE "ai_messages" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "ai_conversations"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "contextSnapshot" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX ON "ai_messages" ("conversationId");
