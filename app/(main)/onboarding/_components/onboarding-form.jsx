"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { onboardingSchema } from "@/app/lib/schema";
import { updateUser } from "@/actions/user";

const OnboardingForm = ({ industries, initialValues = {}, isReturningUser = false }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const router = useRouter();

  const {
    loading: updateLoading,
    fn: updateUserFn,
    data: updateResult,
  } = useFetch(updateUser);

  // Parse initial industry and sub-industry if they exist
  const [initialIndustry, initialSubIndustry] = initialValues.industry 
    ? initialValues.industry.split('-') 
    : [null, null];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      industry: initialIndustry || "",
      subIndustry: initialSubIndustry || "",
      experience: initialValues.experience ? Number(initialValues.experience) : 0,

      skills: initialValues.skills?.join(", ") || "",
      bio: initialValues.bio || "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const formattedIndustry = `${values.industry}-${values.subIndustry
        .toLowerCase()
        .replace(/ /g, "-")}`;
  
      await updateUserFn({
        ...values,
        industry: formattedIndustry,
        // No need to split skills here - Zod already transformed it to an array
        skills: values.skills, // This is already an array
      });
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  useEffect(() => {
    if (updateResult?.success && !updateLoading) {
      toast.success(
        isReturningUser 
          ? "Profile updated successfully!" 
          : "Onboarding completed!"
      );
      router.push("/dashboard");
      router.refresh();
    }
  }, [updateResult, updateLoading]);

  const watchIndustry = watch("industry");

  // Set initial industry selection when component mounts
  useEffect(() => {
    if (initialIndustry && industries.length > 0) {
      const industryObj = industries.find(ind => ind.id === initialIndustry);
      if (industryObj) {
        setSelectedIndustry(industryObj);
      }
    }
  }, [initialIndustry, industries]);

  return (
    <div className="flex items-center justify-center bg-background min-h-screen py-8">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="gradient-title text-3xl">
            {isReturningUser ? "Update Your Profile" : "Complete Your Profile"}
          </CardTitle>
          <CardDescription>
            {isReturningUser
              ? "Update your information to get the most relevant career insights."
              : "Select your industry to get personalized career insights and recommendations."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select
                onValueChange={(value) => {
                  setValue("industry", value);
                  setSelectedIndustry(
                    industries.find((ind) => ind.id === value)
                  );
                  setValue("subIndustry", "");
                }}
                defaultValue={initialIndustry}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Industries</SelectLabel>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.id}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-red-500">
                  {errors.industry.message}
                </p>
              )}
            </div>

            {watchIndustry && (
              <div className="space-y-2">
                <Label htmlFor="subIndustry">Specialization</Label>
                <Select
                  onValueChange={(value) => setValue("subIndustry", value)}
                  defaultValue={initialSubIndustry?.replace(/-/g, " ")}
                >
                  <SelectTrigger id="subIndustry">
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Specializations</SelectLabel>
                      {selectedIndustry?.subIndustries.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.subIndustry && (
                  <p className="text-sm text-red-500">
                    {errors.subIndustry.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
  id="experience"
  type="number"
  min="0"
  max="50"
  placeholder="Enter years of experience"
  {...register("experience", { 
    setValueAs: (v) => v === "" ? "" : Number(v).toString() // Convert to string
  })}
/>
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
  id="skills"
  placeholder="e.g., Python, JavaScript, Project Management"
  {...register("skills", {
    setValueAs: (v) => v || "" // Ensure it's always a string
  })}
/>
              <p className="text-sm text-muted-foreground">
                Separate multiple skills with commas
              </p>
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your professional background..."
                className="h-32"
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-sm text-red-500">{errors.bio.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(isReturningUser ? "/dashboard" : "/")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={updateLoading}
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isReturningUser ? "Update Profile" : "Complete Profile"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingForm;