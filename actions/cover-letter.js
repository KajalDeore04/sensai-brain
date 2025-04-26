"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      resume: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Parse resume content to extract structured data
  const resumeData = parseResumeContent(user.resume?.content || '');

  const prompt = `
    Write a highly personalized cover letter for a ${data.jobTitle} position at ${data.companyName}.
    
    Candidate Information:
    - Name: ${user.fullName}
    - Industry: ${user.industry}
    - Experience: ${user.experience} years
    - Skills: ${resumeData.skills || user.skills?.join(", ")}
    - Summary: ${resumeData.summary || user.bio}
    ${resumeData.experience ? `- Recent Experience: ${resumeData.experience.join('\n- ')}` : ''}
    ${resumeData.education ? `- Education: ${resumeData.education.join('\n- ')}` : ''}
    
    Job Requirements:
    ${data.jobDescription}
    
    Requirements:
    1. Use professional but conversational tone
    2. Highlight 3-5 most relevant skills from the resume
    3. Reference specific achievements from work experience
    4. Show how candidate's background solves company's needs
    5. Keep it concise (300-400 words)
    6. Use proper business letter format in markdown
    7. Include a strong opening and call to action
    
    Format the response in markdown with these sections:
    # [Your Name]  
    [Contact Information]  
    [Date]  
    
    [Hiring Manager's Name]  
    [Company Name]  
    [Company Address]  
    
    Dear [Hiring Manager's Name],
    
    [Opening paragraph - position and excitement]
    
    [Body paragraph 1 - relevant skills and experience]
    
    [Body paragraph 2 - specific achievements]
    
    [Closing paragraph - call to action]
    
    Sincerely,  
    [Your Name]
  `;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        jobDescription: data.jobDescription,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

// Helper function to parse resume content
function parseResumeContent(content) {
  if (!content) return {};
  
  const result = {
    skills: [],
    experience: [],
    education: [],
    summary: ''
  };

  // Extract summary
  const summaryMatch = content.match(/## Professional Summary\s+([\s\S]+?)(?=##|$)/i);
  if (summaryMatch) result.summary = summaryMatch[1].trim();

  // Extract skills
  const skillsMatch = content.match(/## Skills\s+([\s\S]+?)(?=##|$)/i);
  if (skillsMatch) {
    result.skills = skillsMatch[1].split('\n')
      .map(skill => skill.replace(/^\s*-\s*/, '').trim())
      .filter(skill => skill.length > 0);
  }

  // Extract experience
  const expMatch = content.match(/## Work Experience\s+([\s\S]+?)(?=##|$)/i);
  if (expMatch) {
    const entries = expMatch[1].match(/### (.+?) @ (.+?)\s+\*\*(.+?)\s+-\s+(.+?)\*\*\s+([\s\S]+?)(?=\n###|$)/g);
    if (entries) {
      result.experience = entries.map(entry => {
        const match = entry.match(/### (.+?) @ (.+?)\s+\*\*(.+?)\s+-\s+(.+?)\*\*\s+([\s\S]+)/);
        return `${match[1]} at ${match[2]} (${match[3]} - ${match[4]}): ${match[5].trim().split('\n')[0]}`;
      });
    }
  }

  // Extract education
  const eduMatch = content.match(/## Education\s+([\s\S]+?)(?=##|$)/i);
  if (eduMatch) {
    const entries = eduMatch[1].match(/### (.+?) @ (.+?)\s+\*\*(.+?)\s+-\s+(.+?)\*\*\s+([\s\S]+?)(?=\n###|$)/g);
    if (entries) {
      result.education = entries.map(entry => {
        const match = entry.match(/### (.+?) @ (.+?)\s+\*\*(.+?)\s+-\s+(.+?)\*\*\s+([\s\S]+)/);
        return `${match[1]} at ${match[2]} (${match[3]} - ${match[4]})`;
      });
    }
  }

  return result;
}

export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}