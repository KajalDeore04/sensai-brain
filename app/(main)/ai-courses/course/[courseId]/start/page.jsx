"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import YouTube from "react-youtube";
import ReactMarkdown from 'react-markdown';
import { motion } from "framer-motion";
import { 
  Clock, 
  BookOpen, 
  ArrowLeft,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const opts = {
  height: "480",
  width: "100%",
  playerVars: {
    autoplay: 0,
  },
};

const ChapterListCard = ({ chapter, index, isActive, onClick }) => {
  // Extract the chapter name properly - either use the full name or format it correctly
  const chapterName = chapter?.content?.chapter || `Chapter ${chapter.chapterId}`;
  
  return (
    <motion.div
      whileHover={{ x: 5 }}
      onClick={onClick}
      className={`cursor-pointer p-4 border-b border-gray-800 transition-all duration-200 ${
        isActive ? "bg-gray-900 border-l-4 border-l-blue-500" : "hover:bg-gray-900"
      }`}
    >
      <div className="flex items-center gap-4">
        <div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-center ${
            isActive ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-400"
          }`}>
            {chapter.chapterId}
          </div>
        </div>
        <div className="flex-1">
          <h2 className={`font-medium ${isActive ? "text-white" : "text-gray-300"}`}>
            {chapterName}
          </h2>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            {/* <Clock className="h-4 w-4" />
            {courseData.courseOutput?.chapters?.duration || "Not specified"} */}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ChapterContent = ({ chapter, content }) => {
  // Extract the chapter name properly for display
  const chapterName = content?.chapter || `Chapter ${chapter.chapterId}`;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-10 w-full"
    >
      <h2 className="font-medium text-2xl text-white mb-2">
        {chapterName}
      </h2>
      <p className="text-gray-400 mb-8">{content?.about || chapter?.content?.description || ""}</p>

      {chapter?.videoId && (
        <div className="flex justify-center my-8 rounded-xl overflow-hidden bg-black shadow-lg">
          <div className="w-full">
            <YouTube videoId={chapter?.videoId} opts={opts} />
          </div>
        </div>
      )}

      <div className="space-y-6 w-full">
        {content?.topics?.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-blue-800 transition-colors duration-300"
          >
            <h2 className="font-medium text-xl text-white mb-4">{item.title}</h2>
            <div className="text-gray-300 prose prose-invert max-w-none">
              <ReactMarkdown>{String(item?.explanation)}</ReactMarkdown>
            </div>

            {item?.code_example && (
              <div className="p-5 bg-black border border-gray-800 rounded-lg mt-4 overflow-x-auto hover:border-blue-900 transition-colors">
                <pre className="text-gray-300">
                  <code>{item?.code_example.replace(/<\/?precode>/g, '')}</code>
                </pre>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const CourseStart = () => {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterContent, setChapterContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (params?.courseId) {
      getCourse();
    }
  }, [params]);

  const getCourse = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${params.courseId}`);
      if (!response.ok) {
        throw new Error("Course fetch failed");
      }
      
      const courseData = await response.json();
      
      // Transform the chapters data if needed
      if (courseData.chapters) {
        // Format chapters correctly - ensure each chapter has proper structure
        courseData.formattedChapters = courseData.chapters.map((chapter, index) => {
          // Make sure each chapter has content
          if (!chapter.content) {
            chapter.content = {};
          }
          
          // Set proper chapterId if missing
          if (!chapter.chapterId) {
            chapter.chapterId = index + 1;
          }
          
          // Format chapter name if needed
          if (!chapter.content.chapterName) {
            // Try to use chapter title from the content if available
            const chapterTitle = chapter.content.title || chapter.title || 
                                courseData.courseOutput?.chapters?.[index]?.title || 
                                `Chapter ${chapter.chapterId}`;
            
            chapter.content.chapterName = `Chapter ${chapter.chapterId}: ${chapterTitle}`;
          }
          
          // Ensure duration is set
          if (!chapter.content.duration) {
            chapter.content.duration = courseData.courseOutput?.chapters?.duration || "Not specified";
          }
          
          // Make sure description/about is set
          if (!chapter.content.about && chapter.content.description) {
            chapter.content.about = chapter.content.description;
          }
          
          return chapter;
        });
        
        // Use the formatted chapters
        courseData.chapters = courseData.formattedChapters || courseData.chapters;
        delete courseData.formattedChapters;
      }
      
      setCourse(courseData);
      
      if (courseData.chapters?.length > 0) {
        const firstChapter = courseData.chapters[0];
        setSelectedChapter(firstChapter);
        setChapterContent(firstChapter.content);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setChapterContent(chapter.content);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-white text-xl"
        >
          Loading course...
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black border-b border-gray-800 sticky top-0 z-50 h-16 flex items-center px-4"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="ghost" 
              className="text-gray-400 hover:text-white hover:bg-blue-900/30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          <h1 className="font-medium text-lg text-white hidden md:block">
            {course?.courseOutput?.courseName || course?.name || course?.level || "Course"}
          </h1>
          
          <Button
            variant="ghost"
            className="md:hidden text-gray-400 hover:text-white hover:bg-blue-900/30"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </motion.div>

      <div className="flex relative">
        {/* Sidebar for chapter navigation - Desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            width: sidebarCollapsed ? "0px" : "256px" 
          }}
          transition={{ duration: 0.3 }}
          className={`${sidebarCollapsed ? 'w-0' : 'w-64'} hidden md:block h-[calc(100vh-4rem)] border-r border-gray-800 overflow-hidden fixed z-40 bg-black transition-all duration-300`}
        >
          <div className="bg-gray-900 sticky top-0 z-10 p-4 border-b border-gray-800 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
            <h2 className="font-medium">Chapters</h2>
          </div>

          <div className={`${sidebarCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            {course?.chapters?.map((chapter, index) => (
              <ChapterListCard
                key={chapter.id || index}
                chapter={chapter}
                index={index}
                isActive={selectedChapter?.id === chapter.id}
                onClick={() => handleChapterSelect(chapter)}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-1/2 -right-3 rounded-full bg-gray-900 border-gray-700 text-gray-300 hover:bg-blue-900/50 hover:text-white transition-all duration-300 z-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Toggle button for collapsed state */}
        {sidebarCollapsed && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarCollapsed(false)}
            className="hidden md:flex fixed left-0 top-1/2 transform -translate-y-1/2 z-50 rounded-full bg-gray-900 border-gray-700 text-gray-300 hover:bg-blue-900/50 hover:text-white transition-all duration-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-black border-r border-gray-800 md:hidden overflow-y-auto"
          >
            <div className="bg-gray-900 p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-blue-400" />
                <h2 className="font-medium">Chapters</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {course?.chapters?.map((chapter, index) => (
              <ChapterListCard
                key={chapter.id || index}
                chapter={chapter}
                index={index}
                isActive={selectedChapter?.id === chapter.id}
                onClick={() => {
                  handleChapterSelect(chapter);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className={`transition-all duration-300 min-h-[calc(100vh-4rem)] w-full ${sidebarCollapsed ? 'md:ml-0' : 'md:ml-64'}`}>
          {selectedChapter && chapterContent ? (
            <ChapterContent chapter={selectedChapter} content={chapterContent} />
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
              <div className="text-center">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Clock className="h-10 w-10 mx-auto text-blue-500 mb-4" />
                </motion.div>
                <h2 className="text-xl text-gray-400">Loading chapter content...</h2>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseStart;