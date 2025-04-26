import { getUserOnboardingStatus } from "@/actions/user";
import { industries } from "@/data/industries";
import { redirect } from "next/navigation";
import React from "react";
import OnboardingForm from "./_components/onboarding-form";

const OnBoardingPage = async () => {
  // Redirect to onboarding if not
  const { isOnboarded, userData } = await getUserOnboardingStatus();


  // Remove the automatic redirect - let users access the form anytime
  return (
    <main>
      <OnboardingForm 
        industries={industries} 
        initialValues={userData} 
        isReturningUser={isOnboarded}
      />
    </main>
  );
};

export default OnBoardingPage;
