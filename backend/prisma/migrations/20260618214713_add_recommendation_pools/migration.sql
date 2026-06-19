-- CreateEnum
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'DELIVERED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DeliveryChannel" AS ENUM ('BALLOON', 'EMAIL');

-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_items" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "adviceText" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "serviceId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pool_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "poolItemId" TEXT NOT NULL,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "channel" "DeliveryChannel",
    "signalTag" TEXT NOT NULL,
    "signalBasis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pools_tag_key" ON "pools"("tag");

-- CreateIndex
CREATE INDEX "pool_items_poolId_idx" ON "pool_items"("poolId");

-- CreateIndex
CREATE INDEX "recommendations_userId_status_idx" ON "recommendations"("userId", "status");

-- CreateIndex
CREATE INDEX "recommendations_userId_deliveredAt_idx" ON "recommendations"("userId", "deliveredAt");

-- AddForeignKey
ALTER TABLE "pool_items" ADD CONSTRAINT "pool_items_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_poolItemId_fkey" FOREIGN KEY ("poolItemId") REFERENCES "pool_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
