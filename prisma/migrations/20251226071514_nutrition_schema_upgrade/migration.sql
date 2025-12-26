/*
  Warnings:

  - Added the required column `calories` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbs` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fat` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protein` to the `NutritionLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "NutritionLog" DROP CONSTRAINT "NutritionLog_inventoryItemId_fkey";

-- AlterTable
ALTER TABLE "DailyLog" ADD COLUMN     "cholesterolTotal" DOUBLE PRECISION,
ADD COLUMN     "fiberTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sodiumTotal" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "cholesterolPerUnit" DOUBLE PRECISION,
ADD COLUMN     "fiberPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sodiumPerUnit" DOUBLE PRECISION,
ADD COLUMN     "sugarPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "NutritionLog" ADD COLUMN     "calories" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "carbs" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cholesterol" DOUBLE PRECISION,
ADD COLUMN     "fat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "protein" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sodium" DOUBLE PRECISION,
ADD COLUMN     "sugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "inventoryItemId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "fiberTarget" DOUBLE PRECISION NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX "idx_inventory_barcode" ON "InventoryItem"("barcode");

-- AddForeignKey
ALTER TABLE "NutritionLog" ADD CONSTRAINT "NutritionLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
