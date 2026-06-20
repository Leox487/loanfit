import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";

import { normalizeLoanAnalysis, type LoanAnalysis } from "@/lib/analysis-types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase";

export default async function CalculationPage({
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
    const raw =
      typeof data.full_report === "string"
        ? JSON.parse(data.full_report)
        : data.full_report;
    analysis = normalizeLoanAnalysis(raw);
  } catch {
    notFound();
  }

  const sb = analysis.score_breakdown;
  const dc = analysis.dscr_calculation;

  return (
    <main className="results-page">
      <div className="results-inner">
        <Link href={`/results/${id}`} className="calc-back-link">
          ← Back to results
        </Link>

        <h1 className="calc-title">Complete Calculation Breakdown</h1>

        <section className="results-group">
          <div className="results-group-header">
            <div>
              <h2 className="results-group-title">Score Calculation</h2>
              <p className="results-group-subtitle">
                Every component that built your final score of {analysis.loan_readiness_score}
              </p>
            </div>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Base score</span>
            <span className="calc-row-value calc-positive">+{sb.base_score}</span>
            <p className="calc-row-explain">Every analysis starts at a flat 50 points before any adjustments.</p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">DSCR component</span>
            <span className={`calc-row-value ${sb.dscr_points >= 0 ? "calc-positive" : "calc-negative"}`}>
              {sb.dscr_points >= 0 ? "+" : ""}{sb.dscr_points}
            </span>
            <p className="calc-row-explain">{sb.dscr_points_label}</p>
            <p className="calc-row-rule">
              Rule applied: DSCR ≥ 1.50 = +25 · ≥ 1.35 = +20 · ≥ 1.25 = +15 · ≥ 1.15 = +8 · ≥ 1.00 = +0 · &lt; 1.00 = -20
            </p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Revenue trend component</span>
            <span className={`calc-row-value ${sb.revenue_points >= 0 ? "calc-positive" : "calc-negative"}`}>
              {sb.revenue_points >= 0 ? "+" : ""}{sb.revenue_points}
            </span>
            <p className="calc-row-explain">{sb.revenue_points_label}</p>
            <p className="calc-row-rule">
              Rule applied: Consistently growing = +15 · Growing but inconsistent = +8 · Flat = +0 · Declining = -15
            </p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Cash flow component</span>
            <span className={`calc-row-value ${sb.cash_flow_points >= 0 ? "calc-positive" : "calc-negative"}`}>
              {sb.cash_flow_points >= 0 ? "+" : ""}{sb.cash_flow_points}
            </span>
            <p className="calc-row-explain">{sb.cash_flow_points_label}</p>
            <p className="calc-row-rule">
              Rule applied: 0 negative months = +10 · 1 negative month = +5 · 2+ negative months = +0 · NSF/overdraft present = -10 additional
            </p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Debt load component</span>
            <span className={`calc-row-value ${sb.debt_load_points >= 0 ? "calc-positive" : "calc-negative"}`}>
              {sb.debt_load_points >= 0 ? "+" : ""}{sb.debt_load_points}
            </span>
            <p className="calc-row-explain">{sb.debt_load_points_label}</p>
            <p className="calc-row-rule">
              Rule applied: Debt service ÷ gross revenue below 30% = +10 (Low) · 30-50% = +5 (Moderate) · above 50% = -10 (High)
            </p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Document quality component</span>
            <span className={`calc-row-value ${sb.document_quality_points >= 0 ? "calc-positive" : "calc-negative"}`}>
              {sb.document_quality_points >= 0 ? "+" : ""}{sb.document_quality_points}
            </span>
            <p className="calc-row-explain">{sb.document_quality_points_label}</p>
            <p className="calc-row-rule">
              Rule applied: All 3 docs = +5 · CPA-reviewed = +5 additional · 1 doc only = +0 · Self-prepared, no CPA = -5 · Less than 12 months covered = -5
            </p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Business history component</span>
            <span className={`calc-row-value ${sb.business_history_points >= 0 ? "calc-positive" : "calc-negative"}`}>
              {sb.business_history_points >= 0 ? "+" : ""}{sb.business_history_points}
            </span>
            <p className="calc-row-explain">{sb.business_history_points_label}</p>
            <p className="calc-row-rule">
              Rule applied: 3+ years = +5 · 1-3 years = +2 · Under 1 year = -5
            </p>
          </div>

          <h3 className="calc-subheading">Red Flag Deductions</h3>
          {sb.red_flag_deductions.map((flag, i) => (
            <div key={`flag-${i}`} className="calc-row">
              <span className="calc-row-label">{flag.flag_name}</span>
              <span className="calc-row-value calc-negative">{flag.points}</span>
              <p className="calc-row-explain">{flag.reason}</p>
            </div>
          ))}

          <div className="calc-row calc-final-row">
            <span className="calc-row-label">Final score</span>
            <span className="calc-row-value calc-final-value">{sb.final_score}</span>
            <p className="calc-row-explain">Sum of all components above, capped between 0 and 100.</p>
          </div>
        </section>

        <section className="results-group">
          <div className="results-group-header">
            <div>
              <h2 className="results-group-title">DSCR Calculation</h2>
              <p className="results-group-subtitle">
                How we arrived at a DSCR of {analysis.dscr ?? "N/A"}x
              </p>
            </div>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">Net Operating Income</span>
            <span className="calc-row-value">${dc.net_operating_income.toLocaleString()}</span>
            <p className="calc-row-explain">Pulled directly from the P&L&apos;s net income line, after all operating expenses.</p>
          </div>

          <h3 className="calc-subheading">Addbacks</h3>
          {dc.addbacks.map((addback, i) => (
            <div key={`addback-${i}`} className="calc-row">
              <p className="calc-row-explain">{addback}</p>
            </div>
          ))}

          <div className="calc-row calc-highlight-row">
            <span className="calc-row-label">Adjusted Income</span>
            <span className="calc-row-value">${dc.adjusted_income.toLocaleString()}</span>
            <p className="calc-row-explain">Net Operating Income plus all addbacks above.</p>
          </div>

          <h3 className="calc-subheading">Debt Service Items</h3>
          {dc.debt_items.map((item, i) => (
            <div key={`debt-${i}`} className="calc-row">
              <p className="calc-row-explain">{item}</p>
            </div>
          ))}

          <div className="calc-row calc-highlight-row">
            <span className="calc-row-label">Total Annual Debt Service</span>
            <span className="calc-row-value">${dc.total_annual_debt_service.toLocaleString()}</span>
            <p className="calc-row-explain">Sum of all annual debt obligations listed above.</p>
          </div>

          <div className="calc-formula-box">
            <p className="calc-formula-text">{dc.dscr_formula}</p>
          </div>

          <div className="calc-row">
            <span className="calc-row-label">SBA Minimum Required</span>
            <span className="calc-row-value">{dc.sba_minimum}x</span>
            <p className={`calc-row-explain ${dc.meets_minimum ? "calc-positive" : "calc-negative"}`}>
              {dc.meets_minimum ? "✓ This business meets the SBA minimum DSCR requirement." : "✗ This business does not meet the SBA minimum DSCR requirement."}
            </p>
          </div>
        </section>

        <section className="results-group">
          <div className="results-group-header">
            <div>
              <h2 className="results-group-title">Document Cross-Reference</h2>
              <p className="results-group-subtitle">How the submitted documents compare against each other</p>
            </div>
          </div>
          <p className="calc-row-explain calc-full-text">{analysis.document_assessment.cross_reference_result}</p>
        </section>

        <Link href={`/results/${id}`} className="btn btn-ghost">
          ← Back to results
        </Link>
      </div>
    </main>
  );
}
