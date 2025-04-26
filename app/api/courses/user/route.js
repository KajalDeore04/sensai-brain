// app/api/courses/user/route.js
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get('userId');
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // First find the user by their clerkUserId
    const user = await db.user.findUnique({
      where: { 
        clerkUserId: clerkUserId
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Then find courses created by this user using their internal id
    const courses = await db.course.findMany({
      where: { 
        createdBy: user.id
      },
      include: {
        chapters: true
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}