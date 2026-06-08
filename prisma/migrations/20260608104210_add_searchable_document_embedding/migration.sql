CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "SearchableDocument"
ADD COLUMN "embedding" vector(1024);