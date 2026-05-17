"use client";

import { useMemo, useState } from "react";

import type { DebtLoad, RevenueTrend } from "@/lib/analysis-types";

export type WhatIfSimulatorProps = {
  baseScore: number;
  baseDscr: number | null;
  baseDebtLoad: DebtLoad;
  baseRevenueTrend: RevenueTrend;
};

type Tone = "good" | "warn" | "bad";

function toneForScore(score: number): Tone {
  if (score >= 70) return "good";
  if (score >= 40) return "warn";
  return "bad";
}

function toneForRevenue(t: RevenueTrend): Tone {
  if (t === "growing") return "good";
  if (t === "flat") return "warn";
  return "bad";
}

function toneForDebt(d: DebtLoad): Tone {
  if (d === "low") return "good";
  if (d === "moderate") return "warn";
  return "bad";
}

function upgradeDebtLoad(load: DebtLoad): DebtLoad {
  if (load === "high") return "moderate";
  if (load === "moderate") return "low";
  return load;
}

function upgradeRevenueTrend(trend: RevenueTrend): RevenueTrend {
  if (trend === "declining") return "flat";
  if (trend === "flat") return "growing";
  return trend;
}

function simulate(
  baseScore: number,
  baseDebtLoad: DebtLoad,
  baseRevenueTrend: RevenueTrend,
  debtReductionPct: number,
  revenueGrowthPct: number,
) {
  const debtBonus = Math.min(20, Math.floor(debtReductionPct / 10) * 3);
  const revenueBonus = Math.min(20, Math.floor(revenueGrowthPct / 10) * 4);
  const score = Math.min(100, baseScore + debtBonus + revenueBonus);

  let debtLoad = baseDebtLoad;
  if (debtReductionPct >= 50) {
    debtLoad = upgradeDebtLoad(debtLoad);
  }

  let revenueTrend = baseRevenueTrend;
  if (revenueGrowthPct >= 20) {
    revenueTrend = upgradeRevenueTrend(revenueTrend);
  }

  return { score, debtLoad, revenueTrend };
}

function SimulatorBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span className={`dashboard-badge dashboard-badge-${tone}`}>{label}</span>
  );
}

export function WhatIfSimulator({
  baseScore,
  baseDscr: _baseDscr,
  baseDebtLoad,
  baseRevenueTrend,
}: WhatIfSimulatorProps) {
  const [debtReduction, setDebtReduction] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);

  const { score, debtLoad, revenueTrend } = useMemo(
    () =>
      simulate(
        baseScore,
        baseDebtLoad,
        baseRevenueTrend,
        debtReduction,
        revenueGrowth,
      ),
    [baseScore, baseDebtLoad, baseRevenueTrend, debtReduction, revenueGrowth],
  );

  const delta = score - baseScore;
  const scoreTone = toneForScore(score);

  return (
    <section className="results-section whatif-simulator">
      <h2 className="results-heading">What if?</h2>
      <p className="results-muted whatif-lede">
        Adjust debt and revenue assumptions to see how your loan readiness score
        could change.
      </p>

      <div className="whatif-sliders">
        <label className="whatif-slider-field">
          <span className="whatif-slider-label">
            Reduce monthly debt payments by {debtReduction}%
          </span>
          <input
            type="range"
            className="whatif-slider"
            min={0}
            max={100}
            step={1}
            value={debtReduction}
            onChange={(e) => setDebtReduction(Number(e.target.value))}
          />
        </label>

        <label className="whatif-slider-field">
          <span className="whatif-slider-label">
            Increase monthly revenue by {revenueGrowth}%
          </span>
          <input
            type="range"
            className="whatif-slider"
            min={0}
            max={50}
            step={1}
            value={revenueGrowth}
            onChange={(e) => setRevenueGrowth(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="whatif-outcome">
        <p className="results-hero-label">Simulated loan readiness score</p>
        <div className={`results-score results-score-${scoreTone}`}>
          {score}
        </div>
        <p className="whatif-delta">
          {delta === 0 ? "No change" : `+${delta} points`}
        </p>
        <div className="dashboard-card-badges">
          <SimulatorBadge
            label={`Revenue: ${revenueTrend}`}
            tone={toneForRevenue(revenueTrend)}
          />
          <SimulatorBadge
            label={`Debt: ${debtLoad}`}
            tone={toneForDebt(debtLoad)}
          />
        </div>
      </div>
    </section>
  );
}
