/*
  Warnings:

  - You are about to drop the column `author` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `currentCfi` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `currentPage` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `totalPages` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `format` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('BOOK', 'COMIC', 'MANGA');

-- CreateEnum
CREATE TYPE "FileFormat" AS ENUM ('EPUB', 'PDF', 'CBZ', 'CBR');

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "author",
DROP COLUMN "category",
DROP COLUMN "currentCfi",
DROP COLUMN "currentPage",
DROP COLUMN "totalPages",
ADD COLUMN     "creator" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "format" "FileFormat" NOT NULL,
ADD COLUMN     "type" "ContentType" NOT NULL;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" SERIAL NOT NULL,
    "bookId" INTEGER NOT NULL,
    "currentPosition" INTEGER NOT NULL DEFAULT 0,
    "totalPositions" INTEGER,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locator" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_bookId_key" ON "ReadingProgress"("bookId");

-- CreateIndex
CREATE INDEX "Book_type_idx" ON "Book"("type");

-- CreateIndex
CREATE INDEX "Book_format_idx" ON "Book"("format");

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
