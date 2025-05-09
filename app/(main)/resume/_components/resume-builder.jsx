"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertTriangle,
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { getResume } from "@/actions/resume";

export default function ResumeBuilder({ initialContent }) {
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(initialContent);
  const { user } = useUser();
  const [resumeMode, setResumeMode] = useState("preview");
  // Add this state to your component
const [feedback, setFeedback] = useState(null);
const [atsScore, setAtsScore] = useState(null);
const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
const [isLoading, setIsLoading] = useState(true); // Add loading state


// Add this to fetch resume data
const {
  data: resumeData,
  loading: isResumeLoading,
  error: resumeError,
  fn: fetchResumeFn,
} = useFetch(getResume);

 // Fetch resume data when component mounts
 useEffect(() => {
  const fetchData = async () => {
    try {
      const data = await fetchResumeFn();
      if (data?.content) {
        setPreviewContent(data.content);
        // Parse the markdown content to populate form fields
        parseMarkdownToForm(data.content);
      }
    } catch (error) {
      console.error("Error fetching resume:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);
  // Function to parse markdown and populate form fields
  const parseMarkdownToForm = (markdown) => {
    // This is a simplified parser - you may need to adjust based on your exact markdown structure
    const contactMatch = markdown.match(/## <div align="center">(.+?)<\/div>\s+<div align="center">(.+?)<\/div>/s);
    const summaryMatch = markdown.match(/## Professional Summary\s+(.+?)(?=##|$)/s);
    const skillsMatch = markdown.match(/## Skills\s+(.+?)(?=##|$)/s);
    
    // Extract contact info
    const contactInfo = {};
    if (contactMatch && contactMatch[2]) {
      const contactText = contactMatch[2];
      const emailMatch = contactText.match(/📧 (.+?)(?=\||$)/);
      const mobileMatch = contactText.match(/📱 (.+?)(?=\||$)/);
      const linkedinMatch = contactText.match(/💼 \[LinkedIn\]\((.+?)\)/);
      const twitterMatch = contactText.match(/🐦 \[Twitter\]\((.+?)\)/);
      
      if (emailMatch) contactInfo.email = emailMatch[1];
      if (mobileMatch) contactInfo.mobile = mobileMatch[1];
      if (linkedinMatch) contactInfo.linkedin = linkedinMatch[1];
      if (twitterMatch) contactInfo.twitter = twitterMatch[1];
    }

    // Initialize form with parsed data
    reset({
      contactInfo,
      summary: summaryMatch ? summaryMatch[1].trim() : "",
      skills: skillsMatch ? skillsMatch[1].trim() : "",
      // Note: For experience, education, projects you'll need more complex parsing
      // or consider storing these in a more structured format in your database
      experience: [],
      education: [],
      projects: [],
    });
  };

  

   // Add reset to your useForm hook
   const {
    control,
    register,
    handleSubmit,
    watch,
    reset, // Add reset
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
      contactInfo: {},
      summary: "",
      skills: "",
      experience: [],
      education: [],
      projects: [],
    },
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  // Watch form fields for preview updates
  const formValues = watch();

  useEffect(() => {
    if (initialContent) setActiveTab("preview");
  }, [initialContent]);

  // Update preview content when form values change
  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent ? newContent : initialContent);
    }
  }, [formValues, activeTab]);

  // Handle save result
  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  

  const getContactMarkdown = () => {
    const { contactInfo } = formValues;
    const parts = [];
    if (contactInfo.email) parts.push(`${contactInfo.email}`);
    if (contactInfo.mobile) parts.push(`${contactInfo.mobile}`);
    if (contactInfo.linkedin)
      parts.push(`[LinkedIn](${contactInfo.linkedin})`);
    if (contactInfo.twitter) parts.push(`[Twitter](${contactInfo.twitter})`);

    return parts.length > 0
      ? `## <div align="center">${user.fullName}</div>
        \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
      : "";
  };

  const getCombinedContent = () => {
    const { summary, skills, experience, education, projects } = formValues;
    return [
      getContactMarkdown(),
      summary && `## Professional Summary\n\n${summary}`,
      skills && `## Skills\n\n${skills}`,
      entriesToMarkdown(experience, "Work Experience"),
      entriesToMarkdown(education, "Education"),
      entriesToMarkdown(projects, "Projects"),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      const opt = {
        margin: [15, 15],
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formattedContent = previewContent
        .replace(/\n/g, "\n")
        .replace(/\n\s*\n/g, "\n\n")
        .trim();
  
      const { resume, atsScore, feedback } = await saveResumeFn(formattedContent);
      
      // Show feedback after successful save
      setAtsScore(atsScore);
      setFeedback(feedback);
      setIsFeedbackOpen(true);
    } catch (error) {
      // Error is already shown by useFetch via toast
      console.error("Save error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your resume...</span>
      </div>
    );
  }

  return (

    
    <div data-color-mode="light" className="space-y-4">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-2">
        <h1 className="font-bold gradient-title text-5xl md:text-6xl">
          Resume Builder
        </h1>
        
        <div className="space-x-2">
          <Button
            variant="destructive"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Form</TabsTrigger>
          <TabsTrigger value="preview">Markdown</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    {...register("contactInfo.email")}
                    type="email"
                    placeholder="your@email.com"
                    error={errors.contactInfo?.email}
                  />
                  {errors.contactInfo?.email && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mobile Number</label>
                  <Input
                    {...register("contactInfo.mobile")}
                    type="tel"
                    placeholder="+1 234 567 8900"
                  />
                  {errors.contactInfo?.mobile && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.mobile.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">LinkedIn URL</label>
                  <Input
                    {...register("contactInfo.linkedin")}
                    type="url"
                    placeholder="https://linkedin.com/in/your-profile"
                  />
                  {errors.contactInfo?.linkedin && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.linkedin.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Twitter/X Profile
                  </label>
                  <Input
                    {...register("contactInfo.twitter")}
                    type="url"
                    placeholder="https://twitter.com/your-handle"
                  />
                  {errors.contactInfo?.twitter && (
                    <p className="text-sm text-red-500">
                      {errors.contactInfo.twitter.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Summary</h3>
              <Controller
                name="summary"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="Write a compelling professional summary..."
                    error={errors.summary}
                  />
                )}
              />
              {errors.summary && (
                <p className="text-sm text-red-500">{errors.summary.message}</p>
              )}
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32"
                    placeholder="List your key skills..."
                    error={errors.skills}
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work Experience</h3>
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Experience"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* Education */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Education</h3>
              <Controller
                name="education"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Education"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.education && (
                <p className="text-sm text-red-500">
                  {errors.education.message}
                </p>
              )}
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Projects</h3>
              <Controller
                name="projects"
                control={control}
                render={({ field }) => (
                  <EntryForm
                    type="Project"
                    entries={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.projects && (
                <p className="text-sm text-red-500">
                  {errors.projects.message}
                </p>
              )}
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          {activeTab === "preview" && (
            <Button
              variant="link"
              type="button"
              className="mb-2"
              onClick={() =>
                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
              }
            >
              {resumeMode === "preview" ? (
                <>
                  <Edit className="h-4 w-4" />
                  Edit Resume
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </Button>
          )}

          {activeTab === "preview" && resumeMode !== "preview" && (
            <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                You will lose editied markdown if you update the form data.
              </span>
            </div>
          )}
          <div className="border rounded-lg">
            <MDEditor
              value={previewContent}
              onChange={setPreviewContent}
              height={800}
              preview={resumeMode}
             
            />
          </div>
          <div className="hidden">
            <div id="resume-pdf">
              <MDEditor.Markdown
                source={previewContent}
                style={{
                  background: "white",
                  color: "black",
                }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold gradient-title">Resume Analysis</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6 py-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <h3 className="text-lg font-medium mb-2 md:mb-0">ATS Score</h3>
        <div className="flex items-center w-full md:w-auto">
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e6e6e6"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={atsScore >= 70 ? "#10B981" : atsScore >= 40 ? "#F59E0B" : "#EF4444"}
                strokeWidth="3"
                strokeDasharray={`${atsScore}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              <span className="text-2xl font-bold">{atsScore}</span>
            </div>
          </div>
          <div className="ml-4">
            <p className={`text-sm font-medium ${
              atsScore >= 70 ? "text-green-500" : 
              atsScore >= 40 ? "text-amber-500" : 
              "text-red-500"
            }`}>
              {atsScore >= 70 ? "Excellent" : atsScore >= 40 ? "Good" : "Needs Improvement"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {atsScore >= 70 ? "Your resume is well optimized for ATS systems." : 
               atsScore >= 40 ? "Your resume could use some improvements for better ATS compatibility." : 
               "Your resume needs significant improvement to pass ATS screening."}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center">
          <AlertTriangle className={`h-5 w-5 mr-2 ${
            atsScore >= 70 ? "text-green-500" : 
            atsScore >= 40 ? "text-amber-500" : 
            "text-red-500"
          }`} />
          Improvement Suggestions
        </h3>
        <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg border">
          <MDEditor.Markdown source={feedback} />
        </div>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button variant="outline" className="mr-2">
          <Download className="h-4 w-4 mr-2" />
          Save Feedback
        </Button>
        <Button onClick={() => setIsFeedbackOpen(false)}>
          Close
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>

    
  );
}