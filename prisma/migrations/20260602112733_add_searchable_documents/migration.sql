-- CreateTable
CREATE TABLE "SearchableDocument" (
    "id" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchableDocument_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SearchableDocument" ADD CONSTRAINT "SearchableDocument_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "Friend"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
