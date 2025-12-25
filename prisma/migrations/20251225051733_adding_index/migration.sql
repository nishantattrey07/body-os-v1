/*
  Warnings:

  - A unique constraint covering the columns `[sessionExerciseId,setNumber]` on the table `SetLog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SetLog_sessionExerciseId_setNumber_key" ON "SetLog"("sessionExerciseId", "setNumber");
