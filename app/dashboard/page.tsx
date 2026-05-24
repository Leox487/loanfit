import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

import { getAnalysesByBusinessId, getBusinessByClerkId } from "@/lib/db";

type Tone = "good" | "warn" | "bad";

function toneForScore(score: number): Tone {
  if (score >= 70) return "good";
  if (score >= 40) return "warn";
  return "bad";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) notFound();

  let business;
  try {
    business = await getBusinessByClerkId(userId);
  } catch {
    notFound();
  }

  if (!business) redirect("/onboarding");

  let analyses;
  try {
    analyses = await getAnalysesByBusinessId(business.id);
  } catch {
    notFound();
  }

  return (
    <main className="results-page">
      <div className="dashboard-inner">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Your analyses</h1>
            <p className="results-muted">
              Past loan readiness reports from your uploads.
            </p>
          </div>
          <Link href="/upload" className="btn btn-primary">
            Upload new document
          </Link>
        </header>

        {analyses.length === 0 ? (
          <div className="dashboard-empty">
            <p className="results-muted">No analyses yet.</p>
            <Link href="/upload" className="btn btn-primary">
              Upload a document
            </Link>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Document type</th>
                  <th scope="col">Score</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((row) => {
                  const scoreTone = toneForScore(row.loan_readiness_score);
                  return (
                    <tr key={row.id}>
                      <td>{formatDate(row.created_at)}</td>
                      <td>{row.document_type}</td>
                      <td>
                        <span
                          className={`dashboard-score dashboard-score-${scoreTone}`}
                        >
                          {row.loan_readiness_score}
                        </span>
                      </td>
                      <td className="dashboard-table-action">
                        <Link href={`/results/${row.id}`}>View report</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
