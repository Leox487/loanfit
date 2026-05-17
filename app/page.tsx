import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="landing">
      <div className="landing-inner">
        <p className="landing-brand">LoanFit</p>
        <h1 className="landing-headline">
          Know if your business is loan-ready — before you apply
        </h1>
        <p className="landing-sub">
          Upload your bank statement, P&amp;L, or tax return. Get an instant loan
          readiness score, red flags, and a prioritized fix list powered by AI.
        </p>
        <div className="landing-actions">
          {isSignedIn ? (
            <>
              <Link href="/dashboard" className="btn btn-primary landing-cta">
                Go to dashboard
              </Link>
              <Link href="/upload" className="btn btn-ghost">
                Upload a document
              </Link>
            </>
          ) : (
            <>
              <Link href="/sign-up" className="btn btn-primary landing-cta">
                Get your score free
              </Link>
              <Link href="/sign-in" className="btn btn-ghost">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
