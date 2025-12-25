-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "defaultDistance" DOUBLE PRECISION,
ADD COLUMN     "defaultDistanceUnit" TEXT NOT NULL DEFAULT 'm',
ADD COLUMN     "tracksDistance" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RoutineExercise" ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "distanceUnit" TEXT;

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN     "targetDistance" DOUBLE PRECISION,
ADD COLUMN     "targetDistanceUnit" TEXT;

-- AlterTable
ALTER TABLE "SetLog" ADD COLUMN     "actualDistance" DOUBLE PRECISION,
ADD COLUMN     "distanceUnit" TEXT,
ADD COLUMN     "targetDistance" DOUBLE PRECISION;
