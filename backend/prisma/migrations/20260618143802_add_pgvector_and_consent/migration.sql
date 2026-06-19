-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "profiling" BOOLEAN NOT NULL DEFAULT false,
    "marketingEmail" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_audits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_key" ON "user_consents"("userId");

-- CreateIndex
CREATE INDEX "consent_audits_userId_idx" ON "consent_audits"("userId");

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_audits" ADD CONSTRAINT "consent_audits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
