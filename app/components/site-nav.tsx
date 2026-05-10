"use client";

import Link from "next/link";
import { SignOutButton, useAuth } from "@clerk/nextjs";

export function SiteNav() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="site-nav">
      <Link href="/" className="site-logo">
        LoanFit
      </Link>
      <div className="site-nav-actions">
        {!isLoaded ? (
          <span className="site-nav-placeholder" aria-hidden />
        ) : isSignedIn ? (
          <SignOutButton redirectUrl="/">
            <button type="button" className="btn btn-ghost">
              Sign out
            </button>
          </SignOutButton>
        ) : (
          <Link href="/sign-in" className="btn btn-ghost">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
