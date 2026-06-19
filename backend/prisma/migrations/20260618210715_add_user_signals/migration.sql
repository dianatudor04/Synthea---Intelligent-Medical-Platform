-- DropIndex
DROP INDEX "document_chunks_embedding_hnsw_idx";

-- CreateTable
CREATE TABLE "user_signals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "basis" TEXT,
    "sourceDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_signals_userId_tag_idx" ON "user_signals"("userId", "tag");

-- AddForeignKey
ALTER TABLE "user_signals" ADD CONSTRAINT "user_signals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
