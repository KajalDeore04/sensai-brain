"use client";
import { db } from "@/lib/prisma";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { GenerateChapterContent_AI } from "@/configs/AiModel";
import service from "@/configs/service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Trash2,
  Plus,
  MoveUp,
  MoveDown,
  Save,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Sparkles,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom notification component instead of using toast
const Notification = ({ show, type, title, message, onClose }) => {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 max-w-md"
    >
      <Alert 
        className={`
          shadow-md border-l-4 pr-12 
          ${type === 'success' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' : ''}
          ${type === 'error' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' : ''}
        `}
      >
        <div className="flex gap-3">
          {type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          <div>
            <AlertTitle className={`
              ${type === 'success' ? 'text-green-800 dark:text-green-300' : ''}
              ${type === 'error' ? 'text-red-800 dark:text-red-300' : ''}
            `}>
              {title}
            </AlertTitle>
            <AlertDescription className="text-sm text-gray-600 dark:text-gray-300">
              {message}
            </AlertDescription>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <XCircle size={16} />
        </button>
      </Alert>
    </motion.div>
  );
};

const LoadingOverlay = ({ loading }) => {
  if (!loading) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Generating Content</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI is creating detailed materials for your course chapters
              </p>
            </div>
          </div>
          
          {/* <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Creating chapter content</span>
                <span className="text-primary font-medium">In progress...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "100%"] }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </div> */}
        </div>
      </motion.div>
    </div>
  );
};

