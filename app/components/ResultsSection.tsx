"use client";

import { type ReactNode, useId, useState } from "react";

type ResultsSectionProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  action?: ReactNode;
};

export function ResultsSection({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  action,
}: ResultsSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const panelId = useId();

  return (
    <section className="results-group">
      <div className="results-group-header">
        <button
          type="button"
          className="results-group-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span className="results-group-heading-text">
            <span className="results-group-title">{title}</span>
            <span className="results-group-subtitle">{subtitle}</span>
          </span>
          <span
            className={`results-group-chevron${expanded ? " results-group-chevron-open" : ""}`}
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
        {action ? (
          <div className="results-group-action">{action}</div>
        ) : null}
      </div>
      {expanded ? <div id={panelId}>{children}</div> : null}
    </section>
  );
}
