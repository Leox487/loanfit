import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/components/OnboardingForm";
import { getBusinessByClerkId } from "@/lib/db";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let business;
  try {
    business = await getBusinessByClerkId(userId);
  } catch {
    redirect("/sign-in");
  }

  if (business) redirect("/upload");

  return (
    <main className="onboarding-page">
      <p className="onboarding-kicker">Tell us about your business</p>
      <div className="onboarding-card">
        <h1 className="onboarding-title">Business profile</h1>
        <p className="onboarding-lede">
          A few details help us tailor your loan readiness insights.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
