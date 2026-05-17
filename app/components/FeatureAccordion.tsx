"use client";

import { useId, useState } from "react";

type FeatureAccordionProps = {
  title: string;
  description: string;
  example: string;
};

export function FeatureAccordion({
  title,
  description,
  example,
}: FeatureAccordionProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className="landing-card landing-feature-card">
      <h3 className="landing-card-title">{title}</h3>
      <p className="landing-card-body">{description}</p>
      <button
        type="button"
        className="landing-accordion-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        See an example
      </button>
      {open ? (
        <p id={panelId} className="landing-accordion-example">
          {example}
        </p>
      ) : null}
    </article>
  );
}
