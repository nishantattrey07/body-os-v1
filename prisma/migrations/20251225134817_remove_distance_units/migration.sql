/*
  Warnings:

  - You are about to drop the column `defaultDistanceUnit` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `distanceUnit` on the `RoutineExercise` table. All the data in the column will be lost.
  - You are about to drop the column `targetDistanceUnit` on the `SessionExercise` table. All the data in the column will be lost.
  - You are about to drop the column `distanceUnit` on the `SetLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "defaultDistanceUnit";

-- AlterTable
ALTER TABLE "RoutineExercise" DROP COLUMN "distanceUnit";

-- AlterTable
ALTER TABLE "SessionExercise" DROP COLUMN "targetDistanceUnit";

-- AlterTable
ALTER TABLE "SetLog" DROP COLUMN "distanceUnit";
