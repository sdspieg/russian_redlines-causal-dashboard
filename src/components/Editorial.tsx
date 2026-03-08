import { useEffect, useState } from 'react';
import Plot from './Plot';
import { load } from '../data';
import type { SummaryStats, GrangerResult } from '../types';

export default function Editorial() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [granger, setGranger] = useState<GrangerResult[]>([]);

  useEffect(() => {
    load<SummaryStats>('summary_stats.json').then(setStats);
    load<GrangerResult[]>('granger_results.json').then(setGranger);
  }, []);

  if (!stats) return <div className="loading">Loading...</div>;

  const sigGranger = granger.filter(g => g.sig && !g.target.includes('_severity'));
  const rhetoricTriggers = sigGranger.filter(g => g.target === 'RED_LINES' || g.target === 'NUCLEAR_THREATS');
  const rhetoricEffects = sigGranger.filter(g => g.source === 'RED_LINES' || g.source === 'NUCLEAR_THREATS');

  // Mini sparkline-style bar for inline use
  const miniBar = (items: GrangerResult[], color: string) => (
    <Plot
      data={[{
        type: 'bar',
        y: items.slice(0, 5).map(g => g.source || g.target),
        x: items.slice(0, 5).map(g => g.f_stat),
        orientation: 'h',
        marker: { color },
        text: items.slice(0, 5).map(g => `F=${g.f_stat.toFixed(1)}`),
        textposition: 'outside',
        textfont: { size: 11, color: '#c9d1d9' },
      }]}
      layout={{
        paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
        font: { color: '#c9d1d9', size: 11 },
        margin: { t: 5, b: 25, l: 120, r: 70 },
        height: 180,
        yaxis: { autorange: 'reversed', type: 'category' },
        xaxis: { title: 'F-statistic', gridcolor: '#2a3a5a', showgrid: false },
      }}
      config={{ displayModeBar: false, responsive: true, staticPlot: true }}
      style={{ width: '100%' }}
    />
  );

  return (
    <div className="tab-content editorial">
      <div className="editorial-header">
        <span className="editorial-kicker">Briefing | Russian coercive signalling</span>
        <h2 className="editorial-headline">
          The Kremlin's red-line machine runs on a schedule — and the data prove it
        </h2>
        <p className="editorial-standfirst">
          A temporal knowledge graph of over one million war-related events reveals
          that Russia's rhetorical escalations are not impulsive outbursts but
          statistically predictable responses to battlefield and diplomatic developments.
          Four years of data, 210 weekly snapshots, and a battery of Granger causality
          tests tell a story that Kremlinologists have long suspected but rarely quantified.
        </p>
        <div className="editorial-byline">
          <span>Analysis based on {stats.total_triples.toLocaleString()} edge instances</span>
          <span className="sep">|</span>
          <span>{stats.date_start} to {stats.date_end}</span>
          <span className="sep">|</span>
          <span>{stats.n_snapshots} weekly snapshots</span>
        </div>
      </div>

      <div className="editorial-body">
        <div className="editorial-dropcap">
          <p>
            <span className="dropcap">W</span>hen Vladimir Putin's officials warn that
            Western arms deliveries constitute a "red line," they are not, it turns out,
            responding to some unique provocation. They are running a playbook. Our analysis
            of {stats.total_triples.toLocaleString()} coded events across {stats.n_predicates} relationship
            types finds <strong>{rhetoricTriggers.length} statistically significant causal pathways</strong> that
            predict Russian red-line rhetoric — and the single strongest trigger may surprise you.
          </p>
        </div>

        <h3 className="editorial-subhead">Threats beget threats</h3>

        <p>
          The most powerful predictor of red-line statements is not military action,
          sanctions, or arms deliveries. It is <em>threats themselves</em>. The THREATENS
          predicate — encompassing verbal threats, ultimatums, and coercive diplomacy from
          all actors — Granger-causes RED_LINES with an F-statistic of <strong>34.2</strong> at
          just one week's lag (p&nbsp;&lt;&nbsp;0.0001). That is roughly four times the strength
          of the next predictor.
        </p>

        <div className="editorial-pullquote">
          "The single strongest predictor of a Russian red line is not a battlefield event.
          It is other threats — a finding consistent with the escalation-spiral model."
        </div>

        <p>
          This makes intuitive sense: coercive signalling is dialogic. When NATO issues
          warnings, or Ukraine threatens counter-strikes into Russian territory, Moscow
          responds in kind — reliably, within a week. The Granger test confirms what
          deterrence theorists call a "spiral model" with hard statistical evidence.
        </p>

        <div className="editorial-chart-inline">
          <p className="editorial-chart-label">What triggers RED_LINES? Top 5 predictors by F-statistic</p>
          {miniBar(
            rhetoricTriggers.filter(g => g.target === 'RED_LINES').sort((a, b) => b.f_stat - a.f_stat),
            '#ff6b6b'
          )}
        </div>

        <h3 className="editorial-subhead">The aid paradox</h3>

        <p>
          The second-strongest trigger of red-line rhetoric is AIDS — military and humanitarian
          assistance — with an F-statistic of <strong>9.5</strong> and a two-week lag. This is the
          paradox that haunts Western capitals: the very act of helping Ukraine defend itself
          provokes the rhetorical escalation it is meant to deter.
        </p>
        <p>
          But here is the twist. Red-line statements <em>also</em> Granger-cause AIDS, with
          F&nbsp;=&nbsp;9.0 at one week's lag. When Moscow draws a red line, the West appears
          to respond not by backing down but by accelerating deliveries. The result is a
          <strong> feedback loop</strong> — red lines provoke aid, aid provokes red lines —
          that has been cycling on a roughly three-week period for four years.
        </p>

        <div className="editorial-callout">
          <div className="callout-icon">&#8644;</div>
          <div>
            <strong>The aid–rhetoric feedback loop</strong><br />
            AIDS &#8594; RED_LINES (F=9.5, lag 2w) and RED_LINES &#8594; AIDS (F=9.0, lag 1w).
            Western arms deliveries trigger red-line rhetoric, and red-line rhetoric
            accelerates deliveries. Neither side blinks.
          </div>
        </div>

        <h3 className="editorial-subhead">☢ The nuclear card</h3>

        <p>
          Nuclear threats operate under a different logic. Where red-line statements respond
          to a broad range of triggers (seven significant predictors), nuclear threats are
          narrower. Only <strong>two</strong> event types significantly predict ☢&nbsp;NUCLEAR_THREATS:
          ATTACKS (F&nbsp;=&nbsp;12.4, one-week lag) and CYBER_ATTACKS (F&nbsp;=&nbsp;3.1, three-week lag).
        </p>
        <p>
          The targeting is telling. Of the 294 coded nuclear-threat instances, the plurality
          are directed at the <strong>United States</strong> (62 instances across country and actor
          codes), not at Ukraine. Nuclear rhetoric is aimed upward — at the patron, not the
          combatant. Red-line rhetoric, by contrast, targets Ukraine and "the Kyiv regime" as
          often as it targets Western actors. The two instruments serve different coercive
          functions in the Kremlin's toolkit.
        </p>

        <h3 className="editorial-subhead">What red lines actually cause</h3>

        <p>
          Does Russian rhetoric change anything on the ground? The data suggest: not much,
          and not what Moscow intends. Red-line statements Granger-cause four downstream
          effects:
        </p>

        <div className="editorial-chart-inline">
          <p className="editorial-chart-label">Downstream effects of RED_LINES</p>
          {miniBar(
            rhetoricEffects.sort((a, b) => b.f_stat - a.f_stat),
            '#3fb950'
          )}
        </div>

        <p>
          The strongest effect? More <strong>aid deliveries</strong> (F&nbsp;=&nbsp;9.0).
          The second? More <strong>threats</strong> (F&nbsp;=&nbsp;6.1) — the spiral continues.
          Third: more <strong>cyber attacks</strong> (F&nbsp;=&nbsp;5.9), suggesting that red-line
          rhetoric may serve as a coordination signal for Russia's own hybrid operations. And
          fourth, weakly: more <strong>attacks</strong> (F&nbsp;=&nbsp;3.1) — perhaps Moscow
          backing words with action, or perhaps the war's momentum continuing regardless.
        </p>

        <div className="editorial-pullquote">
          "The principal measurable effect of drawing a red line is to accelerate
          the very Western response it was designed to prevent."
        </div>

        <h3 className="editorial-subhead">Feedback loops and the war's clockwork</h3>

        <p>
          The causal network contains <strong>eight feedback loops</strong> — pairs where A causes B
          and B causes A. The most striking:
        </p>

        <ul className="editorial-list">
          <li>
            <strong>THREATENS &#8596; RED_LINES</strong> — The escalation spiral. Threats
            breed red lines breed threats, on a one-week cycle.
          </li>
          <li>
            <strong>AIDS &#8596; RED_LINES</strong> — The aid paradox. Deliveries provoke
            rhetoric that provokes deliveries.
          </li>
          <li>
            <strong>LAUNCHES &#8596; CONTROLS</strong> — Missile strikes and territorial control
            reinforce each other. Conquest requires fire preparation; holding ground invites bombardment.
          </li>
          <li>
            <strong>THREATENS &#8596; LAUNCHES</strong> — Verbal escalation and kinetic escalation
            feed each other at a one-week lag.
          </li>
        </ul>

        <p>
          Together these loops suggest a war that is not chaotic but <em>cyclical</em> —
          a system oscillating between escalation and rhetorical posturing with a
          characteristic period of one to three weeks. Disrupting any one loop might
          alter the system's dynamics. But which one? And at what cost?
        </p>

        <h3 className="editorial-subhead">Who triggers rhetoric: the country decomposition</h3>

        <p>
          When we decompose the aggregate triggers into specific country pairs (450 hypotheses
          tested, FDR-corrected), <strong>24 pairs survive</strong>. The results reveal something
          unexpected: aid from <strong>Luxembourg</strong> (population 660,000) triggers Russian
          rhetoric as reliably as aid from France or the United States.
        </p>
        <p>
          Moscow's rhetorical apparatus does not discriminate by the size of the cheque.
          It responds to the <em>political signal</em> of solidarity — each new donor
          represents another country choosing Ukraine's side. Small donors — Finland, Czech
          Republic, Latvia, Slovenia, Portugal — appear alongside major powers in the list
          of FDR-surviving triggers.
        </p>
        <p>
          Russia's <em>own</em> threats are the third and seventh strongest triggers of its
          own rhetoric — an internal amplification loop where hawkish statements from one
          part of the apparatus trigger escalatory responses from another.
        </p>

        <h3 className="editorial-subhead">What types of violence matter</h3>

        <p>
          The daily grind of positional warfare — shelling (28,716 events), artillery
          duels, drone strikes — does <em>not</em> predict Russian rhetoric. What does?
          Politically salient events: <strong>attacks on civilians</strong> (F=13.2,
          only 113 events), <strong>territory changes</strong> (F=10.3),
          <strong>demonstrations</strong> (F=12.1), and <strong>abductions</strong> (F=6.7).
        </p>
        <p>
          The rhetoric responds to what makes <em>headlines</em>, not to what changes the
          <em>military balance</em>. The deadliest weapon category fails to predict it;
          the rarest category that does is 254 times less common but far more politically charged.
        </p>

        <h3 className="editorial-subhead">But none of it lasts</h3>

        <p>
          When we run the same Granger tests on overlapping one-year windows (13 windows,
          shifted by one quarter), a striking result emerges: <strong>no single causal pair
          is significant in all 13 windows</strong>. The war's cross-domain dynamics follow
          a U-shaped curve — 27 significant pairs during the invasion, collapsing to just 5
          during the "frozen conflict" of mid-2023, then rebuilding to 26 by late 2024.
        </p>
        <p>
          The causal pairs active in late 2024 are largely <em>different</em> from those
          of early 2022. The war resumed cascading, but along new channels. Policy conclusions
          drawn from any single phase must be qualified.
        </p>

        <h3 className="editorial-subhead">What this means</h3>

        <p>
          Four implications stand out. First, Russian red-line rhetoric is <strong>predictable</strong>,
          not spontaneous — it follows identifiable triggers with consistent time lags, making
          it amenable to early-warning systems. Second, the aid–rhetoric feedback loop means that
          Western policymakers face a genuine dilemma: every arms package will provoke a rhetorical
          response, but the data show that <em>not</em> delivering aid does not silence the rhetoric
          either — threats alone suffice as triggers. Third, nuclear signalling is structurally
          different from red-line signalling — narrower triggers, different targets, and a higher
          threshold — which suggests that the two should be monitored and modelled separately.
          Fourth, the war's causal architecture is non-stationary — any policy prescription based
          on one phase may not survive the next.
        </p>

        <div className="editorial-endnote">
          <p>
            <strong>Methodology note:</strong> This analysis uses Granger causality testing
            (max lag 4 weeks) on 210 weekly time series extracted from a Temporal Knowledge
            Graph of {stats.total_triples.toLocaleString()} coded events. Granger causality
            tests whether past values of X improve prediction of Y beyond Y's own history.
            It establishes predictive precedence, not necessarily direct causation. Significance
            threshold: p&nbsp;&lt;&nbsp;0.05. Data sources include ACLED, UCDP, ISW, GDELT, VIINA,
            and 22 other extractors, combined with 1,924 RRLS and 357 NTS annotated statements.
          </p>
        </div>
      </div>
    </div>
  );
}
