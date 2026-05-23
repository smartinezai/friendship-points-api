-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "biasNotes" TEXT,
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "impactDirection" TEXT,
ADD COLUMN     "matchedRuleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
