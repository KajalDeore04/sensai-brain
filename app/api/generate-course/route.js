import { GenerateCourseLayout_AI } from '@/configs/AiModel';
import { NextResponse } from 'next/server';
import { checkUser } from "@/lib/checkUser";

export async function POST(request) {
    const user = await checkUser();
  if (!user) throw new Error("Unauthorized");
  const { prompt } = await request.json();
  
  try {
    const result = await GenerateCourseLayout_AI.sendMessage(prompt);
    const courseLayout = JSON.parse(result.response?.text());
    return NextResponse.json(courseLayout);
  } catch (error) {
    return NextResponse.json(
      { error: "Course generation failed" },
      { status: 500 }
    );
  }
}