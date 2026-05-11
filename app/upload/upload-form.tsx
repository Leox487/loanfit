"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

const DOC_TYPES = [
  "Bank Statement",
  "Profit & Loss",
  "Tax Return",
] as const;

export function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<(typeof DOC_TYPES)[number]>("Bank Statement");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = useCallback((f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Please choose a PDF file.");
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      pickFile(e.dataTransfer.files?.[0]);
    },
    [pickFile],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    body.set("documentType", documentType);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Analysis failed.");
        return;
      }
      if (!data.id) {
        setError("Missing analysis id in response.");
        return;
      }
      router.push(`/results/${data.id}`);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={onSubmit}>
      <label className="field-label" htmlFor="document-type">
        Document type
      </label>
      <select
        id="document-type"
        className="select-field"
        value={documentType}
        onChange={(e) =>
          setDocumentType(e.target.value as (typeof DOC_TYPES)[number])
        }
      >
        {DOC_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <p className="field-label">PDF file</p>
      <div
        className={`drop-zone ${dragActive ? "drop-zone-active" : ""} ${file ? "drop-zone-filled" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        role="presentation"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="drop-zone-input"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {file ? (
          <div className="drop-zone-body">
            <span className="drop-zone-filename">{file.name}</span>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="drop-zone-body">
            <p className="drop-zone-title">Drop your PDF here</p>
            <p className="drop-zone-hint">
              Bank statement, P&amp;L, or tax return · max 15MB
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => inputRef.current?.click()}
            >
              Browse files
            </button>
          </div>
        )}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button
        type="submit"
        className="btn btn-primary upload-submit"
        disabled={!file || submitting}
      >
        {submitting ? "Analyzing…" : "Analyze with AI"}
      </button>
    </form>
  );
}
