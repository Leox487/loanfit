import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="page-centered">
      <h1 className="page-title">Welcome to LoanFit</h1>
      <p className="page-lede">
        Upload your financial documents to get your loan readiness score.
      </p>
      <Link href="/upload" className="btn btn-primary">
        Upload your financials
      </Link>
    </main>
  );
}
