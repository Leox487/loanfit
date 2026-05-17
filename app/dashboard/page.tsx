import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import {
  type DebtLoad,
  type RevenueTrend,
} from "@/lib/analysis-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

type Tone = "good" | "warn" | "bad";

type AnalysisRow = {
  id: string;
  document_type: string;
  created_at: string;
  loan_readiness_score: number;
  revenue_trend: RevenueTrend;
  debt_load: DebtLoad;
};

function toneForScore(score: number): Tone {
  if (score >= 70) return "good";
  if (score >= 40) return "warn";
  return "bad";
}

function toneForRevenue(t: RevenueTrend): Tone {
  if (t === "growing") return "good";
  if (t === "flat") return "warn";
  return "bad";
}

function toneForDebt(d: DebtLoad): Tone {
  if (d === "low") return "good";
  if (d === "moderate") return "warn";
  return "bad";
}

function DashboardBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`dashboard-badge dashboard-badge-${tone}`}>{label}</span>
  );
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) notFound();

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    notFound();
  }

  const { data, error } = await supabase
    .from("analyses")
    .select(
      "id, document_type, created_at, loan_readiness_score, revenue_trend, debt_load",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) notFound();

  const analyses = (data ?? []) as AnalysisRow[];

  return (
    <main className="results-page">
      <div className="dashboard-inner">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Your analyses</h1>
            <p className="results-muted">
              Past loan readiness reports from your uploads.
            </p>
          </div>
          <Link href="/upload" className="btn btn-primary">
            Upload new document
          </Link>
        </header>

        {analyses.length === 0 ? (
          <div className="dashboard-empty">
            <p className="results-muted">No analyses yet</p>
            <Link href="/upload" className="btn btn-primary">
              Upload a document
            </Link>
          </div>
        ) : (
          <div className="dashboard-grid">
            {analyses.map((row) => {
              const scoreTone = toneForScore(row.loan_readiness_score);
              const revenueTone = toneForRevenue(row.revenue_trend);
              const debtTone = toneForDebt(row.debt_load);

              return (
                <Link
                  key={row.id}
                  href={`/results/${row.id}`}
                  className="dashboard-card"
                >
                  <div
                    className={`dashboard-card-score dashboard-card-score-${scoreTone}`}
                  >
                    {row.loan_readiness_score}
                  </div>
                  <p className="results-meta">
                    {row.document_type}
                    {` · ${new Date(row.created_at).toLocaleString()}`}
                  </p>
                  <div className="dashboard-card-badges">
                    <DashboardBadge
                      label={`Revenue: ${row.revenue_trend}`}
                      tone={revenueTone}
                    />
                    <DashboardBadge
                      label={`Debt: ${row.debt_load}`}
                      tone={debtTone}
                    />
                  </div>
                  <span className="dashboard-card-link">View results →</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
