-- CreateEnum
CREATE TYPE "TriageStatus" AS ENUM ('GOOD', 'INTERMEDIATE', 'CRITICAL');

-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN     "triageStatus" "TriageStatus",
ADD COLUMN     "triagedAt" TIMESTAMP(3),
ADD COLUMN     "triagedById" TEXT;

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_triagedById_fkey" FOREIGN KEY ("triagedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
