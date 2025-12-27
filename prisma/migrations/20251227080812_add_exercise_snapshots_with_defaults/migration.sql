-- DropForeignKey
ALTER TABLE "SessionExercise" DROP CONSTRAINT "SessionExercise_exerciseId_fkey";

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "exerciseCategory" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "exerciseEquipment" TEXT,
ADD COLUMN     "exerciseName" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "trackingType" TEXT NOT NULL DEFAULT 'reps',
ALTER COLUMN "exerciseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
