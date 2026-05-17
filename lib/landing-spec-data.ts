export const LANDING_PROBLEMS = [
  {
    title: "Banks reject you without explaining why",
    body: "You spend weeks gathering bank statements, tax returns, and P&L statements. You submit everything. Two weeks later you get a form letter that says 'does not meet our credit criteria.' No specifics. No feedback. No path forward. You're left guessing what went wrong and whether it's even worth trying again.",
  },
  {
    title: "You don't know what lenders actually check",
    body: "SBA lenders run your numbers through a rigid framework: Debt Service Coverage Ratio, revenue trend over 12-24 months, debt load relative to income, cash flow consistency month over month. If you've never heard of DSCR, you're already behind. Most business owners haven't — and lenders won't explain it to you.",
  },
  {
    title: "By the time you find out, it's too late",
    body: "You applied because you needed capital now. A rejection doesn't just sting — it sets you back 6 to 12 months. Your credit gets a hard inquiry. You have to rebuild before reapplying. And the underlying problem — the one that caused the rejection — is still there, unaddressed, because nobody told you what it was.",
  },
] as const;

export const LANDING_STEPS = [
  {
    number: "1",
    title: "Upload your document",
    description:
      "Drop in a bank statement, profit & loss statement, or business tax return as a PDF. We support all standard formats from any bank or accounting software. The upload takes under 60 seconds. You don't need to prepare anything special or format it in any way — just upload what you have.",
    detail:
      "Supported: Bank Statements, P&L Statements, Tax Returns (Form 1120S, Schedule C). Max file size: 15MB PDF.",
  },
  {
    number: "2",
    title: "AI reads it like an underwriter",
    description:
      "Our AI analyzes your document using the same framework SBA lenders use. It calculates your Debt Service Coverage Ratio, maps your revenue trend across months, assesses your debt load, evaluates cash flow consistency, and flags anything that would cause a lender to pause or reject. This is not a generic financial review — it is specifically calibrated to SBA and conventional small business loan criteria.",
    detail:
      "Powered by Claude, Anthropic's AI. Analysis typically completes in 15-30 seconds.",
  },
  {
    number: "3",
    title: "Get your score, red flags, and fix list",
    description:
      "You receive a 0-100 Loan Readiness Score that summarizes your overall bankability. Below that, a plain-English summary of your financial profile, a list of specific red flags that would concern lenders, and a prioritized action plan — ranked by impact — telling you exactly what to fix and in what order. You also see which loan types you currently qualify for.",
    detail:
      "Results are saved to your dashboard. You can run multiple analyses and track improvement over time.",
  },
] as const;

