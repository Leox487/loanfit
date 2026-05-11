import Link from "next/link";

export default function Home() {
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
