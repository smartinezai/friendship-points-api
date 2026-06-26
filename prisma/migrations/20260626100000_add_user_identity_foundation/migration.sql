-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Seed a deterministic development user for the mocked request context.
INSERT INTO "User" ("id", "email", "displayName", "updatedAt")
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'dev-user@friendship-points.local',
    'Development User',
    CURRENT_TIMESTAMP
);

-- AlterTable
ALTER TABLE "Friend"
ADD COLUMN "ownerUserId" TEXT;

UPDATE "Friend"
SET "ownerUserId" = '00000000-0000-4000-8000-000000000001'
WHERE "ownerUserId" IS NULL;

ALTER TABLE "Friend"
ALTER COLUMN "ownerUserId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Friend_ownerUserId_idx" ON "Friend"("ownerUserId");

-- AddForeignKey
ALTER TABLE "Friend"
ADD CONSTRAINT "Friend_ownerUserId_fkey"
FOREIGN KEY ("ownerUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
