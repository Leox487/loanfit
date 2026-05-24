export type RevenueTrend = "growing" | "flat" | "declining";

export type DebtLoad = "low" | "moderate" | "high";

export type CashFlowConsistency = "strong" | "moderate" | "weak";

export interface ScoreBreakdown {
  base_score: number;
  dscr_points: number;
  dscr_points_label: string;
  revenue_points: number;
  revenue_points_label: string;
  cash_flow_points: number;
  cash_flow_points_label: string;
  debt_load_points: number;
  debt_load_points_label: string;
  document_quality_points: number;
  document_quality_points_label: string;
  business_history_points: number;
  business_history_points_label: string;
  red_flag_deductions: Array<{
    flag_name: string;
    points: number;
    reason: string;
  }>;
  final_score: number;
}

export interface DscrCalculation {
  net_operating_income: number;
  addbacks: string[];
  adjusted_income: number;
  total_annual_debt_service: number;
  debt_items: string[];
  dscr_formula: string;
  sba_minimum: number;
  meets_minimum: boolean;
}

export interface DocumentAssessment {
  documents_provided: string[];
  cross_reference_result: string;
  confidence_level: "High" | "Medium" | "Low";
  confidence_reason: string;
}

export interface FixItem {
  priority: string | number;
  action: string;
  impact: string;
  timeline: string;
  sba_reference: string;
}

/** Parsed Claude output saved to Supabase and returned from /api/analyze */
export interface LoanAnalysis {
  loan_readiness_score: number;
  score_breakdown: ScoreBreakdown;
  dscr: number | null;
  dscr_calculation: DscrCalculation;
  revenue_trend: RevenueTrend;
  debt_load: DebtLoad;
  cash_flow_consistency: CashFlowConsistency;
  red_flags: string[];
  fix_list: FixItem[];
  loan_types_qualified: string[];
  summary: string;
  document_assessment: DocumentAssessment;
}

const SYSTEM_PROMPT = `You are a senior SBA loan underwriter with 20 years of experience. Analyze the provided financial document(s) and return ONLY a valid JSON object with these exact fields:

loan_readiness_score: integer 0-100, calculated using this exact scoring rubric:
Start at 50 base points.
DSCR component (max +25 points):
DSCR >= 1.50: +25
DSCR >= 1.35: +20
DSCR >= 1.25: +15
DSCR >= 1.15: +8
DSCR >= 1.00: +0
DSCR < 1.00: -20
Revenue trend component (max +15 points):
Growing consistently 3+ months: +15
Growing but inconsistent: +8
Flat: +0
Declining: -15
Cash flow consistency component (max +10 points):
No negative months: +10
1 negative month: +5
2+ negative months: +0
NSF/overdraft history: -10
Debt load component (max +10 points):
Low (debt service < 30% of gross revenue): +10
Moderate (30-50%): +5
High (>50%): -10
Document quality component (max +10 points):
All 3 documents provided and cross-reference cleanly: +10
2 documents provided: +5
1 document only: +0
Self-prepared financials only: -5
CPA-reviewed or audited financials: +5
Business history component (max +5 points): estimate from documents
3+ years in business: +5
1-3 years: +2
Under 1 year: -5
Red flag deductions (each flag found):
DSCR below SBA minimum 1.25x: -5
Revenue discrepancy between documents > 5%: -5
Self-prepared tax return: -3
Missing 2+ years of tax returns: -5
High-interest revolving debt > $5,000: -3
Negative cash flow month in last 6 months: -3
Document inconsistencies (entity type, dates, etc): -3
Cap final score between 0 and 100.

score_breakdown: object showing exactly how the score was calculated with these fields:
base_score: always 50
dscr_points: number (positive or negative) with label explaining why
revenue_points: number with label
cash_flow_points: number with label
debt_load_points: number with label
document_quality_points: number with label
business_history_points: number with label
red_flag_deductions: array of objects, each with flag_name, points (negative number), and reason (one sentence citing the specific SBA standard or underwriting criterion)
final_score: same as loan_readiness_score

dscr: number or null — calculated as: Net Operating Income (after addbacks) divided by Total Annual Debt Service. Show your work in dscr_calculation field.

dscr_calculation: object with fields:
net_operating_income: number (annual)
addbacks: array of strings describing what was added back and why (e.g. 'Owner salary $72,000 added back per SBA addback policy')
adjusted_income: number (after addbacks)
total_annual_debt_service: number
debt_items: array of strings listing each debt obligation and annual payment
dscr_formula: string showing the actual math e.g. '$104,595 adjusted income ÷ $25,200 debt service = 1.29x'
sba_minimum: always 1.25
meets_minimum: boolean

revenue_trend: growing or flat or declining
debt_load: low or moderate or high
cash_flow_consistency: strong or moderate or weak

red_flags: array of strings, each flag written as: '[FLAG TYPE]: [specific finding from the documents] — [why this matters to an SBA lender, citing specific standard or criterion]'

fix_list: array of objects with priority (high/medium/low), action (specific actionable step), impact (exactly what metric it improves and by how much if quantifiable), timeline (realistic estimate e.g. '30-60 days'), sba_reference (the specific SBA guideline or underwriting standard this addresses)

loan_types_qualified: array of strings, each formatted as: '[Loan Type] ([amount range]) — [one sentence explaining why they do or do not qualify based on their specific numbers]'

summary: 3-4 sentence plain English summary written directly to the business owner, referencing their actual numbers

document_assessment: object with fields:
documents_provided: array of document types received
cross_reference_result: string describing whether documents reconcile or not with specific numbers
confidence_level: High, Medium, or Low
confidence_reason: one sentence explaining the confidence level`;

