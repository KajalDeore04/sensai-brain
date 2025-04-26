import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    // Properly access params through destructuring
    const { courseId } = params;
    
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { chapterId: "asc" }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Course fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { courseId } = params;
    const data = await request.json();
    
    // Extract chapters from courseOutput if they exist, otherwise use an empty array
    const chapters = data.courseOutput?.chapters || [];
    
    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        courseOutput: data.courseOutput,
        // Only update chapters if they exist in the request
        ...(chapters.length > 0 && {
          chapters: {
            deleteMany: {},
            create: chapters.map((chapter, index) => ({
              chapterId: index + 1,
              content: chapter
            }))
          }
        })
      },
      include: {
        chapters: true
      }
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Update failed", details: error.message },
      { status: 500 }
    );
  }
}