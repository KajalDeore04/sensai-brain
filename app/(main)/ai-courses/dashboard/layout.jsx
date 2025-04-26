"use client";
import React, { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { UserCourseListContext } from "@/app/_context/UserCourseListContext";

const DashboardLayout = ({ children }) => {
  const [userCourseList, setUserCourseList] = useState([]);

  const Header = () => (
    <div className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-[backdrop-filter]:bg-background/60 py-3 px-2 mb-14">
      <div className="container mx-auto flex items-center justify-between">
        <Link href={"/dashboard"}>
          <h1 className="gradient-title text-3xl font-extrabold tracking-tighter">
            Brain AI
          </h1>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/dashboard/explore" className="text-muted-foreground hover:text-foreground transition-colors">
            Explore
          </Link>
         
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );

  return (
    <UserCourseListContext.Provider value={{ userCourseList, setUserCourseList }}>
      <div className="min-h-screen bg-background/80 ">
        
        {/* <Header /> */}
        <div className="container mx-auto px-4 md:px-6 py-6 ">{children}</div>
      </div>
    </UserCourseListContext.Provider>
  );
};

export default DashboardLayout;