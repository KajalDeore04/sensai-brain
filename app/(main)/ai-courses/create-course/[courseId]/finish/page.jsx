// "use client";
// import { db } from "@/configs/db";
// import { CourseList } from "@/configs/schema";
// import { useUser } from "@clerk/nextjs";
// import { and, eq } from "drizzle-orm";
// import { useParams, useRouter } from "next/navigation";
// import React, { useEffect, useState } from "react";
// import CourseBasicInfo from "../_components/CourseBasicInfo";
// import { HiOutlineClipboardDocumentCheck } from "react-icons/hi2";
// import { IoOpenOutline } from "react-icons/io5";

// import Link from "next/link";
// import { Router } from "next/router";

// const FinishScreen = () => {
//   const { user } = useUser();
//   const params = useParams();
//   const router = useRouter();

//   const [course, setCourse] = useState([]);
//   const [copied, setCopied] = useState(false);

//   useEffect(() => {
//     if (params?.courseId && user) {
//       GetCourse();
//     }
//   }, [params, user]);

//   const GetCourse = async () => {
//     const result = await db
//       .select()
//       .from(CourseList)
//       .where(
//         and(
//           eq(CourseList.courseId, params?.courseId),
//           eq(CourseList?.createdBy, user.primaryEmailAddress.emailAddress)
//         )
//       );

//     setCourse(result[0]);
//     console.log("Course Fetched");
//   };

//   const handleCopy = async () => {
//     const url = `${process.env.NEXT_PUBLIC_HOST_NAME}/course/${course?.courseId}`;
//     await navigator.clipboard.writeText(url);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 1000); // Reset after 2 seconds
//   };

//   return (
//     <div className="px-10 md:px-20 lg:px-44 my-7">
//       <h2 className="text-center font-bold text-2xl my-3 text-primary">
//         🎉 Congrats! Your Course is Ready 🎉
//       </h2>

//       <CourseBasicInfo
//         course={course}
//         refreshData={() => console.log("refresh")}
//       />

//       <h2 className="mt-3 font-bold">Course URL:</h2>
//       <div 
//         className={`text-center border p-2 rounded-lg flex gap-5 items-center transition-all ${
//           copied ? "text-black font-semibold" : "text-gray-400"
//         }`}
//       >
//         {process.env.NEXT_PUBLIC_HOST_NAME}/course/{course?.courseId}
//         <IoOpenOutline className='h-7 w-7 cursor-pointer transition-all text-primary scale-110' onClick={() => router.push(`${process.env.NEXT_PUBLIC_HOST_NAME}/course/${course?.courseId}`)}/>

//         <HiOutlineClipboardDocumentCheck
//           className={`h-7 w-7 cursor-pointer transition-all ${
//             copied ? "text-primary scale-110" : "text-gray-500 hover:text-black"
//           }`}
//           onClick={handleCopy}
//         />
//       </div>
//     </div>
//   );
// };

// export default FinishScreen;
