-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "personId" TEXT;

-- AlterTable
ALTER TABLE "Friend"
ADD COLUMN "targetPersonId" TEXT;

-- Seed one person record for the deterministic development user.
INSERT INTO "Person" ("id", "displayName", "updatedAt")
VALUES (
    '00000000-0000-4000-8000-000000000002',
    'Development User',
    CURRENT_TIMESTAMP
);

UPDATE "User"
SET "personId" = '00000000-0000-4000-8000-000000000002'
WHERE "id" = '00000000-0000-4000-8000-000000000001';

-- Backfill one person record per existing tracked friend.
CREATE TEMP TABLE "_FriendPersonBackfill" AS
SELECT
    "id" AS "friendId",
    gen_random_uuid() AS "personId",
    "displayName",
    "createdAt",
    "updatedAt"
FROM "Friend"
WHERE "targetPersonId" IS NULL;

INSERT INTO "Person" ("id", "displayName", "createdAt", "updatedAt")
SELECT "personId", "displayName", "createdAt", "updatedAt"
FROM "_FriendPersonBackfill";

UPDATE "Friend"
SET "targetPersonId" = "_FriendPersonBackfill"."personId"
FROM "_FriendPersonBackfill"
WHERE "Friend"."id" = "_FriendPersonBackfill"."friendId";

DROP TABLE "_FriendPersonBackfill";

ALTER TABLE "Friend"
ALTER COLUMN "targetPersonId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "User_personId_idx" ON "User"("personId");

-- CreateIndex
CREATE INDEX "Friend_targetPersonId_idx" ON "Friend"("targetPersonId");

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "Person"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend"
ADD CONSTRAINT "Friend_targetPersonId_fkey"
FOREIGN KEY ("targetPersonId") REFERENCES "Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
