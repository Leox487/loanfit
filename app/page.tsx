"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <main className="landing">
        <div className="landing-inner">
          <p className="landing-kicker">Loading…</p>
        </div>
      </main>
    );
  }

  if (isSignedIn) {
    return (
      <main className="landing">
        <div className="landing-inner">
          <p className="page-lede">Redirecting to your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="landing">
      <div className="landing-inner">
        <p className="landing-kicker">AI loan readiness analyzer</p>
        <h1 className="landing-headline">
          Know exactly why a bank would reject your loan — before you apply.
        </h1>
        <p className="landing-sub">
          Upload your financials. Get your loan readiness score. Fix what&apos;s
          broken.
        </p>
        <Link
          href="/sign-up"
          prefetch={false}
          className="btn btn-primary landing-cta"
        >
          Get started free
        </Link>
      </div>
    </main>
  );
}
