import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { FeatureAccordion } from "@/app/components/FeatureAccordion";
import { LandingActions } from "@/app/components/LandingActions";
import {
  LANDING_FEATURES,
  LANDING_PROBLEMS,
  LANDING_PROFILES,
  LANDING_STEPS,
} from "@/lib/landing-spec-data";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="landing-page">
      {/* Section 1 — Hero */}
      <section className="landing-section landing-hero">
        <div className="landing-section-inner landing-hero-inner">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">
              Used by small business owners preparing for SBA loan applications
            </p>
            <h1 className="landing-hero-headline">
              Know if your business is loan-ready — before you apply
            </h1>
            <p className="landing-hero-sub">
              Upload your bank statement, P&amp;L, or tax return and get an
              SBA-style loan readiness score with exact calculations, red flags,
              and a prioritized fix list in under 2 minutes.
            </p>
            <LandingActions isSignedIn={false} variant="hero" />
            <p className="landing-hero-note">
              No credit check. No commitment. Results in under 2 minutes.
            </p>
          </div>

          <aside className="landing-score-card" aria-label="Example loan readiness score">
            <p className="landing-score-label">Loan Readiness Score</p>
            <p className="landing-score-value">74</p>
            <hr className="landing-score-divider" />
            <dl className="landing-score-metrics">
              <div className="landing-score-metric">
                <dt>DSCR</dt>
                <dd className="landing-score-metric-good">1.42</dd>
              </div>
              <div className="landing-score-metric">
                <dt>Revenue Trend</dt>
                <dd className="landing-score-metric-good">Growing</dd>
              </div>
              <div className="landing-score-metric">
                <dt>Red Flags Found</dt>
                <dd className="landing-score-metric-warn">1</dd>
              </div>
            </dl>
            <p className="landing-score-disclaimer">
              Example output — your results will vary
            </p>
          </aside>
        </div>
      </section>

      {/* Section 2 — The Problem */}
      <section className="landing-section landing-section-grey">
        <div className="landing-section-inner landing-section-centered">
          <p className="landing-eyebrow">The Problem</p>
          <h2 className="landing-section-headline">
            Getting a business loan is harder than it should be
          </h2>
          <p className="landing-section-sub">
            The system is not designed to help you understand why you were
            rejected — or what to do next. LoanFit is.
          </p>
          <div className="landing-grid-3">
            {LANDING_PROBLEMS.map((card) => (
              <article key={card.title} className="landing-card">
                <h3 className="landing-card-title">{card.title}</h3>
                <p className="landing-card-body">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 — How It Works */}
      <section className="landing-section">
        <div className="landing-section-inner landing-section-centered">
          <p className="landing-eyebrow">How It Works</p>
          <h2 className="landing-section-headline">
            Three steps to knowing exactly where you stand
          </h2>
          <div className="landing-grid-3">
            {LANDING_STEPS.map((step) => (
              <article key={step.number} className="landing-step">
                <span className="landing-step-number" aria-hidden>
                  {step.number}
                </span>
                <h3 className="landing-step-title">{step.title}</h3>
                <p className="landing-step-description">{step.description}</p>
                <p className="landing-step-detail">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — What You Get */}
      <section className="landing-section landing-section-grey">
        <div className="landing-section-inner landing-section-centered">
          <p className="landing-eyebrow">What You Get</p>
          <h2 className="landing-section-headline">
            Everything you need to walk into a bank with confidence
          </h2>
          <p className="landing-section-sub">
            LoanFit does not give you a vague score and leave you guessing. Every
            number comes with an explanation, and every problem comes with a
            solution.
          </p>
          <div className="landing-grid-2x3">
            {LANDING_FEATURES.map((feature) => (
              <FeatureAccordion
                key={feature.title}
                title={feature.title}
                description={feature.description}
                example={feature.example}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Who It Is For */}
      <section className="landing-section">
        <div className="landing-section-inner landing-section-centered">
          <p className="landing-eyebrow">Who It Is For</p>
          <h2 className="landing-section-headline">
            Built for small business owners who are serious about getting funded
          </h2>
          <p className="landing-section-sub">
            If you have ever wondered whether your business would qualify for a
            loan — or why it did not — LoanFit was built for you.
          </p>
          <div className="landing-grid-2x2">
            {LANDING_PROFILES.map((profile) => (
              <article key={profile.title} className="landing-card">
                <h3 className="landing-card-title">{profile.title}</h3>
                <p className="landing-card-body">{profile.description}</p>
                <p className="landing-card-footer">{profile.footer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 — Bottom CTA */}
      <section className="landing-section landing-section-navy">
        <div className="landing-section-inner landing-cta-inner">
          <h2 className="landing-cta-headline">Stop guessing. Start knowing.</h2>
          <p className="landing-cta-sub">
            Upload one document and get your loan readiness score in under 2
            minutes. No credit check. No commitment. No fluff.
          </p>
          <LandingActions isSignedIn={false} variant="cta" />
          <p className="landing-cta-note">
            Powered by Claude AI. Your documents are never stored after analysis.
          </p>
        </div>
      </section>
    </main>
  );
}
