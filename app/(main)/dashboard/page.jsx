import { getIndustryInsights } from "@/actions/dashboard";

import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import DashboardView from "./_components/dashboard-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default async function DashboardPage() {
  const { isOnboarded, userData } = await getUserOnboardingStatus();
  

  // If not onboarded, redirect to onboarding page
  // Skip this check if already on the onboarding page
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const insights = await getIndustryInsights();

  return (
    <div className="container mx-auto">
      <div className="flex justify-end mb-4">
        <Link href="/onboarding">
          <Button variant="outline">
            Update Profile Information
          </Button>
        </Link>
      </div>
      <DashboardView insights={insights} />
    </div>
  );
}