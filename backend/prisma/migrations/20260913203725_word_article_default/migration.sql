/*
  Warnings:

  - Made the column `article` on table `Word` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Word" ALTER COLUMN "article" SET NOT NULL,
ALTER COLUMN "article" SET DEFAULT '';
