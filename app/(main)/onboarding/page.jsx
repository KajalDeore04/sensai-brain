import { getUserOnboardingStatus } from "@/actions/user";
import { industries } from "@/data/industries";
import { redirect } from "next/navigation";
import React from "react";
import OnboardingForm from "./_components/onboarding-form";

const OnBoardingPage = async () => {
  // Redirect to onboarding if not
  const { isOnboarded } = await getUserOnboardingStatus();

  if (isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  );
};

export default OnBoardingPage;
