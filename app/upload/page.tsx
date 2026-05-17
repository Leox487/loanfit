import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <main className="upload-page">
      <div className="upload-page-inner">
        <h1 className="page-title">Upload financials</h1>
        <p className="page-lede">
          Upload up to three PDFs — bank statement, profit &amp; loss, and tax
          return — for a cross-referenced SBA-style loan readiness analysis.
        </p>
        <UploadForm />
      </div>
    </main>
  );
}
