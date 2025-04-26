// app/api/courses/route.js
import { db } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const courses = await db.course.findMany({
      where: { publish: true },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            imageUrl: true
          }
        },
        chapters: {
          select: {
            id: true,
            chapterId: true
          },
          orderBy: {
            chapterId: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch courses",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { courseData, userId } = await request.json();
    
    console.log('Received course data:', JSON.stringify(courseData, null, 2));
    console.log('User ID:', userId);

    // Verify user exists first
    const userExists = await db.user.findFirst({
      where: { clerkUserId: userId }
    });

    if (!userExists) {
      console.error(`User not found with clerkUserId: ${userId}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const newCourse = await db.course.create({
      data: {
        name: courseData.name,
        level: courseData.level,
        category: courseData.category,
        includeVideo: courseData.includeVideo,
        courseOutput: courseData.courseOutput,
        createdBy: userExists.id,
        chapters: {
          create: courseData.chapters.map((chapter, index) => ({
            chapterId: index + 1,
            content: chapter
          }))
        }
      },
      include: {
        chapters: true,
        user: {
          select: {
            name: true,
            email: true,
            imageUrl: true
          }
        }
      }
    });

    console.log('Created course:', newCourse);
    return NextResponse.json(newCourse);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { 
        error: "Course creation failed",
        details: error.message,
        prismaError: error.code || error.meta 
      },
      { status: 500 }
    );
  }
}