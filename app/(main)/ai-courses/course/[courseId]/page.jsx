"use client";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft,
  BookOpen, 
  Play,
  Copy,
  Check
} from "lucide-react";

const CourseLayout = () => {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params?.courseId && user) {
      getCourse();
    }
  }, [params, user]);

  const getCourse = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${params.courseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch course");
      }
      
      const courseData = await response.json();
      
      // Format chapters if they exist to ensure consistent display
      if (courseData.chapters) {
        courseData.chapters = courseData.chapters.map((chapter, index) => {
          // Ensure chapter has content object
          if (!chapter.content) {
            chapter.content = {};
          }
          
          // Set proper chapterId if missing
          if (!chapter.chapterId) {
            chapter.chapterId = index + 1;
          }
          
          // Format chapter name if needed
          if (!chapter.content.chapter) {
            // Try to use chapter title from the content if available
            const chapterTitle = chapter.content.title || chapter.title || 
                               courseData.courseOutput?.chapters?.[index]?.title || 
                               `Chapter ${chapter.chapterId}`;
            
            chapter.content.chapter = `Chapter ${chapter.chapterId}: ${chapterTitle}`;
          }
          
          // Ensure duration is set
          if (!chapter.content.duration) {
            chapter.content.duration = chapter.duration || "Not specified";
          }
          
          // Make sure description/about is set
          if (!chapter.content.about && chapter.content.description) {
            chapter.content.about = chapter.content.description;
          }
          
          return chapter;
        });
      }
      
      setCourse(courseData);
    } catch (error) {
      console.error("Course fetch error:", error.message);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/ai-courses/course/${course?.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-white text-xl"
        >
          Loading course...
        </motion.div>
      </div>
    );
  }

  const courseUrl = `${process.env.NEXT_PUBLIC_HOST_NAME}ai-courses/course/${course?.id}`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-gray-800 sticky top-0 z-50 bg-black/90 backdrop-blur-sm"
      >
        <div className="container mx-auto px-8 h-16 flex items-center justify-between">
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="ghost" 
            className="text-gray-400 hover:text-white hover:bg-gray-900 transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-12">
        {/* Course Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <motion.span 
            className="inline-block text-xs uppercase tracking-widest text-green-400 mb-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            {course.category}
          </motion.span>
          
          <h1 className="text-4xl sm:text-5xl font-bold gradient-title mb-8">
            {course.name || course.level}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800 mb-8"
          >
            <div className="flex-grow text-gray-300 truncate overflow-auto w-full sm:w-auto">
              {courseUrl}
            </div>
            
            <Button
              onClick={handleCopy}
              variant="outline" 
              className="border-gray-700 text-gray-300 hover:text-white hover:border-white transition-all duration-300 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.03 }}
            className="mb-12"
          >
            <Link href={`/ai-courses/course/${course.id}/start`}>
              <Button className="bg-green-600 text-black hover:bg-gray-200 hover:shadow-lg px-8 py-6 text-lg font-medium transition-all duration-300 group">
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, repeatDelay: 2, duration: 1 }}
                >
                  <Play className="mr-2 h-5 w-5 group-hover:text-purple-600 transition-colors duration-300" />
                </motion.div>
                Start Course
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Course Chapters */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8 flex items-center">
            <BookOpen className="mr-3 h-5 w-5 text-blue-400" />
            Course Curriculum
          </h2>
          
          <div className="space-y-3">
            {course.chapters.map((chapter, index) => {
              // Extract clean chapter name without the numbering prefix
              let displayName = chapter.content?.chapter || '';
              // Remove "Chapter X:" prefix if present
              displayName = displayName.replace(/^Chapter \d+:\s*/i, '');
              
              return (
                <Link key={chapter.id || index} href={`/ai-courses/course/${course.id}/start`}>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    whileHover={{ x: 5, backgroundColor: "#111111" }}
                    className="group cursor-pointer"
                  >
                    <div className="border border-gray-800 hover:border-white rounded-lg p-4 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border border-gray-800 group-hover:border-pink-500 flex items-center justify-center text-lg font-medium text-gray-500 group-hover:text-white transition-all duration-200">
                          {chapter.chapterId || index + 1}
                        </div>
                        
                        <div className="flex-grow">
                          <h3 className="text-lg font-medium group-hover:text-blue-300 transition-colors duration-300">
                            {displayName || `Chapter ${chapter.chapterId || index + 1}`}
                          </h3>
                          <p className="text-gray-500 mt-1 line-clamp-2">
                            {chapter.content?.about || chapter.content?.description || ''}
                          </p>
                        </div>
                        
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="w-8 h-8 rounded-full bg-gray-800 group-hover:bg-white flex items-center justify-center"
                        >
                          <Play className="w-4 h-4 text-gray-400 group-hover:text-black transition-all duration-200" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Mobile Floating Button */}
        <motion.div 
          className="fixed bottom-6 right-6 md:hidden z-40"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link href={`/ai-courses/course/${course.id}/start`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-full bg-white text-black shadow-lg flex items-center justify-center"
            >
              <Play className="h-6 w-6" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseLayout;