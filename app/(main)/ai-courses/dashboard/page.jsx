"use client";
import React, { useContext, useEffect, useState } from "react";
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";
import { useUser } from "@clerk/nextjs";
import { db } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Plus, BookOpen, MoreVertical, Trash2, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



const Dashboard =  () => {
  
  const CourseCollection = () => {
    const { user } = useUser();
    const { userCourseList, setUserCourseList } = useContext(UserCourseListContext);
    const [courseList, setCourseList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      user && getUserCourses();
    }, [user]);

    const getUserCourses = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/user?userId=${user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const result = await response.json();
        setCourseList(result);
        setUserCourseList(result);
      } catch (error) {
        console.error("Error fetching courses:", error);
        // Add error state handling here
      } finally {
        setLoading(false);
      }
    };

    const CourseOptions = ({ children, handleOnDelete }) => {
      const [openAlert, setOpenAlert] = useState(false);
      return (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">{/* Add div to stop propagation on trigger click */}
              <div onClick={(e) => e.stopPropagation()}>
                {children}
              </div></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation(); // Stop propagation here
                  setOpenAlert(true);
                }}
                className="text-red-500 focus:text-red-600 focus:bg-red-50 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 py-1">
                  <Trash2 size={16} className="transition-transform duration-300 group-hover:rotate-12" />
                  <span>Remove</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={openAlert}>
            <AlertDialogContent className="max-w-md animate-in fade-in-50 duration-300">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete course?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setOpenAlert(false)} className="transition-all duration-300 hover:scale-105">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleOnDelete();
                    setOpenAlert(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 transition-all duration-300 hover:scale-105"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    };

    // Array of different color combinations for cards
    const cardColors = [
      { bg: "bg-violet-600", hover: "hover:border-violet-300", icon: "text-violet-600" },
      { bg: "bg-blue-600", hover: "hover:border-blue-300", icon: "text-blue-600" },
      { bg: "bg-emerald-600", hover: "hover:border-emerald-300", icon: "text-emerald-600" },
      { bg: "bg-amber-600", hover: "hover:border-amber-300", icon: "text-amber-600" },
      { bg: "bg-rose-600", hover: "hover:border-rose-300", icon: "text-rose-600" },
      { bg: "bg-cyan-600", hover: "hover:border-cyan-300", icon: "text-cyan-600" },
    ];

    const CourseCard = ({ course, refreshData, displayUser = false, index }) => {
      const handleOnDelete = async () => {
        try {
          await db.$transaction([
            db.chapter.deleteMany({
              where: { courseId: course.id }
            }),
            db.course.delete({
              where: { id: course.id }
            })
          ]);
          refreshData();
        } catch (error) {
          console.error("Error deleting course:", error);
        }
      };

      // Select a color based on the index
      const colorIndex = index % cardColors.length;
      const cardColor = cardColors[colorIndex];

      return (
        <Card className={`aspect-square overflow-hidden transition-all duration-500 hover:shadow-lg border ${cardColor.hover} hover:-translate-y-1 group`}>
          <Link href={`/ai-courses/course/${course.id}`} className="block h-full" onClick={(e) => e.stopPropagation()} 
          // Add safety
          >
            <div className="flex flex-col h-full">
              <div className={`${cardColor.bg} p-4 flex items-center justify-between transition-all duration-300`}>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 transition-transform duration-300 group-hover:rotate-12">
                  <Layers size={20} className="text-white" />
                </div>
                {!displayUser && (
                  <CourseOptions handleOnDelete={handleOnDelete}>
                    <MoreVertical size={18} className="text-white hover:text-white/80 transition-opacity duration-300" />
                  </CourseOptions>
                )}
              </div>
              
              <div className="p-4 flex flex-col h-full justify-between">
                <div>
                  <h2 className="font-bold text-lg mb-1 line-clamp-2 transition-all duration-300 group-hover:text-gray-100">
                    {course?.courseOutput?.courseName}
                  </h2>
                  <p className=" text-xs text-gray-500 mb-1  transition-all duration-300 group-hover:text-gray-100">{course?.courseOutput?.description}</p>
                  <span className="inline-block text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded transition-all duration-300 group-hover:bg-slate-200">
                    {course?.courseOutput?.level}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-auto">
                  <BookOpen size={16} className={`${cardColor.icon} transition-transform duration-300 group-hover:scale-110`} />
                  <span className="text-sm">{course?.courseOutput?.noOfChapters} Chapters</span>
                </div>
              </div>
            </div>
          </Link>
        </Card>
      );
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-6xl font-bold gradient-title animate-in slide-in-from-left duration-500">Your Courses</h1>
          <Link href="/ai-courses/create-course">
            <Button className="transition-all duration-300 hover:scale-105 hover:shadow-md">
              <Plus size={18} className="mr-1 transition-transform duration-300 hover:rotate-90" /> Create course
            </Button>
          </Link>
        </div>
          
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((_, index) => (
              <div 
                key={index} 
                className="aspect-square bg-slate-100 animate-pulse rounded-lg"
                style={{ animationDelay: `${index * 150}ms` }}
              ></div>
            ))}
          </div>
        ) : courseList?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {courseList.map((course, index) => (
              <div key={index} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                <CourseCard course={course} index={index} refreshData={getUserCourses} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300 transition-all duration-500 hover:border-slate-400 animate-in fade-in-50">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-medium mb-2 animate-in slide-in-from-bottom duration-300" style={{ animationDelay: "200ms" }}>No courses yet</h3>
              <p className="text-slate-500 mb-6 animate-in slide-in-from-bottom duration-300" style={{ animationDelay: "300ms" }}>Create your first course to get started</p>
              <Link href="/ai-courses/create-course" className="animate-in slide-in-from-bottom duration-300" style={{ animationDelay: "400ms" }}>
                <Button className="transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <Plus size={18} className="mr-1 transition-transform duration-300 hover:rotate-90" /> Create course
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-8xl mx-auto px-4 py-8">
      <CourseCollection />
    </div>
  );
};

export default Dashboard;