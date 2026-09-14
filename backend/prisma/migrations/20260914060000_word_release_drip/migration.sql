-- AlterTable
ALTER TABLE "Word" ADD COLUMN "releasedAt" TIMESTAMP(3);

-- Existing curated words stay live after migrate (before re-seed).
UPDATE "Word" SET "releasedAt" = TIMESTAMP '1970-01-01 00:00:00' WHERE "releasedAt" IS NULL;

-- CreateIndex
CREATE INDEX "Word_releasedAt_frequencyRank_idx" ON "Word"("releasedAt", "frequencyRank");

-- CreateTable
CREATE TABLE "WordReleaseDay" (
    "id" TEXT NOT NULL,
    "releaseDate" TEXT NOT NULL,
    "releasedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordReleaseDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordReleaseDay_releaseDate_key" ON "WordReleaseDay"("releaseDate");
