import { z } from "zod";

export const onboardingSchema = z.object({
  industry: z.string({
    required_error: "Please select an industry",
  }),
  subIndustry: z.string({
    required_error: "Please select a specialization",
  }),
  bio: z.string().max(500).optional(),
  experience: z.union([
    z.number()
      .min(0, "Experience must be at least 0 years")
      .max(50, "Experience cannot exceed 50 years"),
    z.string()
      .transform(val => parseInt(val, 10))
      .pipe(z.number().min(0).max(50))
  ]),
  skills: z.string()
  .min(1, "At least one skill is required")
  .transform(val => 
    val.split(",")
      .map(skill => skill.trim())
      .filter(Boolean)
  )
  .refine(val => val.length > 0, "Must include at least one valid skill")

});

export const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
})

export const entrySchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    organization: z.string().min(1, "Organization is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    current: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (!data.current && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "End date is required unless this is your current position",
      path: ["endDate"],
    }
  );

export const resumeSchema = z.object({
  contactInfo: contactSchema,
  summary: z.string().min(1, "Professional summary is required"),
  skills: z.string().min(1, "Skills are required"),
  experience: z.array(entrySchema),
  education: z.array(entrySchema),
  projects: z.array(entrySchema),
});

export const coverLetterSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
});

// Add these new schemas for course features
export const courseSchema = z.object({
  
  name: z.string().min(3, "Course name must be at least 3 characters"),
  category: z.string().min(1, "Category is required"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  includeVideo: z.boolean().default(false),
  duration: z.number().min(1).max(50),
  chapters: z.array(
    z.object({
      chapterId: z.number(),
      title: z.string().min(1, "Chapter title required"),
      content: z.string().min(10, "Content too short")
    })
  )
});

export const chapterSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  videoId: z.string().optional()
});

export const courseEnrollmentSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  progress: z.number().min(0).max(100).default(0)
});

// Update existing user schema if needed
export const userSchema = onboardingSchema.extend({
  coursesCreated: z.array(courseSchema).optional(),
  enrolledCourses: z.array(courseEnrollmentSchema).optional()
});

export const apiCourseSchema = z.object({
  courseData: z.object({
    name: z.string().min(3),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    category: z.string(),
    includeVideo: z.boolean(),
    courseOutput: z.any(),
    chapters: z.array(z.any())
  }),
  userId: z.string().min(1) // Clerk user ID format
});


