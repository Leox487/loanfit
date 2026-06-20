import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

import {
  type CashFlowConsistency,
  type DebtLoad,
  type DocumentAssessment,
  type FixItem,
  type LoanAnalysis,
  type RevenueTrend,
  type ScoreBreakdown,
  normalizeLoanAnalysis,
} from "@/lib/analysis-types";
import { ResultsSection } from "@/app/components/ResultsSection";
import { WhatIfSimulator } from "@/app/components/WhatIfSimulator";
import { getAnalysisById } from "@/lib/db";

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

function toneForPriority(priority: string | number): Tone {
  const s = String(priority).toLowerCase();
  if (s.includes("high") || s === "1" || s === "p1") return "bad";
  if (s.includes("medium") || s.includes("moderate") || s === "2" || s === "p2")
    return "warn";
  return "good";
}

function toneForConfidence(level: DocumentAssessment["confidence_level"]): Tone {
  if (level === "High") return "good";
  if (level === "Medium") return "warn";
  return "bad";
}

function formatPriorityLabel(priority: string | number): string {
  if (typeof priority === "number" && Number.isFinite(priority)) {
    return `P${priority}`;
  }
  const trimmed = String(priority).trim();
  return trimmed.length > 0 ? trimmed : "—";
}

function formatDscr(dscr: number | null): string {
  if (dscr === null || Number.isNaN(dscr)) return "—";
  return dscr.toFixed(2);
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPoints(points: number): string {
  if (points > 0) return `+${points}`;
  return String(points);
}

const MESSY_LABEL_RE = /\b(wait|revised|corrected|however|note)\b/i;

function cleanComponentLabel(
  name: string,
  points: number,
  label: string,
): string {
  if (!label || MESSY_LABEL_RE.test(label)) {
    return `${name}: ${formatPoints(points)} points awarded based on analysis`;
  }
  return label;
}

function truncateReason(reason: string): string {
  if (reason.length <= 200) return reason;
  const slice = reason.slice(0, 200);
  const lastSpace = slice.lastIndexOf(" ");
  const truncated = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${truncated.trimEnd()}...`;
}

const TOTAL_TONE_COLOR: Record<Tone, string> = {
  good: "#16a34a",
  warn: "#ca8a04",
  bad: "#dc2626",
  neutral: "#6b7280",
};

function parseRedFlag(flag: string): {
  type: string;
  finding: string;
  reference: string;
} {
  const colonIdx = flag.indexOf(":");
  if (colonIdx === -1) {
    return { type: "Flag", finding: flag, reference: "" };
  }
  const type = flag.slice(0, colonIdx).replace(/^\[|\]$/g, "").trim();
  const rest = flag.slice(colonIdx + 1).trim();
  const emDash = rest.indexOf(" — ");
  if (emDash === -1) {
    return { type, finding: rest, reference: "" };
  }
  return {
    type,
    finding: rest.slice(0, emDash).trim(),
    reference: rest.slice(emDash + 3).trim(),
  };
}

function parseFullReport(raw: unknown): LoanAnalysis | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return normalizeLoanAnalysis(JSON.parse(raw));
    } catch {
      return null;
    }
  }
  try {
    return normalizeLoanAnalysis(raw);
  } catch {
    return null;
  }
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

function BreakdownRow({
  name,
  points,
  label,
  variant = "component",
}: {
  name: string;
  points: number;
  label: string;
  variant?: "component" | "deduction" | "total";
}) {
  const isTotal = variant === "total";
  const pointsClass =
    variant === "deduction"
      ? "results-breakdown-points-negative"
      : points > 0
        ? "results-breakdown-points-positive"
        : points < 0
          ? "results-breakdown-points-negative"
          : "results-breakdown-points-neutral";

  return (
    <div
      className={`results-breakdown-row results-breakdown-row-${variant}`}
    >
      <span className="results-breakdown-name">
        {variant === "deduction" ? <strong>{name}</strong> : name}
      </span>
      <span
        className={`results-breakdown-points${isTotal ? "" : ` ${pointsClass}`}`}
        style={
          isTotal
            ? {
                color: TOTAL_TONE_COLOR[toneForScore(points)],
                fontWeight: 800,
                fontSize: "1.75rem",
              }
            : undefined
        }
      >
        {isTotal ? `= ${points}` : formatPoints(points)}
      </span>
      <span className="results-breakdown-label">{label}</span>
    </div>
  );
}

function ScoreBreakdownSection({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <section className="results-section">
      <h2 className="results-heading">How this score was calculated</h2>
      <div className="results-breakdown">
        <BreakdownRow
          name="Base score"
          points={breakdown.base_score}
          label="Starting point for all analyses"
          variant="component"
        />
        <BreakdownRow
          name="DSCR"
          points={breakdown.dscr_points}
          label={cleanComponentLabel(
            "DSCR",
            breakdown.dscr_points,
            breakdown.dscr_points_label,
          )}
        />
        <BreakdownRow
          name="Revenue trend"
          points={breakdown.revenue_points}
          label={cleanComponentLabel(
            "Revenue trend",
            breakdown.revenue_points,
            breakdown.revenue_points_label,
          )}
        />
        <BreakdownRow
          name="Cash flow"
          points={breakdown.cash_flow_points}
          label={cleanComponentLabel(
            "Cash flow",
            breakdown.cash_flow_points,
            breakdown.cash_flow_points_label,
          )}
        />
        <BreakdownRow
          name="Debt load"
          points={breakdown.debt_load_points}
          label={cleanComponentLabel(
            "Debt load",
            breakdown.debt_load_points,
            breakdown.debt_load_points_label,
          )}
        />
        <BreakdownRow
          name="Document quality"
          points={breakdown.document_quality_points}
          label={cleanComponentLabel(
            "Document quality",
            breakdown.document_quality_points,
            breakdown.document_quality_points_label,
          )}
        />
        <BreakdownRow
          name="Business history"
          points={breakdown.business_history_points}
          label={cleanComponentLabel(
            "Business history",
            breakdown.business_history_points,
            breakdown.business_history_points_label,
          )}
        />
        {breakdown.red_flag_deductions.map((deduction, i) => (
          <BreakdownRow
            key={`${deduction.flag_name}-${i}`}
            name={deduction.flag_name}
            points={deduction.points}
            label={truncateReason(deduction.reason)}
            variant="deduction"
          />
        ))}
        <BreakdownRow
          name="Final score"
          points={breakdown.final_score}
          label="Capped between 0 and 100"
          variant="total"
        />
      </div>
      <p className="results-breakdown-footnote">
        Score calculated using SBA SOP 50 10 8 underwriting criteria
      </p>
    </section>
  );
}

function DscrDeepDive({
  dscr,
  calc,
}: {
  dscr: number | null;
  calc: LoanAnalysis["dscr_calculation"];
}) {
  const dscrDisplay = dscr !== null ? `${dscr.toFixed(2)}x` : "—";

  return (
    <section className="results-section">
      <h2 className="results-heading">
        DSCR Calculation — How We Got to {dscrDisplay}
      </h2>
      <div className="results-dscr-statement">
        <div className="results-dscr-row">
          <span className="results-dscr-label">Net Operating Income</span>
          <span className="results-dscr-value">
            {formatMoney(calc.net_operating_income)}
          </span>
        </div>

        {calc.addbacks.length > 0 ? (
          <div className="results-dscr-subsection">
            <p className="results-dscr-subheading">Addbacks</p>
            <ul className="results-dscr-addbacks">
              {calc.addbacks.map((item, i) => (
                <li key={`${i}-${item}`} className="results-dscr-addback-row">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="results-dscr-row results-dscr-row-emphasis">
          <span className="results-dscr-label">Adjusted Income</span>
          <span className="results-dscr-value">
            {formatMoney(calc.adjusted_income)}
          </span>
        </div>

        {calc.debt_items.length > 0 ? (
          <div className="results-dscr-subsection">
            <p className="results-dscr-subheading">Debt service</p>
            <ul className="results-dscr-debts">
              {calc.debt_items.map((item, i) => (
                <li key={`${i}-${item}`} className="results-dscr-debt-row">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="results-dscr-row results-dscr-row-emphasis">
          <span className="results-dscr-label">Total Annual Debt Service</span>
          <span className="results-dscr-value">
            {formatMoney(calc.total_annual_debt_service)}
          </span>
        </div>

        <p className="results-dscr-formula">{calc.dscr_formula}</p>

        <div className="results-dscr-minimum">
          <span className="results-dscr-label">
            SBA minimum: {calc.sba_minimum.toFixed(2)}x
          </span>
          <span
            className={`results-dscr-status results-dscr-status-${calc.meets_minimum ? "pass" : "fail"}`}
          >
            {calc.meets_minimum ? "✓ Meets minimum" : "✗ Below minimum"}
          </span>
        </div>
      </div>
    </section>
  );
}

function getPriorityActions(fixList: FixItem[]): FixItem[] {
  const high = fixList.filter((f) => String(f.priority).toLowerCase() === "high");
  const medium = fixList.filter((f) => String(f.priority).toLowerCase() === "medium");
  return [...high, ...medium].slice(0, 3);
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) notFound();

  const { id } = await params;

  let row;
  try {
    row = await getAnalysisById(id, userId);
  } catch {
    notFound();
  }

  if (!row?.full_report) notFound();

  const analysis = parseFullReport(row.full_report);
  if (!analysis) notFound();

  const scoreTone = toneForScore(analysis.loan_readiness_score);
  const confidenceTone = toneForConfidence(
    analysis.document_assessment.confidence_level,
  );

  return (
    <main className="results-page">
      <div className="results-inner">
        {/* Section 1 — Header */}
        <header className="results-header-block">
          <p className="results-meta">
            {row.document_type}
            {typeof row.created_at === "string"
              ? ` · ${new Date(row.created_at).toLocaleString()}`
              : ""}
          </p>
          <div className="results-confidence">
            <span
              className={`results-confidence-badge results-confidence-badge-${confidenceTone}`}
            >
              {analysis.document_assessment.confidence_level} Confidence
            </span>
            <p className="results-confidence-reason">
              {analysis.document_assessment.confidence_reason}
            </p>
          </div>
          {analysis.document_assessment.documents_provided.length > 0 ? (
            <p className="results-muted results-documents-provided">
              Documents:{" "}
              {analysis.document_assessment.documents_provided.join(", ")}
            </p>
          ) : null}
          <p className="results-muted results-cross-reference">
            {analysis.document_assessment.cross_reference_result}
          </p>
        </header>

        {/* Section 2 — Score Hero */}
        <section className="results-hero">
          <p className="results-hero-label">Loan readiness score</p>
          <div className={`results-score results-score-${scoreTone}`}>
            {analysis.loan_readiness_score}
          </div>
          <p className="results-summary">{analysis.summary}</p>
        </section>

        <section className="results-group">
          <div className="results-group-header">
            <div>
              <h2 className="results-group-title">Do These 3 Things First</h2>
              <p className="results-group-subtitle">These will move your score the most</p>
            </div>
          </div>
          <div className="priority-actions-list">
            {getPriorityActions(analysis.fix_list).map((item, i) => (
              <div key={`priority-${i}`} className="priority-action-card">
                <div className="priority-action-badge">{i + 1}</div>
                <div className="priority-action-content">
                  <p className="priority-action-text">{item.action}</p>
                  <p className="priority-action-impact">{item.impact}</p>
                  <p className="priority-action-timeline">Timeline: {item.timeline || "Not specified"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Group 2 — The Numbers */}
        <ResultsSection
          title="The Numbers"
          subtitle="Exactly how we calculated your score"
        >
          <ScoreBreakdownSection breakdown={analysis.score_breakdown} />

          <DscrDeepDive dscr={analysis.dscr} calc={analysis.dscr_calculation} />

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
        </ResultsSection>

        {/* Group 3 — What's Holding You Back */}
        <ResultsSection
          title="What's Holding You Back"
          subtitle="Issues an SBA underwriter would flag"
        >
          <section className="results-section">
            <h2 className="results-heading">Red flags</h2>
            {analysis.red_flags.length === 0 ? (
              <p className="results-muted">None noted for this document.</p>
            ) : (
              <ul className="results-flag-list">
                {analysis.red_flags.map((f, i) => {
                  const parsed = parseRedFlag(f);
                  return (
                    <li key={`${i}-${f}`} className="results-flag-item">
                      <p className="results-flag-title">
                        <strong>{parsed.type}:</strong> {parsed.finding}
                      </p>
                      {parsed.reference ? (
                        <p className="results-flag-reference">
                          {parsed.reference}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </ResultsSection>

        {/* Group 4 — Your Action Plan */}
        <ResultsSection
          title="Your Action Plan"
          subtitle="Fix these to improve your score"
        >
          <section className="results-section">
            <h2 className="results-heading">Prioritized fixes</h2>
            {analysis.fix_list.length === 0 ? (
              <p className="results-muted">No fix items returned.</p>
            ) : (
              <ol className="fix-list">
                {analysis.fix_list.map((item, i) => {
                  const priorityTone = toneForPriority(item.priority);
                  return (
                    <li key={`${item.action}-${i}`} className="fix-item">
                      <span
                        className={`fix-priority-badge fix-priority-badge-${priorityTone}`}
                      >
                        {formatPriorityLabel(item.priority)}
                      </span>
                      <p className="fix-action">{item.action}</p>
                      <p className="fix-impact">{item.impact}</p>
                      <p className="results-fix-timeline">
                        Timeline: {item.timeline}
                      </p>
                      <p className="results-fix-sba-ref">{item.sba_reference}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </ResultsSection>

        {/* Group 5 — Loan Options */}
        <ResultsSection
          title="Loan Options"
          subtitle="What you may qualify for"
        >
          <section className="results-section">
            <h2 className="results-heading">Loan types you may qualify for</h2>
            {analysis.loan_types_qualified.length === 0 ? (
              <p className="results-muted">
                None listed — strengthen fundamentals first.
              </p>
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
        </ResultsSection>

        {/* Group 6 — Try Different Scenarios */}
        <ResultsSection
          title="Try Different Scenarios"
          subtitle="See how changes could move your score"
        >
          <WhatIfSimulator
            baseScore={analysis.loan_readiness_score}
            baseDscr={analysis.dscr}
            baseDebtLoad={analysis.debt_load}
            baseRevenueTrend={analysis.revenue_trend}
          />
        </ResultsSection>

        <div className="results-actions">
          <Link href="/upload" className="btn btn-primary">
            Upload another document
          </Link>
          <Link href="/dashboard" className="btn btn-ghost">
            Back to dashboard
          </Link>
        </div>

        <section className="results-disclaimer">
          <p className="results-disclaimer-text">
            This report is generated by AI for informational purposes only and
            does not constitute professional financial, legal, or lending
            advice. Scores and analyses are estimates based on the documents
            provided and may not reflect actual lender decisions. Consult a
            licensed financial advisor or SBA-approved lender before making any
            loan application decisions.
          </p>
        </section>
      </div>
    </main>
  );
}
