import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { courseId, chapters } = await request.json();
    
    // First, check if the course already has chapters
    const existingCourse = await db.course.findUnique({
      where: { id: courseId },
      include: { chapters: true }
    });
    
    if (existingCourse?.chapters.length > 0) {
      // Course already has chapters, update the existing ones
      // and only add new ones if needed
      
      const updatedCourse = await db.course.update({
        where: { id: courseId },
        data: {
          // Update to published state
          publish: true
        },
        include: { chapters: true }
      });
      
      // Update existing chapters and add new ones if necessary
      for (let i = 0; i < chapters.length; i++) {
        const chapterIndex = i + 1;
        const existingChapter = existingCourse.chapters.find(
          ch => ch.chapterId === chapterIndex
        );
        
        if (existingChapter) {
          // Update existing chapter
          await db.chapter.update({
            where: { id: existingChapter.id },
            data: {
              content: chapters[i].content,
              videoId: chapters[i].videoId
            }
          });
        } else {
          // Create new chapter only if it doesn't exist
          await db.chapter.create({
            data: {
              courseId: courseId,
              chapterId: chapterIndex,
              content: chapters[i].content,
              videoId: chapters[i].videoId
            }
          });
        }
      }
      
      // Fetch the updated course with all chapters
      const finalCourse = await db.course.findUnique({
        where: { id: courseId },
        include: { chapters: true }
      });
      
      return NextResponse.json(finalCourse);
    } else {
      // No existing chapters, create all new ones
      const updatedCourse = await db.course.update({
        where: { id: courseId },
        data: {
          chapters: {
            create: chapters.map((chapter, index) => ({
              chapterId: index + 1,
              content: chapter.content,
              videoId: chapter.videoId
            }))
          },
          publish: true
        },
        include: { chapters: true }
      });
      
      return NextResponse.json(updatedCourse);
    }
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Generation failed" },
      { status: 500 }
    );
  }
}