import { useEffect, useState, useMemo } from 'react';
import Plot from './Plot';
import ChartInfo from './ChartInfo';
import { load } from '../data';
import type { CountryTriggersData, CountryTrigger } from '../types';

const COUNTRY_NAMES: Record<string, string> = {
  RUS: 'Russia', UKR: 'Ukraine', USA: 'United States', GBR: 'United Kingdom',
  CAN: 'Canada', NOR: 'Norway', FIN: 'Finland', CZE: 'Czech Republic',
  LUX: 'Luxembourg', LVA: 'Latvia', SVN: 'Slovenia', PRT: 'Portugal',
  FRA: 'France', AUT: 'Austria', CHE: 'Switzerland', ARM: 'Armenia',
};

function cn(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

const PRED_LABELS: Record<string, string> = {
  THREATENS: 'threatens', ATTACKS: 'attacks', AIDS: 'aids',
  SANCTIONS: 'sanctions', LAUNCHES: 'launches', CONTROLS: 'controls',
  DISINFORMS: 'disinforms', CYBER_ATTACKS: 'cyber-attacks', ARMS: 'arms',
  DISPLACES: 'displaces', TRADES_FOSSIL: 'trades fossil',
};

function barLabel(t: CountryTrigger): string {
  const verb = PRED_LABELS[t.predicate] || t.predicate.toLowerCase();
  if (t.target_country) return `${cn(t.source_country)} ${verb} ${cn(t.target_country)}`;
  return `${cn(t.source_country)} ${verb}`;
}

export default function CountryTriggers() {
  const [data, setData] = useState<CountryTriggersData | null>(null);
  const [category, setCategory] = useState<'all' | 'threats' | 'aid' | 'attacks'>('all');

  useEffect(() => {
    load<CountryTriggersData>('country_triggers.json').then(setData);
  }, []);

  const allTriggers = useMemo(() => {
    if (!data) return [];
    const items = [
      ...data.threats,
      ...data.aid,
      ...data.attacks,
      ...data.other,
    ];
    if (category === 'threats') return data.threats;
    if (category === 'aid') return data.aid;
    if (category === 'attacks') return [...data.attacks, ...data.other];
    return items;
  }, [data, category]);

  const sorted = useMemo(() => [...allTriggers].sort((a, b) => b.f_stat - a.f_stat), [allTriggers]);

  if (!data) return <div className="loading">Loading...</div>;

  // Split by rhetoric target
  const redLineTriggers = sorted.filter(t => t.rhetoric_target === 'RED_LINES');
  const nuclearTriggers = sorted.filter(t => t.rhetoric_target === 'NUCLEAR_THREATS');

  const catColor = (t: CountryTrigger) => {
    if (data.threats.includes(t)) return '#58a6ff';
    if (data.aid.includes(t)) return '#3fb950';
    if (data.attacks.includes(t)) return '#ff4444';
    return '#ffa657';
  };

  return (
    <div className="tab-content">
      <h2>Country-Specific Triggers</h2>
      <p className="subtitle">
        Which countries' actions predict Russian rhetoric? {data.fdr_surviving} pairs survive
        FDR correction (Benjamini-Hochberg, {data.total_tests} tests, &alpha;=0.05).
      </p>

      <div className="controls">
        <div className="toggle-row">
          <span className="label">Category:</span>
          {(['all', 'threats', 'aid', 'attacks'] as const).map(c => (
            <button
              key={c}
              className={`btn-sm ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? 'All' : c === 'threats' ? 'Diplomatic Threats' : c === 'aid' ? 'Military Aid' : 'Attacks & Other'}
            </button>
          ))}
        </div>
        <div className="legend-row">
          <span style={{ color: '#58a6ff' }}>&#9632; Threats</span>
          <span style={{ color: '#3fb950' }}>&#9632; Aid</span>
          <span style={{ color: '#ff4444' }}>&#9632; Attacks</span>
          <span style={{ color: '#ffa657' }}>&#9632; Other</span>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Triggers of RED_LINES ({redLineTriggers.length} pairs)</h4>
            <ChartInfo title="Country Triggers → RED_LINES" description="Country-specific actions that Granger-cause Russian red-line rhetoric, after FDR correction for multiple testing. Bar color indicates action type: blue=threats, green=aid, red=attacks. F-statistic measures predictive strength. All pairs survive Benjamini-Hochberg correction at alpha=0.05." />
          </div>
          {redLineTriggers.length > 0 ? (
            <Plot
              data={[{
                type: 'bar',
                y: redLineTriggers.map(barLabel),
                x: redLineTriggers.map(t => t.f_stat),
                orientation: 'h',
                marker: { color: redLineTriggers.map(catColor) },
                text: redLineTriggers.map(t => {
                  const stars = t.p_value < 0.001 ? '***' : t.p_value < 0.01 ? '**' : '*';
                  return `F=${t.f_stat.toFixed(1)} ${stars} (${t.lag}w)`;
                }),
                textposition: 'auto',
                textfont: { size: 10, color: '#fff' },
                insidetextanchor: 'start',
                hovertext: redLineTriggers.map(t =>
                  `${barLabel(t)}\nF=${t.f_stat.toFixed(1)}, p=${t.p_value.toFixed(4)}\nLag: ${t.lag} week(s)${t.note ? '\n' + t.note : ''}`
                ),
                hoverinfo: 'text',
              }]}
              layout={{
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                font: { color: '#e0e0e0' },
                margin: { t: 10, b: 30, l: 180, r: 160 },
                height: Math.max(250, redLineTriggers.length * 35 + 60),
                yaxis: { autorange: 'reversed', type: 'category' },
                xaxis: { title: 'F-statistic', gridcolor: '#2a3a5a' },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="no-data">No RED_LINES triggers in this category.</p>
          )}
        </div>

        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Triggers of NUCLEAR_THREATS ({nuclearTriggers.length} pairs)</h4>
            <ChartInfo title="Country Triggers → NUCLEAR_THREATS" description="Country-specific actions that Granger-cause Russian nuclear threat rhetoric. Nuclear threats have a narrower trigger set: primarily Ukrainian attacks on Russian territory and Norwegian threats (Arctic flank + energy). F-statistic measures predictive strength." />
          </div>
          {nuclearTriggers.length > 0 ? (
            <Plot
              data={[{
                type: 'bar',
                y: nuclearTriggers.map(barLabel),
                x: nuclearTriggers.map(t => t.f_stat),
                orientation: 'h',
                marker: { color: nuclearTriggers.map(catColor) },
                text: nuclearTriggers.map(t => {
                  const stars = t.p_value < 0.001 ? '***' : t.p_value < 0.01 ? '**' : '*';
                  return `F=${t.f_stat.toFixed(1)} ${stars} (${t.lag}w)`;
                }),
                textposition: 'auto',
                textfont: { size: 10, color: '#fff' },
                insidetextanchor: 'start',
                hovertext: nuclearTriggers.map(t =>
                  `${barLabel(t)}\nF=${t.f_stat.toFixed(1)}, p=${t.p_value.toFixed(4)}\nLag: ${t.lag} week(s)${t.note ? '\n' + t.note : ''}`
                ),
                hoverinfo: 'text',
              }]}
              layout={{
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                font: { color: '#e0e0e0' },
                margin: { t: 10, b: 30, l: 180, r: 160 },
                height: Math.max(200, nuclearTriggers.length * 45 + 60),
                yaxis: { autorange: 'reversed', type: 'category' },
                xaxis: { title: 'F-statistic', gridcolor: '#2a3a5a' },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="no-data">No NUCLEAR_THREATS triggers in this category.</p>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>Key Insight: Coalition Breadth Matters</h4>
          </div>
          <div className="findings" style={{ maxWidth: 900 }}>
            <div className="finding-section">
              <p style={{ color: '#c9d1d9', lineHeight: 1.7, fontSize: 14 }}>
                Aid from <strong style={{ color: '#3fb950' }}>Luxembourg</strong> (pop. 660,000)
                triggers Russian rhetoric as reliably as aid from <strong style={{ color: '#3fb950' }}>France</strong>.
                Moscow's rhetorical apparatus does not discriminate by cheque size — it responds to the
                <em> political signal</em> of solidarity. Each new donor is another country choosing Ukraine's side.
              </p>
              <p style={{ color: '#c9d1d9', lineHeight: 1.7, fontSize: 14, marginTop: 12 }}>
                Russia's <strong style={{ color: '#58a6ff' }}>own threats</strong> are the 3rd and 7th
                strongest triggers of its own rhetoric — an internal amplification loop where hawkish statements
                from one part of the apparatus trigger escalatory responses from another.
              </p>
              <p style={{ color: '#c9d1d9', lineHeight: 1.7, fontSize: 14, marginTop: 12 }}>
                <strong style={{ color: '#ffd700' }}>Norway</strong> uniquely triggers <em>nuclear</em> rhetoric
                (not just red lines), reflecting its dual role as NATO's Arctic flank and Europe's replacement
                energy supplier after Nord Stream.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
