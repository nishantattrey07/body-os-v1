-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "targetWeight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SetLog" ADD COLUMN     "targetWeight" DOUBLE PRECISION;
