import { useState } from 'react';

export default function MethodologyModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="methodology-btn" onClick={() => setOpen(true)} title="About this dashboard">
        About &amp; Methodology
      </button>
      {open && (
        <div className="chart-info-overlay" onClick={() => setOpen(false)}>
          <div className="methodology-modal" onClick={e => e.stopPropagation()}>
            <h2>Causal Analysis Dashboard — Methodology</h2>

            <h3>Temporal Knowledge Graph</h3>
            <p>
              This dashboard visualizes causal relationships between war events and Russian
              rhetoric, derived from a Temporal Knowledge Graph (TKG) with 210 weekly snapshots
              spanning February 2022 to March 2026. The TKG contains 1.05 million edge instances
              across 13 predicates (ATTACKS, THREATENS, SANCTIONS, AIDS, TRADES_FOSSIL, CONTROLS,
              LAUNCHES, DISPLACES, CYBER_ATTACKS, DISINFORMS, ARMS, RED_LINES, NUCLEAR_THREATS).
            </p>

            <h3>Data Sources</h3>
            <ul>
              <li><strong>War events:</strong> ACLED, UCDP, ISW, GDELT, VIINA, Bellingcat, and other conflict monitoring databases (27 extractors total)</li>
              <li><strong>Red Line Statements (RRLS):</strong> 1,924 annotated statements from Russian government communications, state media, and diplomatic sources</li>
              <li><strong>Nuclear Threat Statements (NTS):</strong> 357 annotated nuclear threat statements</li>
              <li><strong>Economic data:</strong> Kiel aid tracker, CREA fossil fuel trade, SIPRI military expenditure, World Bank</li>
            </ul>

            <h3>Granger Causality</h3>
            <p>
              Granger causality tests whether past values of predicate X improve prediction of
              predicate Y beyond Y's own history. Tests are run with maximum lag of 4 weeks.
              F-statistics and p-values are reported; significance threshold is p &lt; 0.05.
              Severity-weighted analysis uses the sum of severity scores from edge attributes.
            </p>

            <h3>Cross-Correlations</h3>
            <p>
              Lag-8 cross-correlations show the Pearson correlation between two predicates at
              different time offsets. Positive lags mean the first predicate leads; negative lags
              mean it follows. Dashed lines show the 95% confidence interval (1.96/sqrt(N)).
            </p>

            <h3>Causal Network</h3>
            <p>
              The directed graph shows significant Granger-causal relationships. Arrow width is
              proportional to the F-statistic. Red arrows indicate triggers of rhetoric;
              green arrows indicate downstream effects of rhetoric.
            </p>

            <button className="chart-info-close" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
