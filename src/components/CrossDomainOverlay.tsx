import { useEffect, useState, useMemo } from 'react';
import Plot from './Plot';
import ChartInfo from './ChartInfo';
import { load } from '../data';
import type { PredicateTimeseries, RRLSStatement, NTSStatement } from '../types';
import { predColor } from '../colors';

const EVENT_PREDS = ['ATTACKS', 'THREATENS', 'SANCTIONS', 'AIDS', 'TRADES_FOSSIL',
  'CONTROLS', 'LAUNCHES', 'DISPLACES', 'CYBER_ATTACKS', 'DISINFORMS', 'ARMS'];

// TKG date range — filter rhetoric to match
const TKG_START = '2022-02';

// Map string intensities to numeric values
const RRLS_LINE_INTENSITY: Record<string, number> = { Low: 1, Moderate: 2, High: 3, 'Very High': 4 };
const RRLS_THREAT_INTENSITY: Record<string, number> = { Low: 1, Moderate: 2, High: 3, 'Very High': 4 };

function rrlsIntensity(s: RRLSStatement): number {
  const li = RRLS_LINE_INTENSITY[(s as any).line_intensity] || 2;
  const ti = RRLS_THREAT_INTENSITY[(s as any).threat_intensity] || 2;
  return (li + ti) / 2; // 1-4 scale
}

const NTS_TONE: Record<string, number> = {
  'Firm (Level 2)': 2, 'Aggressive (Level 3)': 3,
  'Belligerent (Level 4)': 4, 'Apocalyptic (Level 5)': 5,
};
const NTS_COND: Record<string, number> = {
  'Conditional (Level 1)': 1, 'Situational (Level 2)': 2,
  'Implicit Condition (Level 3)': 3, 'Unconditional (Level 4)': 4,
};
const NTS_CONS: Record<string, number> = {
  'Significant (Level 3)': 3, 'Severe (Level 4)': 4, 'Catastrophic (Level 5)': 5,
};

function ntsIntensity(s: NTSStatement): number {
  const t = NTS_TONE[(s as any).tone] || 2;
  const c = NTS_COND[(s as any).conditionality] || 1;
  const q = NTS_CONS[(s as any).consequences] || 3;
  return (t + c + q) / 3; // ~1-5 scale, normalize to 1-4 for comparability
}

type ChartMode = 'bars_bubbles' | 'dual_axis' | 'normalized';

