import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/app/components/OnboardingForm";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    redirect("/sign-in");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Failed to check onboarding status");
  }

  if (business) redirect("/dashboard");

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
