"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  try {
    // First generate ATS score and feedback
    const { atsScore, feedback } = await generateATSFeedback(content, user.industry);

    // Then save the resume with this information
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
        atsScore,
        feedback,
      },
      create: {
        userId: user.id,
        content,
        atsScore,
        feedback,
      },
    });

    revalidatePath("/resume");
    return { resume, atsScore, feedback };
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

async function generateATSFeedback(resumeContent, industry) {
  const prompt = `
    Analyze this resume for Applicant Tracking System (ATS) compatibility and provide:
    1. A score from 0-100 based on ATS optimization
    2.  feedback on improvements needed in bullet points
    3. Industry-specific suggestions for a ${industry} professional

    Resume Content:
    ${resumeContent}

    Provide your response in JSON format with these keys:
    {
      "score": "number between 0-100",
      "feedback": "string with  feedback in bullet points",
      "improvementTips": "array of strings with specific suggestions"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
    
    const { score, feedback, improvementTips } = JSON.parse(jsonString);
    
    return {
      atsScore: score,
      feedback: `${feedback}\n\nKey Improvement Tips:\n${improvementTips.join('\n- ')}`
    };
  } catch (error) {
    console.error("Error generating ATS feedback:", error);
    // Return default values if AI fails
    return {
      atsScore: 60,
      feedback: "Could not generate feedback. Please check your resume formatting and content."
    };
  }
}

// app/actions/resume.js
export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const resume = await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!resume) return null;

  return {
    content: resume.content,
    atsScore: resume.atsScore,
    feedback: resume.feedback,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
    Make it more impactful, quantifiable, and aligned with industry standards.
    Current content: "${current}"

    Requirements:
    1. Use action verbs
    2. Include metrics and results where possible
    3. Highlight relevant technical skills
    4. Keep it concise but detailed
    5. Focus on achievements over responsibilities
    6. Use industry-specific keywords
    
    Format the response as a single paragraph without any additional text or explanations.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedContent = response.text().trim();
    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}