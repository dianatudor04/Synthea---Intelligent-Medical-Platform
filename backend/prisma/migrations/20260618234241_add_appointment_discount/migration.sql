-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "discountPct" INTEGER,
ADD COLUMN     "discountReason" TEXT,
ADD COLUMN     "originalFee" DOUBLE PRECISION;
