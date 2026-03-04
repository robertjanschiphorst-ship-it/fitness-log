-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL DEFAULT 'GENERAL',
    "daysPerWeek" INTEGER NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProgramWorkout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    CONSTRAINT "ProgramWorkout_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramWorkoutExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programWorkoutId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "targetSets" INTEGER NOT NULL,
    "repRangeMin" INTEGER NOT NULL,
    "repRangeMax" INTEGER NOT NULL,
    "rpeTarget" INTEGER,
    CONSTRAINT "ProgramWorkoutExercise_programWorkoutId_fkey" FOREIGN KEY ("programWorkoutId") REFERENCES "ProgramWorkout" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgramWorkoutExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWorkout_programId_dayNumber_key" ON "ProgramWorkout"("programId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramWorkoutExercise_programWorkoutId_sortOrder_key" ON "ProgramWorkoutExercise"("programWorkoutId", "sortOrder");
