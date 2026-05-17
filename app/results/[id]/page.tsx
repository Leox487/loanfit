import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import {
  type CashFlowConsistency,
  type DebtLoad,
  type LoanAnalysis,
  type RevenueTrend,
  normalizeLoanAnalysis,
} from "@/lib/analysis-types";
import { WhatIfSimulator } from "@/app/components/WhatIfSimulator";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

type Tone = "good" | "warn" | "bad" | "neutral";

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

function toneForCash(c: CashFlowConsistency): Tone {
  if (c === "strong") return "good";
  if (c === "moderate") return "warn";
  return "bad";
}

function toneForDscr(dscr: number | null): Tone {
  if (dscr === null || Number.isNaN(dscr)) return "neutral";
  if (dscr >= 1.25) return "good";
  if (dscr >= 1) return "warn";
  return "bad";
}

function formatDscr(dscr: number | null): string {
  if (dscr === null || Number.isNaN(dscr)) return "—";
  return dscr.toFixed(2);
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`metric-pill metric-pill-${tone}`}>
      <span className="metric-pill-label">{label}</span>
      <span className="metric-pill-value">{value}</span>
    </div>
  );
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { id } = await params;

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    notFound();
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("document_type, created_at, full_report")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.full_report) notFound();

  let analysis: LoanAnalysis;
  try {
    analysis = normalizeLoanAnalysis(data.full_report);
  } catch {
    notFound();
  }

  const scoreTone = toneForScore(analysis.loan_readiness_score);

  return (
    <main className="results-page">
      <div className="results-inner">
        <p className="results-meta">
          {typeof data.document_type === "string" ? data.document_type : ""}
          {typeof data.created_at === "string"
            ? ` · ${new Date(data.created_at).toLocaleString()}`
            : ""}
        </p>

        <section className="results-hero">
          <p className="results-hero-label">Loan readiness score</p>
          <div className={`results-score results-score-${scoreTone}`}>
            {analysis.loan_readiness_score}
          </div>
          <p className="results-summary">{analysis.summary}</p>
        </section>

        <section className="results-section">
          <h2 className="results-heading">Metrics</h2>
          <div className="metric-grid">
            <Pill
              label="DSCR"
              value={formatDscr(analysis.dscr)}
              tone={toneForDscr(analysis.dscr)}
            />
            <Pill
              label="Revenue trend"
              value={analysis.revenue_trend}
              tone={toneForRevenue(analysis.revenue_trend)}
            />
            <Pill
              label="Debt load"
              value={analysis.debt_load}
              tone={toneForDebt(analysis.debt_load)}
            />
            <Pill
              label="Cash flow"
              value={analysis.cash_flow_consistency}
              tone={toneForCash(analysis.cash_flow_consistency)}
            />
          </div>
        </section>

        <section className="results-section">
          <h2 className="results-heading">Red flags</h2>
          {analysis.red_flags.length === 0 ? (
            <p className="results-muted">None noted for this document.</p>
          ) : (
            <ul className="results-list">
              {analysis.red_flags.map((f, i) => (
                <li key={`${i}-${f}`}>{f}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="results-section">
          <h2 className="results-heading">Prioritized fixes</h2>
          {analysis.fix_list.length === 0 ? (
            <p className="results-muted">No fix items returned.</p>
          ) : (
            <ol className="fix-list">
              {analysis.fix_list.map((item, i) => (
                <li key={`${item.action}-${i}`} className="fix-item">
                  <span className="fix-priority">Priority: {String(item.priority)}</span>
                  <p className="fix-action">{item.action}</p>
                  <p className="fix-impact">{item.impact}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="results-section">
          <h2 className="results-heading">Loan types you may qualify for</h2>
          {analysis.loan_types_qualified.length === 0 ? (
            <p className="results-muted">None listed — strengthen fundamentals first.</p>
          ) : (
            <ul className="loan-chip-list">
              {analysis.loan_types_qualified.map((t, i) => (
                <li key={`${i}-${t}`} className="loan-chip">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </section>

        <WhatIfSimulator
          baseScore={analysis.loan_readiness_score}
          baseDscr={analysis.dscr}
          baseDebtLoad={analysis.debt_load}
          baseRevenueTrend={analysis.revenue_trend}
        />

        <div className="results-actions">
          <Link href="/upload" className="btn btn-primary">
            Upload another document
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
