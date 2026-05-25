"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const BUSINESS_TYPES = [
  "LLC",
  "Sole Proprietor",
  "Corporation",
  "Partnership",
] as const;

const INDUSTRIES = [
  "Construction",
  "Retail",
  "Restaurant",
  "Food & Beverage",
  "Healthcare",
  "Professional Services",
  "Transportation",
  "Manufacturing",
  "Real Estate",
  "Other",
] as const;

const ANNUAL_REVENUE_OPTIONS = [
  { value: 0, label: "Under $5k/yr" },
  { value: 60000, label: "$5k-$15k/yr" },
  { value: 180000, label: "$15k-$30k/yr" },
  { value: 360000, label: "$30k-$75k/yr" },
  { value: 900000, label: "$75k-$150k/yr" },
  { value: 1800000, label: "Over $150k/yr" },
] as const;

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessType, setBusinessType] =
    useState<(typeof BUSINESS_TYPES)[number]>("LLC");
  const [industry, setIndustry] =
    useState<(typeof INDUSTRIES)[number]>("Professional Services");
  const [yearsInBusiness, setYearsInBusiness] = useState("0");
  const [annualRevenue, setAnnualRevenue] = useState(
    String(ANNUAL_REVENUE_OPTIONS[0].value),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Business name is required.");
      return;
    }

    const years = Number.parseInt(yearsInBusiness, 10);
    if (!Number.isFinite(years) || years < 0 || years > 100) {
      setError("Years in business must be between 0 and 100.");
      return;
    }

    const revenue = Number.parseInt(annualRevenue, 10);
    if (!Number.isFinite(revenue)) {
      setError("Please select an annual revenue estimate.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          business_type: businessType,
          industry,
          years_in_business: years,
          annual_revenue: revenue,
        }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save your business profile.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="onboarding-form" onSubmit={onSubmit}>
      <label className="field-label" htmlFor="business-name">
        Business name
      </label>
      <input
        id="business-name"
        type="text"
        className="onboarding-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoComplete="organization"
      />

      <label className="field-label" htmlFor="business-type">
        Business type
      </label>
      <select
        id="business-type"
        className="select-field"
        value={businessType}
        onChange={(e) =>
          setBusinessType(e.target.value as (typeof BUSINESS_TYPES)[number])
        }
      >
        {BUSINESS_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="industry">
        Industry
      </label>
      <select
        id="industry"
        className="select-field"
        value={industry}
        onChange={(e) =>
          setIndustry(e.target.value as (typeof INDUSTRIES)[number])
        }
      >
        {INDUSTRIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="years-in-business">
        Years in business
      </label>
      <input
        id="years-in-business"
        type="number"
        className="onboarding-input"
        min={0}
        max={100}
        value={yearsInBusiness}
        onChange={(e) => setYearsInBusiness(e.target.value)}
        required
      />

      <label className="field-label" htmlFor="annual-revenue">
        Annual revenue estimate
      </label>
      <select
        id="annual-revenue"
        className="select-field"
        value={annualRevenue}
        onChange={(e) => setAnnualRevenue(e.target.value)}
      >
        {ANNUAL_REVENUE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? <p className="form-error">{error}</p> : null}

      <button
        type="submit"
        className="btn btn-primary onboarding-submit"
        disabled={submitting}
      >
        {submitting ? "Saving…" : "Continue to dashboard"}
      </button>
    </form>
  );
}