export function getLoanAnalysisSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function extractJsonFromAssistantText(text: string): string {
  let t = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(t);
  if (fence?.[1]) {
    t = fence[1].trim();
  }
  return t;
}

function asNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseFloat(v.replace(/[$,]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asFixList(v: unknown): FixItem[] {
  if (!Array.isArray(v)) return [];
  const out: FixItem[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    out.push({
      priority:
        typeof o.priority === "string" || typeof o.priority === "number"
          ? o.priority
          : "",
      action: asString(o.action),
      impact: asString(o.impact),
      timeline: asString(o.timeline, "Timeline not specified"),
      sba_reference: asString(o.sba_reference, "SBA reference not provided"),
    });
  }
  return out;
}

function asRedFlagDeductions(
  v: unknown,
): ScoreBreakdown["red_flag_deductions"] {
  if (!Array.isArray(v)) return [];
  const out: ScoreBreakdown["red_flag_deductions"] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const points = asNumber(o.points, 0);
    out.push({
      flag_name: asString(o.flag_name, "Red flag"),
      points: points <= 0 ? points : -Math.abs(points),
      reason: asString(o.reason, "Deduction applied per underwriting criteria."),
    });
  }
  return out;
}

function labelFromBreakdown(
  sb: Record<string, unknown>,
  pointsKey: string,
  labelKey: string,
  fallback: string,
): string {
  const direct = sb[labelKey];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const nested = sb[pointsKey];
  if (nested && typeof nested === "object") {
    const label = (nested as Record<string, unknown>).label;
    if (typeof label === "string" && label.trim()) return label.trim();
  }
  return fallback;
}

function pointsFromBreakdown(
  sb: Record<string, unknown>,
  key: string,
): number {
  const raw = sb[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === "object") {
    const points = (raw as Record<string, unknown>).points;
    if (typeof points === "number" && Number.isFinite(points)) return points;
  }
  return asNumber(raw, 0);
}

function normalizeScoreBreakdown(
  raw: unknown,
  score: number,
): ScoreBreakdown {
  const sb =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    base_score: 50,
    dscr_points: pointsFromBreakdown(sb, "dscr_points"),
    dscr_points_label: labelFromBreakdown(
      sb,
      "dscr_points",
      "dscr_points_label",
      "DSCR component not detailed",
    ),
    revenue_points: pointsFromBreakdown(sb, "revenue_points"),
    revenue_points_label: labelFromBreakdown(
      sb,
      "revenue_points",
      "revenue_points_label",
      "Revenue trend not detailed",
    ),
    cash_flow_points: pointsFromBreakdown(sb, "cash_flow_points"),
    cash_flow_points_label: labelFromBreakdown(
      sb,
      "cash_flow_points",
      "cash_flow_points_label",
      "Cash flow not detailed",
    ),
    debt_load_points: pointsFromBreakdown(sb, "debt_load_points"),
    debt_load_points_label: labelFromBreakdown(
      sb,
      "debt_load_points",
      "debt_load_points_label",
      "Debt load not detailed",
    ),
    document_quality_points: pointsFromBreakdown(sb, "document_quality_points"),
    document_quality_points_label: labelFromBreakdown(
      sb,
      "document_quality_points",
      "document_quality_points_label",
      "Document quality not detailed",
    ),
    business_history_points: pointsFromBreakdown(sb, "business_history_points"),
    business_history_points_label: labelFromBreakdown(
      sb,
      "business_history_points",
      "business_history_points_label",
      "Business history not detailed",
    ),
    red_flag_deductions: asRedFlagDeductions(sb.red_flag_deductions),
    final_score:
      typeof sb.final_score === "number" && Number.isFinite(sb.final_score)
        ? clampScore(sb.final_score)
        : score,
  };
}