const ChapterEditor = () => {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [tempChapters, setTempChapters] = useState([]);
  const [showUnsavedChanges, setShowUnsavedChanges] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (params?.courseId && user) fetchCourse();
  }, [params, user]);

  useEffect(() => {
    if (course?.courseOutput?.chapters) {
      setTempChapters([...course.courseOutput.chapters]);
    }
  }, [course]);

  const showNotification = (type, title, message) => {
    setNotification({
      show: true,
      type,
      title,
      message
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${params.courseId}`);
      if (!response.ok) throw new Error("Failed to fetch course");
      const courseData = await response.json();
      setCourse(courseData);
      setTempChapters(courseData.courseOutput?.chapters || []);
    } catch (error) {
      console.error("Error fetching course:", error);
      showNotification('error', 'Loading Failed', 'Could not load course data');
    }
  };

  const updateChapter = (index, field, value) => {
    const updatedChapters = [...tempChapters];
    updatedChapters[index] = { ...updatedChapters[index], [field]: value };
    setTempChapters(updatedChapters);
    setShowUnsavedChanges(true);
  };

  const moveChapter = (index, direction) => {
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === tempChapters.length - 1)
    ) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updatedChapters = [...tempChapters];
    const temp = updatedChapters[index];
    updatedChapters[index] = updatedChapters[newIndex];
    updatedChapters[newIndex] = temp;
    
    setTempChapters(updatedChapters);
    setExpandedChapter(newIndex);
    setShowUnsavedChanges(true);
  };

  const deleteChapter = (index) => {
    const updatedChapters = tempChapters.filter((_, i) => i !== index);
    setTempChapters(updatedChapters);
    setExpandedChapter(null);
    setShowUnsavedChanges(true);
  };

  const addNewChapter = () => {
    const newChapter = {
      chapterName: `Chapter ${tempChapters.length + 1}: New Chapter`,
      about: "Enter chapter description here...",
      duration: "30 minutes"
    };
    
    setTempChapters([...tempChapters, newChapter]);
    setExpandedChapter(tempChapters.length);
    setShowUnsavedChanges(true);
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${params.courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseOutput: {
            ...course.courseOutput,
            chapters: tempChapters,
            noOfChapters: tempChapters.length
          }
        })
      });
      
      if (!response.ok) throw new Error("Save failed");
      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      setShowUnsavedChanges(false);
      showNotification('success', 'Changes Saved', 'Course updated successfully');
    } catch (error) {
      console.error("Error saving changes:", error);
      showNotification('error', 'Save Failed', 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };
 // Generate Content Handler
 const generateContent = async () => {
  try {
    setLoading(true);
    setShowGenerateDialog(false);

    // First save any pending changes
    if (showUnsavedChanges) await saveChanges();

    // Generate content for each chapter
    const updatedChapters = await Promise.all(
      tempChapters.map(async (chapter, index) => {
        const videoResponse = await service.getVideos(
          `${course.courseOutput.courseName}: ${chapter.chapterName}`
        );
        
        const aiResponse = await GenerateChapterContent_AI.sendMessage(
          `Explain ${chapter.chapterName} for ${course.courseOutput.courseName} in JSON format`
        );

        return {
          ...chapter,
          content: JSON.parse(aiResponse?.response?.text()),
          videoId: videoResponse?.[0]?.id?.videoId || ""
        };
      })
    );

    // ➕➕➕ Add the API call here ➕➕➕
    const response = await fetch("/api/courses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: params.courseId,
        chapters: updatedChapters
      })
    });

    if (!response.ok) throw new Error("Generation failed");
    
    // Get the updated course data from response
    const updatedCourse = await response.json();

    // Redirect to course page
    router.push(`/ai-courses/course/${updatedCourse.id}`);
    
  } catch (error) {
    console.error("Generation failed:", error);
    showNotification('error', 'Generation Failed', 'Failed to generate course content');
  } finally {
    setLoading(false);
  }
};

  const toggleChapter = (index) => {
    setExpandedChapter(expandedChapter === index ? null : index);
  };

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="  min-h-screen pb-20">
      <LoadingOverlay loading={loading} />
      
      <Notification 
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
      
      {/* Header */}
      <div className=" border-b shadow-sm sticky py-5 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-6xl font-bold gradient-title">
                Chapter Editor
              </h1>
              {course?.courseOutput?.courseName && (
                <span className="ml-2 text-lg text-gray-500 dark:text-gray-400">
                  — {course.courseOutput.courseName}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {showUnsavedChanges && (
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-xs text-amber-600 dark:text-amber-400 flex items-center"
                >
                  <AlertCircle size={14} className="mr-1" />
                  Unsaved changes
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white dark:bg-gray-950 rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Course Chapters</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Organize, edit, and arrange your course chapters
              </p>
            </div>
          </div>
          
          {/* Chapter List */}
          <div className="space-y-4">
            <AnimatePresence>
              {tempChapters.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg"
                >
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-medium text-lg">No Chapters Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Get started by adding your first chapter
                  </p>
                  <Button onClick={addNewChapter} size="sm">
                    <Plus size={16} className="mr-1.5" />
                    Add Chapter
                  </Button>
                </motion.div>
              ) : (
                tempChapters.map((chapter, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative border rounded-lg bg-white dark:bg-gray-950 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Chapter Header */}
                    <div 
                      className={`flex items-center p-4 cursor-pointer ${
                        expandedChapter === index 
                          ? "bg-primary/5 border-b" 
                          : ""
                      }`}
                      onClick={() => toggleChapter(index)}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium mr-4">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                          {chapter.chapterName.replace(/^Chapter \d+:/, "").trim()}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center mr-2">
                          <Clock size={14} className="mr-1" />
                          {chapter.duration || "Not set"}
                        </span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveChapter(index, "up");
                              }}
                              disabled={index === 0}
                              className="cursor-pointer"
                            >
                              <MoveUp size={16} className="mr-2" />
                              <span>Move Up</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveChapter(index, "down");
                              }}
                              disabled={index === tempChapters.length - 1}
                              className="cursor-pointer"
                            >
                              <MoveDown size={16} className="mr-2" />
                              <span>Move Down</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChapter(index);
                              }}
                              className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400"
                            >
                              <Trash2 size={16} className="mr-2" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <button
                          className="h-8 w-8 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleChapter(index);
                          }}
                        >
                          {expandedChapter === index ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Chapter Edit Form */}
                    <AnimatePresence>
                      {expandedChapter === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-5 space-y-4 bg-gray-50 dark:bg-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium mb-1">
                                  Chapter Title
                                </label>
                                <Input
                                  value={chapter.chapterName}
                                  onChange={(e) => updateChapter(index, "chapterName", e.target.value)}
                                  placeholder="Enter chapter title"
                                  className="w-full"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">
                                  Chapter Description
                                </label>
                                <Textarea
                                  value={chapter.about}
                                  onChange={(e) => updateChapter(index, "about", e.target.value)}
                                  placeholder="Enter chapter description"
                                  className="w-full h-28"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Duration
                                </label>
                                <Input
                                  value={chapter.duration}
                                  onChange={(e) => updateChapter(index, "duration", e.target.value)}
                                  placeholder="e.g. 30 minutes"
                                  className="w-full"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Estimated time to complete
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Action Buttons - Centralized in one place */}
        <div className="mt-8 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={addNewChapter}
            className="border-dashed"
            disabled={loading}
          >
            <Plus size={16} className="mr-1.5" />
            Add Chapter
          </Button>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={saveChanges}
              disabled={!showUnsavedChanges || loading}
              variant="secondary"
            >
              <Save size={16} className="mr-1.5" />
              Save Changes
            </Button>
            
            <Button 
              onClick={() => setShowGenerateDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-200"
              disabled={loading || tempChapters.length === 0}
            >
              <Sparkles size={16} className="mr-1.5" />
              Generate Course
            </Button>
          </div>
        </div>
      </div>
      
      {/* Generate Course Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-500" />
              Generate Course Content
            </DialogTitle>
            <DialogDescription>
              This will create detailed content for all chapters using AI.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                What happens next?
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mt-0.5">1</div>
                  <span>Your course structure will be saved</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mt-0.5">2</div>
                  <span>AI will generate detailed content for each chapter</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 mt-0.5">3</div>
                  <span>You'll be redirected to course completion page</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateContent}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white px-6 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Sparkles size={16} className="mr-1.5" />
              Generate Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChapterEditor;