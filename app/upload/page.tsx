import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <main className="upload-page">
      <div className="upload-page-inner">
        <h1 className="page-title">Upload financials</h1>
        <p className="page-lede">
          Add a PDF (bank statement, profit &amp; loss, or tax return). We&apos;ll
          score loan readiness against typical SBA underwriting criteria.
        </p>
        <UploadForm />
      </div>
    </main>
  );
}
