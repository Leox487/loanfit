export type RevenueTrend = "growing" | "flat" | "declining";

export type DebtLoad = "low" | "moderate" | "high";

export type CashFlowConsistency = "strong" | "moderate" | "weak";

export interface FixItem {
  priority: string | number;
  action: string;
  impact: string;
}

/** Parsed Claude output saved to Supabase and returned from /api/analyze */
export interface LoanAnalysis {
  loan_readiness_score: number;
  dscr: number | null;
  revenue_trend: RevenueTrend;
  debt_load: DebtLoad;
  cash_flow_consistency: CashFlowConsistency;
  red_flags: string[];
  fix_list: FixItem[];
  loan_types_qualified: string[];
  summary: string;
}

const SYSTEM_PROMPT =
  "You are a senior SBA loan underwriter with 20 years of experience. You have been given one or more financial documents from a small business loan applicant. Each document is labeled with its type. Analyze all documents together, cross-referencing them where possible. Key things to check: (1) Do the revenue figures in the bank statements match the P&L and tax returns? Discrepancies are major red flags. (2) Calculate DSCR using the most reliable income figure across all documents. (3) Assess revenue trend across the full period covered by all documents. (4) Identify debt obligations from all sources. (5) Flag any inconsistencies between documents. Return ONLY a valid JSON object with these exact fields: loan_readiness_score (0-100 integer), dscr (number or null), revenue_trend (growing/flat/declining), debt_load (low/moderate/high), cash_flow_consistency (strong/moderate/weak), red_flags (array of strings — be specific and include document cross-reference issues), fix_list (array of objects with priority, action, impact), loan_types_qualified (array of strings), summary (2-3 sentence plain English summary of the full picture across all documents). Base everything on real SBA 7(a) underwriting criteria where minimum DSCR is 1.25x.";

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
    const priority = o.priority;
    const action = o.action;
    const impact = o.impact;
    out.push({
      priority:
        typeof priority === "string" || typeof priority === "number"
          ? priority
          : "",
      action: typeof action === "string" ? action : "",
      impact: typeof impact === "string" ? impact : "",
    });
  }
  return out;
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
    dscr,
    revenue_trend,
    debt_load,
    cash_flow_consistency,
    red_flags: asStringArray(base.red_flags),
    fix_list,
    loan_types_qualified: asStringArray(base.loan_types_qualified),
    summary,
  };
}
