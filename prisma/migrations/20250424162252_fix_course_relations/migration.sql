/*
  Warnings:

  - You are about to drop the column `courseId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `userProfileImage` on the `Course` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Course_courseId_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "courseId",
DROP COLUMN "userName",
DROP COLUMN "userProfileImage";

-- CreateIndex
CREATE INDEX "Course_createdBy_idx" ON "Course"("createdBy");

-- CreateIndex
CREATE INDEX "Course_category_idx" ON "Course"("category");

-- CreateIndex
CREATE INDEX "Course_level_idx" ON "Course"("level");
