-- CreateIndex
CREATE INDEX "user_signals_sourceDocId_idx" ON "user_signals"("sourceDocId");

-- AddForeignKey
ALTER TABLE "user_signals" ADD CONSTRAINT "user_signals_sourceDocId_fkey" FOREIGN KEY ("sourceDocId") REFERENCES "ocr_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
