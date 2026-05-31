-- Make legacy fileUrl optional (new RustFS-backed records don't store a permanent URL)
ALTER TABLE "ocr_documents" ALTER COLUMN "fileUrl" DROP NOT NULL;

-- AlterTable: add patient-upload metadata + source discriminator
ALTER TABLE "ocr_documents"
    ADD COLUMN "fileName"   TEXT,
    ADD COLUMN "storageKey" TEXT,
    ADD COLUMN "mimeType"   TEXT,
    ADD COLUMN "sizeBytes"  BIGINT,
    ADD COLUMN "category"   TEXT,
    ADD COLUMN "source"     TEXT NOT NULL DEFAULT 'OCR';

-- CreateIndex
CREATE INDEX "ocr_documents_patientId_idx" ON "ocr_documents"("patientId");

-- CreateIndex
CREATE INDEX "ocr_documents_source_idx" ON "ocr_documents"("source");
