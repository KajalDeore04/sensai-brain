"use client";
import React, { useContext, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserInputContext } from "@/app/_context/UserInputContext";
import { GenerateCourseLayout_AI } from "@/configs/AiModel";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";


import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  GraduationCap,
  Clock,
  Video,
  Code,
  LineChart,
  Languages,
  Palette,
  CheckCircle,
  Sparkles,
  Plus,
  Minus,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

const CreateCourse = () => {
  const router = useRouter();
  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [animateIcon, setAnimateIcon] = useState(null);

  const MotionButton = motion(Button);

  // Enhanced category options with vibrant colors and gradients
  const categoryOptions = [
    {
      id: "Programming",
      icon: <Code size={24} />,
      hint: "border-indigo-500",
      textColor: "text-indigo-400",
      bgGradient: "bg-gradient-to-br from-indigo-500/30 to-violet-500/20",
      activeBg: "bg-indigo-950",
    },
    {
      id: "Business",
      icon: <LineChart size={24} />,
      hint: "border-emerald-500",
      textColor: "text-emerald-400",
      bgGradient: "bg-gradient-to-br from-emerald-500/30 to-teal-500/20",
      activeBg: "bg-emerald-950",
    },
    {
      id: "Language",
      icon: <Languages size={24} />,
      hint: "border-amber-500",
      textColor: "text-amber-400",
      bgGradient: "bg-gradient-to-br from-amber-500/30 to-yellow-500/20",
      activeBg: "bg-amber-950",
    },
    {
      id: "Art",
      icon: <Palette size={24} />,
      hint: "border-rose-500",
      textColor: "text-rose-400",
      bgGradient: "bg-gradient-to-br from-rose-500/30 to-pink-500/20",
      activeBg: "bg-rose-950",
    },
  ];

  const difficultyLevels = [
    { id: "Beginner", color: "text-yellow-400" },
    { id: "Intermediate", color: "text-orange-400" },
    { id: "Advanced", color: "text-red-400" },
  ];

  // Format duration from slider value
  const formatDuration = (value) => {
    if (value <= 1) return "1 Hour";
    if (value <= 2) return "2 Hours";
    return `${value} Hours`;
  };

  const handleInputChange = (fieldName, value) => {
    setUserCourseInput((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleChapterChange = (increment) => {
    const currentValue = parseInt(userCourseInput?.noOfChapter || 0);
    const newValue = increment
      ? Math.min(currentValue + 1, 20)
      : Math.max(currentValue - 1, 1);

    handleInputChange("noOfChapter", newValue.toString());
  };

  const isFormComplete = () => {
    const requiredFields = [
      "category",
      "topic",
      "level",
      "duration",
      "displayVideo",
      "noOfChapter",
    ];
    return requiredFields.every((field) => !!userCourseInput?.[field]);
  };

  const checkProgress = () => {
    let filledCount = 0;
    const fields = [
      "category",
      "topic",
      "level",
      "duration",
      "displayVideo",
      "noOfChapter",
    ];
    fields.forEach((field) => {
      if (userCourseInput?.[field]) filledCount++;
    });
    return Math.floor((filledCount / fields.length) * 100);
  };

  const handleCategoryClick = (categoryId) => {
    setAnimateIcon(categoryId);
    handleInputChange("category", categoryId);

    // Reset animation after delay
    setTimeout(() => setAnimateIcon(null), 700);
  };

  const GenerateCourseLayout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a Course tutorial on: Category:${userCourseInput?.category}, 
            Topic:${userCourseInput.topic}, Level:${userCourseInput.level}, 
            Duration:${userCourseInput.duration}, Chapters:${userCourseInput.noOfChapter} in JSON format`
        })
      });
  
      if (!response.ok) throw new Error('Generation failed');
      
      const courseLayout = await response.json();
      await SaveCourseLayoutInDb(courseLayout);
    } catch (error) {
      console.error("Error generating course:", error);
      // Add error handling UI here
    } finally {
      setLoading(false);
    }
  };

  const handleOnDelete = async () => {
    try {
      await db.$transaction([
        db.chapter.deleteMany({
          where: { courseId: course.id },
        }),
        db.course.delete({
          where: { id: course.id },
        }),
      ]);
      refreshData();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  const SaveCourseLayoutInDb = async (courseLayout) => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseData: {
            name: userCourseInput?.topic,
            level: userCourseInput?.level,
            category: userCourseInput?.category,
            includeVideo: userCourseInput?.includeVideo,
            courseOutput: courseLayout,
            chapters: courseLayout.chapters || []
          },
          userId: user.id
        })
      });
  
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Unknown error', {
          cause: responseData.details
        });
      }
  
      router.replace(`/ai-courses/create-course/${responseData.id}`);
      
    } catch (error) {
      console.error("Error saving course:", {
        message: error.message,
        details: error.cause
      });
      // Add UI error display
      alert(`Failed to create course: ${error.message}`);
    }
  };

  const getCategoryDetails = (categoryId) => {
    return categoryOptions.find((c) => c.id === categoryId) || {};
  };

  const getDifficultyColor = (levelId) => {
    return (
      difficultyLevels.find((l) => l.id === levelId)?.color || "text-white"
    );
  };

  // Get background based on completion
  const getProgressColor = (progress) => {
    if (progress < 33) return "bg-red-500";
    if (progress < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className=" min-h-screen py-12 ">
      <div className="grid-background"></div>
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-6xl font-bold gradient-title">Design Course</h1>
          <div className="text-sm text-gray-400 flex items-center">
            <span className="mr-2">Completion:</span>
            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getProgressColor(checkProgress())}`}
                initial={{ width: "0%" }}
                animate={{ width: `${checkProgress()}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>
            <span className="ml-2">{checkProgress()}%</span>
          </div>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden rounded-xl backdrop-blur-sm bg-opacity-80">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800">
              <motion.div
                className={`h-1 ${getProgressColor(checkProgress())}`}
                initial={{ width: 0 }}
                animate={{ width: `${checkProgress()}%` }}
                transition={{ duration: 0.5 }}
              ></motion.div>
            </div>

            <div className="p-8 space-y-8 mt-1">
              {/* Section Title */}
              <div className="border-b border-gray-800 pb-2">
                <h2 className="text-lg font-semibold text-white">
                  Course Details
                </h2>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Select Category
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categoryOptions.map((category) => {
                    const isActive = userCourseInput?.category === category.id;
                    return (
                      <motion.div
                        key={category.id}
                        className={`
                          relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden
                          ${
                            isActive
                              ? `${category.hint} shadow-lg`
                              : "border-gray-700 hover:border-gray-500"
                          }
                        `}
                        onClick={() => handleCategoryClick(category.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div
                          className={`
                          p-5 flex justify-center items-center h-24
                          ${
                            isActive
                              ? category.bgGradient
                              : "bg-gray-800 hover:bg-gray-750"
                          }
                        `}
                        >
                          <motion.div
                            className={`${
                              isActive ? category.textColor : "text-white"
                            }`}
                            animate={
                              animateIcon === category.id
                                ? {
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.5 }}
                          >
                            {category.icon}
                          </motion.div>
                        </div>
                        <div
                          className={`p-2 text-center text-white ${
                            isActive ? category.activeBg : "bg-gray-900"
                          }`}
                        >
                          <p className="text-sm font-medium">{category.id}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Topic & Description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Course Topic
                  </label>
                  <Input
                    placeholder="Enter course topic"
                    value={userCourseInput?.topic || ""}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-transparent h-12 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description (optional)
                  </label>
                  <Textarea
                    placeholder="Describe what the course will cover"
                    value={userCourseInput?.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    className="h-24 bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-white focus:border-transparent rounded-lg"
                  />
                </div>
              </motion.div>

              {/* Course Configuration in Grid */}
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {/* Difficulty Level */}
                <div className="bg-gray-850 rounded-lg p-4 border border-gray-800">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Difficulty Level
                  </label>
                  <RadioGroup
                    value={userCourseInput?.level || ""}
                    onValueChange={(value) => handleInputChange("level", value)}
                    className="flex justify-between"
                  >
                    {difficultyLevels.map((level) => {
                      const isActive = userCourseInput?.level === level.id;
                      return (
                        <div
                          key={level.id}
                          className={`
                          flex flex-col items-center p-2 rounded-lg transition-all
                          ${isActive ? "bg-gray-800" : ""}
                        `}
                        >
                          <RadioGroupItem
                            value={level.id}
                            id={`level-${level.id}`}
                            className={`border-gray-500 ${
                              isActive ? level.color : "text-white"
                            }`}
                          />
                          <Label
                            htmlFor={`level-${level.id}`}
                            className={`cursor-pointer text-sm mt-1 ${
                              isActive ? level.color : "text-white"
                            }`}
                          >
                            {level.id}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                {/* Course Duration - Range Slider */}
                <div className="bg-gray-850 rounded-lg p-4 border border-gray-800">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-400">
                      Duration
                    </label>
                    <span className="text-white text-sm font-medium px-2 py-1 bg-gray-800 rounded-full">
                      {formatDuration(userCourseInput?.durationValue || 1)}
                    </span>
                  </div>
                  <div className="px-2">
                    <Slider
                      defaultValue={[1]}
                      min={1}
                      max={5}
                      step={0.5}
                      value={[userCourseInput?.durationValue || 1]}
                      onValueChange={(values) => {
                        const value = values[0];
                        handleInputChange("durationValue", value);
                        handleInputChange("duration", formatDuration(value));
                      }}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1h</span>
                      <span>2h</span>
                      <span>3h</span>
                      <span>4h</span>
                      <span>5h+</span>
                    </div>
                  </div>
                </div>

                {/* Video Content - Toggle Switch */}
                <div className="bg-gray-850 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-400">
                      Video Content
                    </label>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-400">
                        {userCourseInput?.includeVideo ? "Enabled" : "Disabled"}
                      </span>
                      <Switch
                        id="video-toggle"
                        checked={userCourseInput?.includeVideo}
                        onCheckedChange={(checked) => {
                          handleInputChange(
                            "displayVideo",
                            checked ? "Yes" : "No"
                          );
                        }}
                        className="data-[state=checked]:bg-blue-500"
                      />
                      <Label htmlFor="video-toggle" className="text-gray-300">
                        {userCourseInput?.includeVideo ? (
                          <PlayCircle className="h-5 w-5 text-blue-400" />
                        ) : (
                          <PauseCircle className="h-5 w-5 text-gray-500" />
                        )}
                      </Label>
                    </div>
                  </div>

                  {/* Additional text explanation */}
                  <p className="text-xs text-gray-500 mt-3">
                    {userCourseInput?.includeVideo
                      ? "Course will include video content for visual learning"
                      : "Course will focus on text-based content only"}
                  </p>
                </div>

                {/* Number of Chapters - Stepper Input */}
                <div className="bg-gray-850 rounded-lg p-4 border border-gray-800">
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Number of Chapters
                  </label>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleChapterChange(false)}
                      disabled={
                        !userCourseInput?.noOfChapter ||
                        parseInt(userCourseInput.noOfChapter) <= 1
                      }
                      className="h-10 w-10 rounded-xl bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-2 text-center text-white font-medium text-lg w-20">
                      {userCourseInput?.noOfChapter || 1}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleChapterChange(true)}
                      disabled={
                        userCourseInput?.noOfChapter &&
                        parseInt(userCourseInput.noOfChapter) >= 20
                      }
                      className="h-10 w-10 rounded-xl bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Show min/max indicators */}
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Min: 1</span>
                    <span>Max: 20</span>
                  </div>
                </div>
              </motion.div>

              {/* Generate Button */}
              <motion.div
                className="pt-4 flex justify-end border-t border-gray-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <MotionButton
                  onClick={GenerateCourseLayout}
                  disabled={!isFormComplete()}
                  className={`px-8 py-2 gap-3 text-base rounded-xl shadow-lg transition-all duration-300 ${
                    isFormComplete()
                      ? checkProgress() >= 100
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500"
                        : "bg-white text-black hover:bg-gray-200"
                      : "bg-gray-700 text-gray-400"
                  }`}
                  whileHover={
                    isFormComplete()
                      ? {
                          scale: 1.05,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        }
                      : undefined
                  }
                  whileTap={isFormComplete() ? { scale: 0.98 } : undefined}
                >
                  <Sparkles
                    className={`h-5 w-5 ${
                      checkProgress() >= 100 ? "text-white" : ""
                    }`}
                  />
                  <span>Generate Course</span>
                </MotionButton>
              </motion.div>
            </div>
          </Card>
        </motion.div>

        {/* Preview Card - with animations and better styling */}
        {(userCourseInput?.category || userCourseInput?.topic) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <Card className="p-6 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
              <h3 className="text-lg font-medium text-gray-400 mb-4 border-b border-gray-800 pb-2">
                Course Preview
              </h3>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                {userCourseInput?.category && (
                  <motion.div
                    className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center
                      ${getCategoryDetails(userCourseInput.category).bgGradient}
                    `}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <div
                      className={
                        getCategoryDetails(userCourseInput.category).textColor
                      }
                    >
                      {getCategoryDetails(userCourseInput.category).icon}
                    </div>
                  </motion.div>
                )}

                <div className="flex-grow">
                  <motion.div
                    className="mb-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h3 className="text-xl font-bold text-white">
                      {userCourseInput?.topic || "Your course"}
                    </h3>
                    {userCourseInput?.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {userCourseInput.description}
                      </p>
                    )}
                  </motion.div>

                  <div className="flex flex-wrap gap-4 mt-3">
                    {userCourseInput?.level && (
                      <motion.div
                        className={`flex items-center px-3 py-1 rounded-full bg-gray-800 text-xs ${getDifficultyColor(
                          userCourseInput.level
                        )}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <GraduationCap size={14} className="mr-1" />
                        <span>{userCourseInput.level}</span>
                      </motion.div>
                    )}

                    {userCourseInput?.duration && (
                      <motion.div
                        className="flex items-center px-3 py-1 rounded-full bg-gray-800 text-xs text-blue-400"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.75 }}
                      >
                        <Clock size={14} className="mr-1" />
                        <span>{userCourseInput.duration}</span>
                      </motion.div>
                    )}

                    {userCourseInput?.noOfChapter && (
                      <motion.div
                        className="flex items-center px-3 py-1 rounded-full bg-gray-800 text-xs text-amber-400"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <BookOpen size={14} className="mr-1" />
                        <span>{userCourseInput.noOfChapter} chapters</span>
                      </motion.div>
                    )}

                    {userCourseInput?.includeVideo
                      ? "Yes"
                      : "No" && (
                          <motion.div
                            className={`flex items-center px-3 py-1 rounded-full bg-gray-800 text-xs ${
                              userCourseInput.displayVideo === "Yes"
                                ? "text-green-400"
                                : "text-gray-400"
                            }`}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.85 }}
                          >
                            <Video size={14} className="mr-1" />
                            <span>Video: {userCourseInput.displayVideo}</span>
                          </motion.div>
                        )}
                  </div>
                </div>

                {isFormComplete() && (
                  <motion.div
                    className="flex items-center justify-center bg-green-900/20 p-3 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      delay: 0.9,
                    }}
                  >
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </motion.div>
                )}
              </div>

              {/* Preview completion bar */}
              {isFormComplete() && (
                <motion.div
                  className="mt-6 bg-gray-800 h-2 rounded-full overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                  ></motion.div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Loading Dialog with Enhanced Animation */}
      <AlertDialog open={loading}>
        <AlertDialogContent className="max-w-xs bg-gray-900 border border-gray-800 text-white rounded-xl shadow-2xl">
          <VisuallyHidden>
            <AlertDialogTitle>Course Generation Status</AlertDialogTitle>
          </VisuallyHidden>
          <div className="py-8 flex flex-col items-center justify-center gap-5">
            <div className="relative w-20 h-20">
              <motion.div
                className="absolute inset-0 rounded-full border-3 border-t-blue-500 border-r-indigo-500 border-b-purple-500 border-l-violet-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              ></motion.div>
              <motion.div
                className="absolute inset-2 rounded-full border-2 border-t-transparent border-r-white border-b-transparent border-l-white"
                animate={{ rotate: -180 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              ></motion.div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-white mb-1">
                Building Your Course
              </p>
              <p className="text-sm text-gray-400">This may take a moment...</p>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreateCourse;
