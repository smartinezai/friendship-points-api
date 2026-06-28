-- CreateTable
CREATE TABLE "PersonFact" (
    "id" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "authorPersonId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonFact_targetPersonId_idx" ON "PersonFact"("targetPersonId");

-- CreateIndex
CREATE INDEX "PersonFact_authorPersonId_idx" ON "PersonFact"("authorPersonId");

-- CreateIndex
CREATE INDEX "PersonFact_verificationStatus_idx" ON "PersonFact"("verificationStatus");

-- AddForeignKey
ALTER TABLE "PersonFact"
ADD CONSTRAINT "PersonFact_targetPersonId_fkey"
FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonFact"
ADD CONSTRAINT "PersonFact_authorPersonId_fkey"
FOREIGN KEY ("authorPersonId") REFERENCES "Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