export const LANDING_FEATURES = [
  {
    title: "Loan Readiness Score",
    description:
      "A single number from 0 to 100 that represents your overall bankability based on your uploaded documents. The score is calculated using the same weighted factors SBA underwriters apply: cash flow coverage, revenue stability, debt burden, and financial consistency. It is not a credit score — it does not require a hard pull and does not affect your credit. Scores of 70 and above indicate a strong candidate. Scores between 40 and 70 are borderline and may qualify for smaller loans or require documentation. Scores below 40 indicate significant gaps that need to be addressed before applying.",
    example:
      'Example: "Score: 62 — Your cash flow is positive and your banking history is clean, but your DSCR of 1.30 leaves limited cushion for a new loan payment, and your revenue has been flat for 12 months. Focus on the fix list below before applying for anything above $75,000."',
  },
  {
    title: "DSCR Calculation",
    description:
      "Debt Service Coverage Ratio is the single most important number in small business lending. It measures whether your business generates enough cash flow to cover its existing debt payments plus a new loan payment. DSCR is calculated as Net Operating Income divided by Total Debt Service. An SBA 7(a) lender typically requires a minimum DSCR of 1.25, meaning your income must be at least 25% higher than your debt payments. A DSCR below 1.0 means your business is cash flow negative relative to debt — an automatic disqualifier at most institutions.",
    example:
      'Example: "DSCR: 1.30 — Your monthly net income of $2,530 covers your $1,940 in monthly debt payments with a ratio of 1.30. This meets the SBA minimum of 1.25 but leaves little room to absorb a new loan. Adding a $500/month payment would drop your DSCR to 1.04 — below threshold."',
  },
  {
    title: "Red Flag Detection",
    description:
      "Lenders are trained to look for specific patterns that signal risk. LoanFit surfaces these before you apply, so you are not blindsided in the underwriting process. Red flags include: NSF or overdraft fees in the past 12 months, irregular or declining deposit patterns, high-interest revolving debt relative to income, single-month income spikes that inflate averages, seasonal revenue that drops below debt service in slow months, and reliance on a single large client or deposit source. Each red flag is explained in plain English with context for why lenders care about it.",
    example:
      'Example: "Red flag: High-interest revolving credit card debt ($8,340 at 19.99% APR). Why lenders care: revolving credit card balances signal that the business is using consumer credit to cover operating gaps — a pattern associated with higher default rates. Lenders will factor the minimum payment into your DSCR calculation even if you consistently pay more."',
  },
  {
    title: "Prioritized Fix List",
    description:
      "The fix list is the most actionable part of your report. Each item is ranked High, Medium, or Low priority based on the impact it will have on your loan readiness score. High-priority items are things that, if addressed, would most significantly improve your DSCR, reduce red flags, or change which loan products you qualify for. Each fix includes the specific action to take, the expected impact on your score and financial profile, and approximately how long it will take to see the effect in your financials.",
    example:
      "Example fix: Priority — High. Action: Pay off or pay down the Chase Ink Business credit card balance of $8,340 before applying. Impact: Eliminates $250/month minimum payment, improves DSCR by approximately 0.11, removes a high-rate revolving liability from your debt profile. Lenders will view this as a signal of financial discipline. Expected time to reflect in statements: 1-2 months.",
  },
  {
    title: "What If Simulator",
    description:
      "The What If Simulator lets you model changes to your financial profile and instantly see how your loan readiness score would respond. Use the debt reduction slider to simulate paying down existing debt — for every 10% reduction in monthly debt payments, your score increases. Use the revenue growth slider to simulate growing your monthly deposits — for every 10% increase, your score improves further. The simulator also shows you how your debt load tier and revenue trend classification change as you move the sliders. This helps you prioritize: should you focus on paying down debt first, or is growing revenue a faster path to approval?",
    example:
      "Example: Current score 62, DSCR 1.30, Revenue Flat, Debt Moderate. Scenario: Reduce debt by 50% (pay off credit card) + Grow revenue by 20% (land one new client). Simulated score: 80. Debt load upgrades to Low. Revenue trend upgrades to Growing. New DSCR estimate: 1.58. Loan types unlocked: SBA 7(a) standard up to $500k.",
  },
  {
    title: "Loan Type Matching",
    description:
      "Not all business loans are the same, and not all lenders have the same requirements. Based on your financial profile, LoanFit identifies which loan types and programs you currently qualify for — and which ones you are close to qualifying for with a few improvements. We cover SBA 7(a) loans (small and standard), SBA Microloans, SBA Community Advantage, conventional bank term loans, and credit union business loans. For each loan type you qualify for, we show the typical loan range, key requirements you meet, and any conditions that could affect approval.",
    example:
      "Example: You qualify for — SBA 7(a) Small Loan up to $150,000 (DSCR meets minimum, 4 years in business, clean banking history). SBA Microloan up to $50,000 (existing repayment history, stable deposits). Community Advantage Loan (moderate cash flow, underserved market eligible). You do not yet qualify for — SBA 7(a) Standard above $150,000 (DSCR needs to reach 1.40+ and revenue trend must show growth for 6+ months).",
  },
] as const;

export const LANDING_PROFILES = [
  {
    title: "The First-Timer",
    description:
      "You have been running your business for a few years and you are starting to think about growth capital. Maybe a new piece of equipment, a second location, or a cash cushion for a slow season. You have never applied for a business loan before and you do not know where to start. LoanFit gives you a clear picture of where you stand before you walk into a bank — so you can go in with confidence instead of uncertainty.",
    footer:
      "Most common outcome: discover you are closer to ready than you thought, or identify one or two specific things to fix first.",
  },
  {
    title: "The Rejected",
    description:
      "You applied. You got turned down. The lender gave you a vague reason or no reason at all. Now you are trying to figure out what went wrong and whether it is worth trying again. LoanFit reads your financials the same way the lender did and surfaces the specific issues that likely caused the rejection. Instead of guessing, you get a clear fix list and a timeline for when you will be ready to reapply.",
    footer:
      "Most common outcome: pinpoint the exact metrics that caused rejection and get a step-by-step plan to address them.",
  },
  {
    title: "The Planner",
    description:
      "You do not need capital right now — but you know you will in 6 to 12 months and you want to be ready when the time comes. You are proactively building your financial profile so that when you apply, you are a strong candidate. LoanFit helps you track your readiness over time, upload updated documents as your financials improve, and see your score trend upward month by month.",
    footer:
      "Most common outcome: identify the highest-impact improvements to make now so your score is 70+ by the time you apply.",
  },
  {
    title: "The Hustler",
    description:
      "Your business is growing fast and you need capital to keep up with demand. You have opportunities in front of you and you need to move quickly. You do not have time to waste on loan applications that go nowhere. LoanFit tells you the maximum loan amount your current financials can support, which lenders are most likely to approve you, and what your application looks like from the underwriter's perspective — so you can move fast and smart.",
    footer:
      "Most common outcome: confirm you qualify for larger amounts than expected, or identify the one bottleneck preventing a larger approval.",
  },
] as const;
