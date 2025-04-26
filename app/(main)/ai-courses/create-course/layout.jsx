"use client";
import React, { useState } from "react";
import Header from "../dashboard/_components/Header";
import { UserInputContext } from "@/app/_context/UserInputContext";

const CreateCourseLayout = ({ children }) => {
    const [userCourseInput, setUserCourseInput] = useState([]);
  return (
    <div className="min-h-screen ">
      <UserInputContext.Provider value={{userCourseInput, setUserCourseInput}}>
        <>
          {/* <Header /> */}
          <div className="animate-in fade-in duration-300">
            {children}
          </div>
        </>
      </UserInputContext.Provider>
    </div>
  );
};

export default CreateCourseLayout;