// app/api/courses/[courseId]/chapters/[chapterId]/route.js
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const chapter = await db.chapter.findFirst({
      where: {
        id: params.chapterId,
        courseId: params.courseId
      },
      // include: {
      //   content: true // Make sure to include related content
      // }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chapter);
  } catch (error) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}