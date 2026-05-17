import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

function LandingActions({ isSignedIn }: { isSignedIn: boolean }) {
  if (isSignedIn) {
    return (
      <div className="landing-actions">
        <Link href="/dashboard" className="btn btn-primary landing-cta">
          Go to dashboard
        </Link>
        <Link href="/upload" className="btn btn-ghost">
          Upload a document
        </Link>
      </div>
    );
  }

  return (
    <div className="landing-actions">
      <Link href="/sign-up" className="btn btn-primary landing-cta">
        Get your score free
      </Link>
      <Link href="/sign-in" className="btn btn-ghost">
        Sign in
      </Link>
    </div>
  );
}

const STEPS = [
  {
    title: "Upload a document",
    body: "Bank statement, P&L, or tax return. Takes 30 seconds.",
  },
  {
    title: "AI reads it like an underwriter",
    body: "Claude analyzes your financials using real SBA criteria.",
  },
  {
    title: "Get your score and fix list",
    body: "See exactly where you stand and what to fix before applying.",
  },
] as const;

const FEATURES = [
  {
    title: "Loan Readiness Score (0–100)",
    body: "Know instantly if you're bankable.",
  },
  {
    title: "DSCR & Cash Flow Analysis",
    body: "The #1 metric lenders check.",
  },
  {
    title: "Red Flags",
    body: "See what would get you rejected before the lender does.",
  },
  {
    title: "Prioritized Fix List",
    body: "Step-by-step actions to improve your score.",
  },
] as const;

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-container landing-hero-inner">
          <p className="landing-brand">LoanFit</p>
          <h1 className="landing-headline">
            Know if your business is loan-ready — before you apply
          </h1>
          <p className="landing-sub">
            Upload your bank statement, P&amp;L, or tax return. Get an instant loan
            readiness score, red flags, and a prioritized fix list powered by AI.
          </p>
          <LandingActions isSignedIn={isSignedIn} />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">How it works</h2>
          <ol className="landing-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="landing-step">
                <span className="landing-step-num">{index + 1}</span>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2 className="landing-section-title">What you get</h2>
          <ul className="landing-features">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="landing-feature-card">
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-body">{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-container landing-audience">
          <h2 className="landing-section-title">Who it&apos;s for</h2>
          <p className="landing-audience-text">
            Built for small business owners who&apos;ve been turned down,
            don&apos;t know where to start, or want to be ready before walking
            into a bank.
          </p>
        </div>
      </section>

      <section className="landing-section landing-section-alt landing-cta-section">
        <div className="landing-container landing-cta-inner">
          <h2 className="landing-section-title">Ready to see your score?</h2>
          <LandingActions isSignedIn={isSignedIn} />
        </div>
      </section>
    </main>
  );
}
