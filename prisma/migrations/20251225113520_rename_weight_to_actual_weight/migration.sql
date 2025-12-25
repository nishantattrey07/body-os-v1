/*
  Warnings:

  - You are about to drop the column `weight` on the `SetLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SetLog" DROP COLUMN "weight",
ADD COLUMN     "actualWeight" DOUBLE PRECISION NOT NULL DEFAULT 0;
