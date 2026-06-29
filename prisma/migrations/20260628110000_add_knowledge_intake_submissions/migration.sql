-- CreateTable
CREATE TABLE "KnowledgeIntakeSubmission" (
    "id" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "targetPersonId" TEXT NOT NULL,
    "submittedByPersonId" TEXT,
    "submittedByType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'api',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeIntakeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeIntakeAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeIntakeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeIntakeSubmission_friendId_idx" ON "KnowledgeIntakeSubmission"("friendId");

-- CreateIndex
CREATE INDEX "KnowledgeIntakeSubmission_targetPersonId_idx" ON "KnowledgeIntakeSubmission"("targetPersonId");

-- CreateIndex
CREATE INDEX "KnowledgeIntakeSubmission_submittedByPersonId_idx" ON "KnowledgeIntakeSubmission"("submittedByPersonId");

-- CreateIndex
CREATE INDEX "KnowledgeIntakeAnswer_submissionId_idx" ON "KnowledgeIntakeAnswer"("submissionId");

-- AddForeignKey
ALTER TABLE "KnowledgeIntakeSubmission"
ADD CONSTRAINT "KnowledgeIntakeSubmission_friendId_fkey"
FOREIGN KEY ("friendId") REFERENCES "Friend"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIntakeSubmission"
ADD CONSTRAINT "KnowledgeIntakeSubmission_targetPersonId_fkey"
FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIntakeSubmission"
ADD CONSTRAINT "KnowledgeIntakeSubmission_submittedByPersonId_fkey"
FOREIGN KEY ("submittedByPersonId") REFERENCES "Person"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeIntakeAnswer"
ADD CONSTRAINT "KnowledgeIntakeAnswer_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "KnowledgeIntakeSubmission"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
