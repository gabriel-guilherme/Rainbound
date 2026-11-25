-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "ReadingDay" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "goalMet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingDay_userId_goalMet_idx" ON "ReadingDay"("userId", "goalMet");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingDay_userId_date_key" ON "ReadingDay"("userId", "date");

-- AddForeignKey
ALTER TABLE "ReadingDay" ADD CONSTRAINT "ReadingDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
