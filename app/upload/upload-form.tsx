"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type SlotKey = "bankStatement" | "profitLoss" | "taxReturn";

const SLOTS: {
  key: SlotKey;
  label: string;
  required: boolean;
}[] = [
  { key: "bankStatement", label: "Bank Statement", required: true },
  { key: "profitLoss", label: "Profit & Loss", required: false },
  { key: "taxReturn", label: "Tax Return", required: false },
];

type SlotFiles = Record<SlotKey, File | null>;

const EMPTY_SLOTS: SlotFiles = {
  bankStatement: null,
  profitLoss: null,
  taxReturn: null,
};

function UploadSlot({
  slotKey,
  label,
  required,
  file,
  onPick,
  onClear,
  onInvalid,
}: {
  slotKey: SlotKey;
  label: string;
  required: boolean;
  file: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
  onInvalid: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = `upload-${slotKey}`;

  const handleChange = (f: File | undefined | null) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      onInvalid("Please choose a PDF file.");
      return;
    }
    onPick(f);
  };

  return (
    <div className={`upload-slot ${file ? "upload-slot-filled" : ""}`}>
      <div className="upload-slot-header">
        <label className="upload-slot-label" htmlFor={inputId}>
          {label}
          {required ? (
            <span className="upload-slot-required"> (required)</span>
          ) : (
            <span className="upload-slot-optional"> (optional)</span>
          )}
        </label>
        {file ? (
          <span className="upload-slot-check" aria-hidden>
            ✓
          </span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf"
        className="upload-slot-input"
        onChange={(e) => handleChange(e.target.files?.[0])}
      />

      {file ? (
        <div className="upload-slot-body">
          <span className="upload-slot-filename">{file.name}</span>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => {
              onClear();
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="upload-slot-body">
          <p className="upload-slot-hint">PDF only · max 15MB</p>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </button>
        </div>
      )}
    </div>
  );
}

export function UploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<SlotFiles>(EMPTY_SLOTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBankStatement = files.bankStatement !== null;
  const filledCount = Object.values(files).filter(Boolean).length;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasBankStatement || submitting) return;

    setSubmitting(true);
    setError(null);

    const body = new FormData();
    if (files.bankStatement) body.set("bankStatement", files.bankStatement);
    if (files.profitLoss) body.set("profitLoss", files.profitLoss);
    if (files.taxReturn) body.set("taxReturn", files.taxReturn);

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
      <div className="upload-slots">
        {SLOTS.map((slot) => (
          <UploadSlot
            key={slot.key}
            slotKey={slot.key}
            label={slot.label}
            required={slot.required}
            file={files[slot.key]}
            onPick={(f) => {
              setError(null);
              setFiles((prev) => ({ ...prev, [slot.key]: f }));
            }}
            onClear={() => {
              setFiles((prev) => ({ ...prev, [slot.key]: null }));
            }}
            onInvalid={setError}
          />
        ))}
      </div>

      <p className="upload-multi-note">
        Upload more documents for a more accurate analysis. SBA lenders
        cross-reference all three.
      </p>

      {error ? <p className="form-error">{error}</p> : null}

      <button
        type="submit"
        className="btn btn-primary upload-submit"
        disabled={!hasBankStatement || submitting}
      >
        {submitting
          ? "Analyzing…"
          : `Analyze all documents${filledCount > 0 ? ` (${filledCount})` : ""}`}
      </button>
    </form>
  );
}