function normalizeDscrCalculation(
  raw: unknown,
  dscr: number | null,
): DscrCalculation {
  const dc =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const netOperatingIncome = asNumber(dc.net_operating_income, 0);
  const adjustedIncome = asNumber(
    dc.adjusted_income,
    netOperatingIncome,
  );
  const totalDebtService = asNumber(dc.total_annual_debt_service, 0);
  const addbacks = asStringArray(dc.addbacks);
  const debtItems = asStringArray(dc.debt_items);

  let formula = asString(dc.dscr_formula);
  if (!formula && dscr !== null && totalDebtService > 0) {
    formula = `${formatMoney(adjustedIncome)} ÷ ${formatMoney(totalDebtService)} = ${dscr.toFixed(2)}x`;
  }
  if (!formula) {
    formula = "DSCR calculation not provided";
  }

  const sbaMinimum = asNumber(dc.sba_minimum, 1.25);
  const meetsMinimum =
    typeof dc.meets_minimum === "boolean"
      ? dc.meets_minimum
      : dscr !== null && dscr >= sbaMinimum;

  return {
    net_operating_income: netOperatingIncome,
    addbacks,
    adjusted_income: adjustedIncome,
    total_annual_debt_service: totalDebtService,
    debt_items: debtItems,
    dscr_formula: formula,
    sba_minimum: sbaMinimum,
    meets_minimum: meetsMinimum,
  };
}

function normalizeDocumentAssessment(raw: unknown): DocumentAssessment {
  const da =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const levelRaw = asString(da.confidence_level, "Low");
  const confidence_level: DocumentAssessment["confidence_level"] =
    levelRaw === "High" || levelRaw === "Medium" || levelRaw === "Low"
      ? levelRaw
      : "Low";

  return {
    documents_provided: asStringArray(da.documents_provided),
    cross_reference_result: asString(
      da.cross_reference_result,
      "Cross-reference details not provided.",
    ),
    confidence_level,
    confidence_reason: asString(
      da.confidence_reason,
      "Limited document detail available for assessment.",
    ),
  };
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function priorityRank(p: string | number): number {
  if (typeof p === "number" && Number.isFinite(p)) return p;
  const s = String(p).toLowerCase();
  if (s.includes("high") || s === "1" || s === "p1") return 1;
  if (
    s.includes("medium") ||
    s.includes("moderate") ||
    s === "2" ||
    s === "p2"
  )
    return 2;
  if (s.includes("low") || s === "3" || s === "p3") return 3;
  return 50;
}

export function normalizeLoanAnalysis(raw: unknown): LoanAnalysis {
  const base =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};

  const scoreRaw = base.loan_readiness_score;
  const score =
    typeof scoreRaw === "number"
      ? clampScore(scoreRaw)
      : typeof scoreRaw === "string"
        ? clampScore(Number.parseFloat(scoreRaw))
        : 0;

  let dscr: number | null = null;
  if (base.dscr === null || base.dscr === undefined) {
    dscr = null;
  } else if (typeof base.dscr === "number" && Number.isFinite(base.dscr)) {
    dscr = base.dscr;
  } else if (typeof base.dscr === "string" && base.dscr.trim() !== "") {
    const n = Number.parseFloat(base.dscr);
    dscr = Number.isFinite(n) ? n : null;
  }

  const rt = base.revenue_trend;
  const revenue_trend: RevenueTrend =
    rt === "growing" || rt === "flat" || rt === "declining" ? rt : "flat";

  const dl = base.debt_load;
  const debt_load: DebtLoad =
    dl === "low" || dl === "moderate" || dl === "high" ? dl : "moderate";

  const cf = base.cash_flow_consistency;
  const cash_flow_consistency: CashFlowConsistency =
    cf === "strong" || cf === "moderate" || cf === "weak" ? cf : "moderate";

  const summary =
    typeof base.summary === "string" && base.summary.trim()
      ? base.summary.trim()
      : "Analysis completed; summary unavailable.";

  const fix_list = asFixList(base.fix_list).sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority),
  );

  return {
    loan_readiness_score: score,
    score_breakdown: normalizeScoreBreakdown(base.score_breakdown, score),
    dscr,
    dscr_calculation: normalizeDscrCalculation(base.dscr_calculation, dscr),
    revenue_trend,
    debt_load,
    cash_flow_consistency,
    red_flags: asStringArray(base.red_flags),
    fix_list,
    loan_types_qualified: asStringArray(base.loan_types_qualified),
    summary,
    document_assessment: normalizeDocumentAssessment(
      base.document_assessment,
    ),
  };
}
