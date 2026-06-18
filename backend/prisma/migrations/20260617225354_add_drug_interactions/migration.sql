-- CreateTable
CREATE TABLE "drugs" (
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "drug_interactions" (
    "id" SERIAL NOT NULL,
    "keyA" TEXT NOT NULL,
    "keyB" TEXT NOT NULL,
    "drugA" TEXT NOT NULL,
    "drugB" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "drug_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drugs_key_key" ON "drugs"("key");

-- CreateIndex
CREATE INDEX "drugs_key_idx" ON "drugs"("key");

-- CreateIndex
CREATE INDEX "drug_interactions_keyA_idx" ON "drug_interactions"("keyA");

-- CreateIndex
CREATE INDEX "drug_interactions_keyB_idx" ON "drug_interactions"("keyB");

-- CreateIndex
CREATE UNIQUE INDEX "drug_interactions_keyA_keyB_key" ON "drug_interactions"("keyA", "keyB");

-- CreateIndex
CREATE INDEX "appointments_doctorId_scheduledAt_idx" ON "appointments"("doctorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_patientId_idx" ON "invoices"("patientId");

-- CreateIndex
CREATE INDEX "medical_records_patientId_idx" ON "medical_records"("patientId");

-- CreateIndex
CREATE INDEX "medical_records_doctorId_idx" ON "medical_records"("doctorId");

-- CreateIndex
CREATE INDEX "reviews_doctorId_idx" ON "reviews"("doctorId");

-- CreateIndex
CREATE INDEX "reviews_patientId_idx" ON "reviews"("patientId");
