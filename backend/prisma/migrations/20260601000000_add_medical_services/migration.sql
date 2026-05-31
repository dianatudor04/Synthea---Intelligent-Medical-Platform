-- CreateTable
CREATE TABLE "medical_services" (
    "id" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_services_specialty_idx" ON "medical_services"("specialty");

-- CreateIndex
CREATE INDEX "medical_services_active_idx" ON "medical_services"("active");

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "serviceId" TEXT;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "medical_services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
