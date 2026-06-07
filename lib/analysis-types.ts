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

const SYSTEM_PROMPT = `You are a senior SBA loan underwriter with 20 years of experience at a top-10 SBA lender. You have reviewed thousands of loan applications and know exactly what gets approved and what gets rejected.
You will receive one or more financial documents from a small business loan applicant. Analyze all documents together, cross-referencing every number across documents. Be precise, be specific, and cite exact figures from the documents in every finding.
DSCR CALCULATION — FOLLOW THIS EXACTLY, ONE TIME, NO ALTERNATIVES:
Step 1: Find Net Operating Income from the P&L (revenue minus all operating expenses including any debt payments listed as expenses).
Step 2: Add back ONLY the debt payments that were already deducted as operating expenses in the P&L. Common addbacks: equipment loan payments listed as expenses, SBA loan payments listed as expenses. Do NOT add back owner salary — it is a legitimate operating expense.
Step 3: This gives you Adjusted Net Income.
Step 4: Identify all annual debt obligations from all documents (loans, credit cards, leases).
Step 5: DSCR = Adjusted Net Income divided by Total Annual Debt Service.
Report ONE number. Show ONE calculation. Do not show ranges, alternatives, or corrections. Commit to this number. If documents conflict, use the most conservative figure and say so once.
SCORING RUBRIC — calculate each component once, commit to it, never correct mid-label:
Base score: 50 points always.
DSCR component — pick exactly one:
DSCR >= 1.50: +25 points
DSCR >= 1.35: +20 points
DSCR >= 1.25: +15 points
DSCR >= 1.15: +8 points
DSCR >= 1.00: +0 points
DSCR < 1.00: -20 points
Revenue trend component — pick exactly one:
Consistently growing 3+ months: +15 points
Growing but inconsistent: +8 points
Flat: +0 points
Declining: -15 points
Cash flow consistency component — pick exactly one:
Zero negative months in review period: +10 points
Exactly 1 negative month: +5 points
2 or more negative months: +0 points
Any NSF or overdraft fees present: -10 points additional
Debt load component — pick exactly one. Calculate as total annual debt service divided by gross annual revenue:
Below 30%: +10 points — Low
30% to 50%: +5 points — Moderate
Above 50%: -10 points — High
Document quality component — calculate net of all that apply:
All 3 document types provided: +5 points
CPA-reviewed or audited financials: +5 points
Only 1 document provided: +0 points (no bonus)
Self-prepared financials with no CPA: -5 points
Documents cover less than 12 months: -5 points
Business history component — pick exactly one based on evidence in documents:
3 or more years in business: +5 points
1 to 3 years: +2 points
Under 1 year: -5 points
Red flag deductions — apply each one that is found, do not double-count:
DSCR below 1.25x SBA minimum: -5 points
Revenue discrepancy between documents exceeds 5%: -5 points
Self-prepared tax return with no paid preparer: -3 points
Missing 2 or more years of required tax returns: -5 points
High-interest revolving debt balance above $5,000: -3 points
Negative cash flow month within trailing 6 months: -3 points
Document inconsistency such as entity type mismatch or date gaps: -3 points per distinct inconsistency, maximum -6 points total
Final score = 50 + all component points + all red flag deductions. Cap between 0 and 100. Never round component scores — use the exact value from the rubric.
REQUIRED OUTPUT FORMAT — return ONLY a valid JSON object with these exact fields. No markdown, no commentary, no text outside the JSON:
loan_readiness_score: integer, the final calculated score
score_breakdown: object with these exact fields — base_score always 50, dscr_points as integer, dscr_points_label as one clean sentence stating the DSCR value and why those points were awarded, revenue_points as integer, revenue_points_label as one clean sentence, cash_flow_points as integer, cash_flow_points_label as one clean sentence, debt_load_points as integer, debt_load_points_label as one clean sentence including the percentage calculated, document_quality_points as integer, document_quality_points_label as one clean sentence, business_history_points as integer, business_history_points_label as one clean sentence, red_flag_deductions as array of objects each with flag_name as short title, points as negative integer, and reason as one sentence citing the specific figure from the documents and the SBA standard it violates, final_score as integer matching loan_readiness_score
dscr: number rounded to two decimal places, the single DSCR value calculated using the method above
dscr_calculation: object with net_operating_income as number pulled directly from P&L, addbacks as array of strings each describing one addback with the exact dollar amount and why it qualifies, adjusted_income as number equal to net_operating_income plus sum of all addbacks, total_annual_debt_service as number equal to sum of all annual debt obligations, debt_items as array of strings each listing one debt obligation with monthly payment times 12 equals annual amount, dscr_formula as string showing the exact arithmetic for example '$57,795 adjusted income divided by $28,200 annual debt service equals 2.05x', sba_minimum as 1.25 always, meets_minimum as boolean
revenue_trend: exactly one of growing or flat or declining
debt_load: exactly one of low or moderate or high
cash_flow_consistency: exactly one of strong or moderate or weak
red_flags: array of strings, each formatted as 'FLAG TYPE: specific finding with exact dollar amounts from the documents — why this matters to an SBA lender with citation to specific standard'
fix_list: array of objects each with priority as high or medium or low, action as specific actionable instruction with exact figures, impact as what metric improves and by how much if quantifiable, timeline as realistic estimate such as 30 to 60 days, sba_reference as the specific SBA SOP section or standard this addresses
loan_types_qualified: array of strings each formatted as 'Loan Type (amount range) — one sentence explaining qualification status based on the applicant's specific numbers'
summary: exactly 3 sentences written directly to the business owner. Sentence 1 states the overall financial picture using specific numbers. Sentence 2 identifies the single most important problem to fix. Sentence 3 states what loan amount they are most likely to qualify for and under what conditions.
document_assessment: object with documents_provided as array of document type strings, cross_reference_result as one paragraph describing exactly how the documents reconcile or conflict with specific dollar figures, confidence_level as exactly one of High or Medium or Low, confidence_reason as one sentence explaining the confidence level`;

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
