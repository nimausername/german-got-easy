-- CreateEnum
CREATE TYPE "WordTopic" AS ENUM ('ESSENTIALS', 'PEOPLE', 'TIME', 'FOOD_DRINK', 'HOME', 'SCHOOL_WORK', 'TRAVEL', 'SHOPPING', 'DESCRIPTIONS');

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "topic" "WordTopic" NOT NULL DEFAULT 'ESSENTIALS';

-- CreateIndex
CREATE INDEX "Word_topic_frequencyRank_idx" ON "Word"("topic", "frequencyRank");
