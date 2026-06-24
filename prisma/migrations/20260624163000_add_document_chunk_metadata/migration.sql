-- AlterTable
ALTER TABLE "SearchableDocument"
ADD COLUMN "documentId" TEXT,
ADD COLUMN "documentTitle" TEXT,
ADD COLUMN "documentType" TEXT,
ADD COLUMN "sourceDate" TIMESTAMP(3),
ADD COLUMN "chunkIndex" INTEGER;

-- CreateIndex
CREATE INDEX "SearchableDocument_friendId_documentId_idx"
ON "SearchableDocument"("friendId", "documentId");