export default function CrossDomainOverlay() {
  const [ts, setTs] = useState<PredicateTimeseries | null>(null);
  const [rrls, setRrls] = useState<RRLSStatement[]>([]);
  const [nts, setNts] = useState<NTSStatement[]>([]);
  const [eventPred, setEventPred] = useState('AIDS');
  const [chartMode, setChartMode] = useState<ChartMode>('bars_bubbles');
  const [showRRLS, setShowRRLS] = useState(true);
  const [showNTS, setShowNTS] = useState(true);

  useEffect(() => {
    load<PredicateTimeseries>('predicate_timeseries.json').then(setTs);
    load<RRLSStatement[]>('rrls_statements.json').then(setRrls);
    load<NTSStatement[]>('nts_statements.json').then(setNts);
  }, []);

  // Aggregate RRLS/NTS by month — intensity for Y, confidence for alpha
  const rrlsByMonth = useMemo(() => {
    const byM: Record<string, { count: number; totalConf: number; totalIntensity: number }> = {};
    for (const s of rrls) {
      if (!s.date) continue;
      const m = s.date.slice(0, 7);
      if (m < TKG_START) continue;
      if (!byM[m]) byM[m] = { count: 0, totalConf: 0, totalIntensity: 0 };
      byM[m].count++;
      byM[m].totalConf += s.overall_confidence || 0;
      byM[m].totalIntensity += rrlsIntensity(s);
    }
    return Object.entries(byM).map(([month, v]) => ({
      month,
      count: v.count,
      avgConf: v.count > 0 ? v.totalConf / v.count / 10 : 0, // normalize to 0-1
      avgIntensity: v.count > 0 ? v.totalIntensity / v.count : 0, // 1-4 scale
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [rrls]);

  const ntsByMonth = useMemo(() => {
    const byM: Record<string, { count: number; totalConf: number; totalIntensity: number }> = {};
    for (const s of nts) {
      if (!s.date) continue;
      const m = s.date.slice(0, 7);
      if (m < TKG_START) continue;
      if (!byM[m]) byM[m] = { count: 0, totalConf: 0, totalIntensity: 0 };
      byM[m].count++;
      byM[m].totalConf += s.overall_confidence || 0;
      byM[m].totalIntensity += ntsIntensity(s);
    }
    return Object.entries(byM).map(([month, v]) => ({
      month,
      count: v.count,
      avgConf: v.count > 0 ? v.totalConf / v.count / 10 : 0,
      avgIntensity: v.count > 0 ? v.totalIntensity / v.count : 0, // ~1-5 scale
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [nts]);

  // Aggregate event predicate by month from weekly snapshots
  const eventByMonth = useMemo(() => {
    if (!ts) return [];
    const byM: Record<string, number> = {};
    for (let i = 0; i < ts.dates.length; i++) {
      const m = ts.dates[i].slice(0, 7);
      byM[m] = (byM[m] || 0) + (ts.predicates[eventPred]?.[i] || 0);
    }
    return Object.entries(byM)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [ts, eventPred]);

  const totalEvent = eventByMonth.reduce((s, r) => s + r.count, 0);
  const totalRRLS = rrlsByMonth.reduce((s, r) => s + r.count, 0);
  const totalNTS = ntsByMonth.reduce((s, r) => s + r.count, 0);

  const traces = useMemo(() => {
    const out: any[] = [];

    if (chartMode === 'bars_bubbles') {
      // Green bars for event predicate
      out.push({
        type: 'bar',
        name: `${eventPred} (${totalEvent.toLocaleString()} total)`,
        x: eventByMonth.map(r => r.month),
        y: eventByMonth.map(r => r.count),
        marker: { color: '#00FF9D', opacity: 0.7 },
        yaxis: 'y',
      });

      // RRLS bubbles — size=count, Y=intensity, alpha=confidence
      if (showRRLS && rrlsByMonth.length > 0) {
        const maxCount = Math.max(...rrlsByMonth.map(r => r.count), 1);
        out.push({
          type: 'scatter', mode: 'markers',
          name: `RRLS (${totalRRLS})`,
          x: rrlsByMonth.map(r => r.month),
          y: rrlsByMonth.map(r => r.avgIntensity),
          marker: {
            size: rrlsByMonth.map(r => 10 + (r.count / maxCount) * 35),
            color: rrlsByMonth.map(r => {
              const a = 0.35 + r.avgConf * 0.65;
              return `rgba(255, 68, 68, ${a})`;
            }),
            line: { color: '#ff4444', width: 1 },
          },
          yaxis: 'y2',
          hoverlabel: { bgcolor: '#2a1520', bordercolor: '#ff4444', font: { color: '#f0f0f0', size: 13 } },
          hovertext: rrlsByMonth.map(r =>
            `<b>${r.month}</b><br>` +
            `RRLS count: <b>${r.count}</b><br>` +
            `Avg intensity: <b>${r.avgIntensity.toFixed(2)}</b> (1–4 scale)<br>` +
            `Avg confidence: <b>${(r.avgConf * 100).toFixed(0)}%</b>`
          ),
          hoverinfo: 'text',
        });
      }

      // NTS ☢ markers — Y=intensity, alpha=confidence
      if (showNTS && ntsByMonth.length > 0) {
        const maxCount = Math.max(...ntsByMonth.map(r => r.count), 1);
        out.push({
          type: 'scatter', mode: 'text',
          name: `NTS (${totalNTS})`,
          x: ntsByMonth.map(r => r.month),
          y: ntsByMonth.map(r => r.avgIntensity),
          text: ntsByMonth.map(() => '☢'),
          textfont: {
            size: ntsByMonth.map(r => 14 + (r.count / maxCount) * 20),
            color: ntsByMonth.map(r => {
              const a = 0.35 + r.avgConf * 0.65;
              return `rgba(255, 215, 0, ${a})`;
            }),
          },
          yaxis: 'y2',
          hoverlabel: { bgcolor: '#2a2510', bordercolor: '#ffd700', font: { color: '#f0f0f0', size: 13 } },
          hovertext: ntsByMonth.map(r =>
            `<b>${r.month}</b><br>` +
            `NTS count: <b>${r.count}</b><br>` +
            `Avg intensity: <b>${r.avgIntensity.toFixed(2)}</b> (tone/cond/conseq)<br>` +
            `Avg confidence: <b>${(r.avgConf * 100).toFixed(0)}%</b>`
          ),
          hoverinfo: 'text',
        });
      }
    } else if (chartMode === 'dual_axis') {
      out.push({
        type: 'scatter', mode: 'lines+markers',
        name: eventPred,
        x: eventByMonth.map(r => r.month),
        y: eventByMonth.map(r => r.count),
        line: { color: predColor(eventPred), width: 2 },
        marker: { size: 4 },
      });
      if (showRRLS) {
        out.push({
          type: 'scatter', mode: 'lines+markers',
          name: 'RED_LINES',
          x: rrlsByMonth.map(r => r.month),
          y: rrlsByMonth.map(r => r.count),
          line: { color: '#ff4444', width: 2 },
          marker: { size: 4 },
          yaxis: 'y2',
        });
      }
      if (showNTS) {
        out.push({
          type: 'scatter', mode: 'lines+text',
          name: 'NUCLEAR_THREATS ☢',
          x: ntsByMonth.map(r => r.month),
          y: ntsByMonth.map(r => r.count),
          line: { color: '#ffd700', width: 2 },
          text: ntsByMonth.map(() => '☢'),
          textposition: 'top center',
          textfont: { size: 12, color: '#ffd700' },
          yaxis: 'y2',
        });
      }
    } else {
      // Normalized overlay
      const norm = (arr: number[]) => {
        const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
        const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length) || 1;
        return arr.map(v => (v - mean) / std);
      };
      out.push({
        type: 'scatter', mode: 'lines',
        name: eventPred,
        x: eventByMonth.map(r => r.month),
        y: norm(eventByMonth.map(r => r.count)),
        line: { color: predColor(eventPred), width: 2 },
      });
      if (showRRLS) {
        out.push({
          type: 'scatter', mode: 'lines',
          name: 'RED_LINES',
          x: rrlsByMonth.map(r => r.month),
          y: norm(rrlsByMonth.map(r => r.count)),
          line: { color: '#ff4444', width: 2 },
        });
      }
      if (showNTS) {
        out.push({
          type: 'scatter', mode: 'lines+text',
          name: 'NUCLEAR_THREATS ☢',
          x: ntsByMonth.map(r => r.month),
          y: norm(ntsByMonth.map(r => r.count)),
          line: { color: '#ffd700', width: 2 },
          text: ntsByMonth.map(() => '☢'),
          textposition: 'top center',
          textfont: { size: 11, color: '#ffd700' },
        });
      }
    }
    return out;
  }, [eventByMonth, rrlsByMonth, ntsByMonth, eventPred, chartMode, showRRLS, showNTS, totalEvent, totalRRLS, totalNTS]);

  if (!ts) return <div className="loading">Loading...</div>;

  const title = chartMode === 'bars_bubbles'
    ? `Do ${eventPred.replace(/_/g, ' ')} Trigger Russian Rhetoric?`
    : `${eventPred} vs. Russian Rhetoric Over Time`;

  return (
    <div className="tab-content">
      <h2>Cross-Domain Overlay</h2>
      <p className="subtitle">
        Overlay any event predicate with RRLS/NTS rhetoric data.
        Bubble size = statement count | Y position = avg intensity (line + threat severity) | Opacity = confidence (higher confidence = more opaque).
      </p>

      <div className="controls">
        <div className="toggle-row">
          <span className="label">Event type:</span>
          <select
            value={eventPred}
            onChange={e => setEventPred(e.target.value)}
            className="select-input"
          >
            {EVENT_PREDS.map(p => (
              <option key={p} value={p}>{p} ({ts.predicates[p]?.reduce((s: number, v: number) => s + v, 0).toLocaleString()})</option>
            ))}
          </select>

          <span className="label" style={{ marginLeft: 16 }}>Chart mode:</span>
          <button className={`btn-sm ${chartMode === 'bars_bubbles' ? 'active' : ''}`}
            onClick={() => setChartMode('bars_bubbles')}>Bars + Bubbles</button>
          <button className={`btn-sm ${chartMode === 'dual_axis' ? 'active' : ''}`}
            onClick={() => setChartMode('dual_axis')}>Dual Axis</button>
          <button className={`btn-sm ${chartMode === 'normalized' ? 'active' : ''}`}
            onClick={() => setChartMode('normalized')}>Normalized</button>
        </div>
        <div className="toggle-row">
          <label><input type="checkbox" checked={showRRLS} onChange={e => setShowRRLS(e.target.checked)} /> RRLS</label>
          <label><input type="checkbox" checked={showNTS} onChange={e => setShowNTS(e.target.checked)} /> ☢ NTS</label>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>{title}</h4>
            <ChartInfo
              title="Cross-Domain Overlay"
              description="Compares event predicates from the Temporal Knowledge Graph with RRLS/NTS rhetoric over time. In Bars+Bubbles mode, green bars show monthly event counts; red circles show RRLS statements (size = count, opacity = confidence, Y = avg confidence 0-1); yellow diamonds show NTS. This mirrors the 'Do US Arms Deliveries Trigger RRLS?' visualization from the research paper."
            />
          </div>
          <p style={{ color: '#6a6a7a', fontSize: 11, marginBottom: 8 }}>
            Total Statements: {(totalRRLS + totalNTS).toLocaleString()} | Total {eventPred}: {totalEvent.toLocaleString()}
          </p>
          <Plot
            data={traces}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0', family: 'Inter, sans-serif' },
              margin: { t: 20, b: 60, l: 70, r: 70 },
              height: 500,
              xaxis: {
                title: { text: 'Year-Month', font: { size: 12 } },
                gridcolor: '#2a3a5a',
                tickangle: -45,
              },
              yaxis: {
                title: {
                  text: chartMode === 'normalized' ? 'Z-score' : `${eventPred} Count`,
                  font: { size: 12 },
                },
                gridcolor: '#2a3a5a',
              },
              ...(chartMode !== 'normalized' ? {
                yaxis2: {
                  title: {
                    text: chartMode === 'bars_bubbles' ? 'Avg Intensity (severity scale)' : 'Rhetoric Count',
                    font: { size: 12 },
                  },
                  overlaying: 'y', side: 'right',
                  gridcolor: 'rgba(42, 58, 90, 0.3)',
                  ...(chartMode === 'bars_bubbles' ? { range: [1.0, 4.5] } : {}),
                },
              } : {}),
              legend: {
                orientation: 'h', y: 1.12,
                font: { size: 11 },
                bgcolor: 'transparent',
              },
              hovermode: 'closest',
              barmode: 'group',
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
