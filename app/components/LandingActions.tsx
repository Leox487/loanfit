"use client";

import Link from "next/link";

type LandingActionsProps = {
  isSignedIn: boolean;
  variant?: "hero" | "cta";
};

export function LandingActions({
  isSignedIn,
  variant = "hero",
}: LandingActionsProps) {
  const isCta = variant === "cta";

  if (isSignedIn) {
    return (
      <div className="landing-actions">
        <Link
          href="/dashboard"
          className={
            isCta
              ? "landing-btn landing-btn-cta-primary"
              : "landing-btn landing-btn-primary"
          }
        >
          Go to dashboard
        </Link>
        <Link
          href="/upload"
          className={
            isCta
              ? "landing-btn landing-btn-cta-secondary"
              : "landing-btn landing-btn-secondary"
          }
        >
          Upload a document
        </Link>
      </div>
    );
  }

  return (
    <div className="landing-actions">
      <Link
        href="/sign-up"
        className={
          isCta
            ? "landing-btn landing-btn-cta-primary"
            : "landing-btn landing-btn-primary"
        }
      >
        Get started free
      </Link>
      <Link
        href="/sign-in"
        className={
          isCta
            ? "landing-btn landing-btn-cta-secondary"
            : "landing-btn landing-btn-secondary"
        }
      >
        Sign in
      </Link>
    </div>
  );
}
