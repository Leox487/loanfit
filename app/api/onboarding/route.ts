import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase";

const BUSINESS_TYPES = [
  "Sole Proprietor",
  "LLC",
  "S-Corp",
  "C-Corp",
  "Partnership",
] as const;

const INDUSTRIES = [
  "Construction",
  "Retail",
  "Restaurant",
  "Food & Beverage",
  "Healthcare",
  "Professional Services",
  "Transportation",
  "Manufacturing",
  "Real Estate",
  "Other",
] as const;

const ANNUAL_REVENUE_VALUES = [0, 60000, 180000, 360000, 900000, 1800000] as const;

type OnboardingBody = {
  name?: unknown;
  business_type?: unknown;
  industry?: unknown;
  years_in_business?: unknown;
  annual_revenue?: unknown;
};

function isAllowedBusinessType(v: string): v is (typeof BUSINESS_TYPES)[number] {
  return (BUSINESS_TYPES as readonly string[]).includes(v);
}

function isAllowedIndustry(v: string): v is (typeof INDUSTRIES)[number] {
  return (INDUSTRIES as readonly string[]).includes(v);
}

function isAllowedAnnualRevenue(v: number): boolean {
  return (ANNUAL_REVENUE_VALUES as readonly number[]).includes(v);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) {
    return NextResponse.json(
      { error: "No email address on your account" },
      { status: 400 },
    );
  }

  let body: OnboardingBody;
  try {
    body = (await req.json()) as OnboardingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const businessType =
    typeof body.business_type === "string" ? body.business_type : "";
  if (!isAllowedBusinessType(businessType)) {
    return NextResponse.json({ error: "Invalid business type" }, { status: 400 });
  }

  const industry = typeof body.industry === "string" ? body.industry : "";
  if (!isAllowedIndustry(industry)) {
    return NextResponse.json({ error: "Invalid industry" }, { status: 400 });
  }

  const yearsRaw = body.years_in_business;
  const years =
    typeof yearsRaw === "number"
      ? yearsRaw
      : typeof yearsRaw === "string"
        ? Number.parseInt(yearsRaw, 10)
        : NaN;
  if (!Number.isInteger(years) || years < 0 || years > 100) {
    return NextResponse.json(
      { error: "Years in business must be an integer from 0 to 100" },
      { status: 400 },
    );
  }

  const revenueRaw = body.annual_revenue;
  const annualRevenue =
    typeof revenueRaw === "number"
      ? revenueRaw
      : typeof revenueRaw === "string"
        ? Number.parseInt(revenueRaw, 10)
        : NaN;
  if (!Number.isInteger(annualRevenue) || !isAllowedAnnualRevenue(annualRevenue)) {
    return NextResponse.json(
      { error: "Invalid annual revenue estimate" },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Server missing Supabase configuration" },
      { status: 500 },
    );
  }

  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true });
  }

  const { error: insertError } = await supabase.from("businesses").insert({
    clerk_user_id: userId,
    name,
    email,
    business_type: businessType,
    industry,
    years_in_business: years,
    annual_revenue: annualRevenue,
  });

  if (insertError) {
    console.error("Onboarding insert error:", JSON.stringify(insertError));
    return NextResponse.json(
      { error: "Failed to save business profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
