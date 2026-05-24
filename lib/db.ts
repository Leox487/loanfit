import "server-only";

import type { LoanAnalysis } from "@/lib/analysis-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

export type BusinessRow = {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  business_type: string;
  industry: string;
  years_in_business: number;
  annual_revenue: number;
};

export type CreateBusinessData = {
  clerk_user_id: string;
  name: string;
  email: string;
  business_type: string;
  industry: string;
  years_in_business: number;
  annual_revenue: number;
};

export type CreateAnalysisData = {
  user_id: string;
  document_type: string;
  raw_text: string;
  loan_readiness_score: number;
  dscr: number | null;
  revenue_trend: string;
  debt_load: string;
  cash_flow_consistency: string;
  red_flags: string[];
  fix_list: LoanAnalysis["fix_list"];
  loan_types_qualified: string[];
  full_report: LoanAnalysis;
};

export type AnalysisListRow = {
  id: string;
  document_type: string;
  created_at: string;
  loan_readiness_score: number;
};

export type AnalysisDetailRow = {
  id: string;
  user_id: string;
  document_type: string;
  created_at: string;
  full_report: unknown;
};

export async function getBusinessByClerkId(
  clerkId: string,
): Promise<BusinessRow | null> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id, clerk_user_id, name, email, business_type, industry, years_in_business, annual_revenue",
    )
    .eq("clerk_user_id", clerkId)
    .maybeSingle();

  if (error) throw error;
  return data as BusinessRow | null;
}

export async function createBusiness(
  data: CreateBusinessData,
): Promise<BusinessRow> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: row, error } = await supabase
    .from("businesses")
    .insert(data)
    .select(
      "id, clerk_user_id, name, email, business_type, industry, years_in_business, annual_revenue",
    )
    .single();

  if (error || !row) throw error ?? new Error("Failed to create business");
  return row as BusinessRow;
}

export async function createAnalysis(
  data: CreateAnalysisData,
): Promise<{ id: string }> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: row, error } = await supabase
    .from("analyses")
    .insert({
      user_id: data.user_id,
      document_type: data.document_type,
      raw_text: data.raw_text,
      loan_readiness_score: data.loan_readiness_score,
      dscr: data.dscr,
      revenue_trend: data.revenue_trend,
      debt_load: data.debt_load,
      cash_flow_consistency: data.cash_flow_consistency,
      red_flags: data.red_flags,
      fix_list: data.fix_list,
      loan_types_qualified: data.loan_types_qualified,
      full_report:
        typeof data.full_report === "string"
          ? data.full_report
          : JSON.stringify(data.full_report),
    })
    .select("id")
    .single();

  if (error || !row?.id) {
    throw error ?? new Error("Failed to create analysis");
  }

  return { id: row.id as string };
}

export async function getAnalysesByBusinessId(
  businessId: string,
): Promise<AnalysisListRow[]> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("clerk_user_id")
    .eq("id", businessId)
    .maybeSingle();

  if (businessError) throw businessError;
  if (!business?.clerk_user_id) return [];

  const { data, error } = await supabase
    .from("analyses")
    .select("id, document_type, created_at, loan_readiness_score")
    .eq("user_id", business.clerk_user_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AnalysisListRow[];
}

export async function getAnalysisById(
  id: string,
  clerkUserId?: string,
): Promise<AnalysisDetailRow | null> {
  const supabase = createSupabaseServiceRoleClient();

  let query = supabase
    .from("analyses")
    .select("id, user_id, document_type, created_at, full_report")
    .eq("id", id);

  if (clerkUserId) {
    query = query.eq("user_id", clerkUserId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as AnalysisDetailRow | null;
}
