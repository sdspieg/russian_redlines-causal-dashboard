import { useEffect, useState } from 'react';
import Plot from './Plot';
import ChartInfo from './ChartInfo';
import { load } from '../data';
import type { SlidingWindowData } from '../types';
import { predColor } from '../colors';

export default function SlidingWindow() {
  const [data, setData] = useState<SlidingWindowData | null>(null);

  useEffect(() => {
    load<SlidingWindowData>('sliding_window.json').then(setData);
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  const windows = data.windows;
  const maxSig = Math.max(...windows.map(w => w.n_significant));
  const minIdx = windows.findIndex(w => w.n_significant === Math.min(...windows.map(w2 => w2.n_significant)));

  return (
    <div className="tab-content">
      <h2>Sliding-Window Phase Analysis</h2>
      <p className="subtitle">
        Do causal relationships hold across all war phases? {data.n_windows} overlapping {data.window_size}-week
        windows, {data.step}-week step. Result: <strong style={{ color: '#ff7b72' }}>{data.stable_pairs} stable pairs</strong> — nothing persists across all phases.
      </p>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{data.n_windows}</div>
          <div className="stat-label">Windows</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ff7b72' }}>
          <div className="stat-value">{data.stable_pairs}</div>
          <div className="stat-label">Stable Pairs (all windows)</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ffa657' }}>
          <div className="stat-value">{data.total_phase_changing}</div>
          <div className="stat-label">Phase-Changing Pairs</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#3fb950' }}>
          <div className="stat-value">{maxSig}</div>
          <div className="stat-label">Peak Complexity</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>The U-Shaped Complexity Curve</h4>
            <ChartInfo title="Significant Pairs Per Window" description="Number of significant Granger-causal pairs in each 52-week window. The invasion triggered maximum cross-domain cascading (27 pairs). Mid-2023 saw a 'frozen conflict' trough (5 pairs) as domains decoupled. Late 2024 returns to near-invasion complexity (26 pairs) along different causal channels." />
          </div>
          <Plot
            data={[
              {
                type: 'bar',
                x: windows.map(w => w.period),
                y: windows.map(w => w.n_significant),
                marker: {
                  color: windows.map((w, i) => {
                    if (i === 0 || i === windows.length - 2) return '#ff7b72';
                    if (i === minIdx) return '#3fb950';
                    return '#58a6ff';
                  }),
                },
                text: windows.map(w => String(w.n_significant)),
                textposition: 'outside',
                textfont: { color: '#e0e0e0', size: 11 },
                hovertext: windows.map(w => `${w.label}\n${w.period}\n${w.n_significant} significant pairs\n${w.character}`),
                hoverinfo: 'text',
              },
            ]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 20, b: 80, l: 50, r: 20 },
              height: 380,
              xaxis: { tickangle: -35, gridcolor: '#2a3a5a' },
              yaxis: { title: 'Significant Causal Pairs', gridcolor: '#2a3a5a' },
              annotations: [
                {
                  x: windows[0].period, y: windows[0].n_significant + 2,
                  text: 'Invasion peak', showarrow: false,
                  font: { color: '#ff7b72', size: 10 },
                },
                {
                  x: windows[minIdx].period, y: windows[minIdx].n_significant + 2,
                  text: 'Frozen conflict\ntrough', showarrow: false,
                  font: { color: '#3fb950', size: 10 },
                },
                {
                  x: windows[windows.length - 2].period, y: windows[windows.length - 2].n_significant + 2,
                  text: 'Late-war\nresurgence', showarrow: false,
                  font: { color: '#ff7b72', size: 10 },
                },
              ],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Most Persistent Pairs</h4>
            <ChartInfo title="Pair Persistence" description="Causal pairs that appear in the most windows (though none appear in all 13). The most durable finding is CYBER_ATTACKS → CONTROLS (8/13 windows, 62%), suggesting a consistent hybrid warfare signature." />
          </div>
          <Plot
            data={[{
              type: 'bar',
              y: data.persistent_pairs.map(p => `${p.cause} → ${p.effect}`),
              x: data.persistent_pairs.map(p => p.windows_present),
              orientation: 'h',
              marker: {
                color: data.persistent_pairs.map(p => {
                  const c = p.cause.replace('count_', '');
                  const e = p.effect.replace('count_', '');
                  if (c === 'RED_LINES' || e === 'RED_LINES') return predColor('RED_LINES');
                  if (c === 'CYBER_ATTACKS' || e === 'CYBER_ATTACKS') return predColor('CYBER_ATTACKS');
                  return '#58a6ff';
                }),
              },
              text: data.persistent_pairs.map(p => `${p.windows_present}/${data.n_windows} (${p.pct}%)`),
              textposition: 'outside',
              textfont: { size: 10, color: '#c9d1d9' },
              hovertext: data.persistent_pairs.map(p => `${p.cause} → ${p.effect}\n${p.windows_present}/${data.n_windows} windows\n${p.note}`),
              hoverinfo: 'text',
            }]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 10, b: 30, l: 220, r: 100 },
              height: Math.max(250, data.persistent_pairs.length * 38 + 60),
              yaxis: { autorange: 'reversed', type: 'category' },
              xaxis: { title: `Windows (of ${data.n_windows})`, gridcolor: '#2a3a5a', range: [0, data.n_windows + 1] },
              shapes: [{
                type: 'line', x0: data.n_windows, x1: data.n_windows, y0: -0.5, y1: data.persistent_pairs.length - 0.5,
                line: { color: '#ff4444', dash: 'dot', width: 1 },
              }],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>

        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Phase-Emergent Pairs</h4>
            <ChartInfo title="Phase-Specific Patterns" description="Causal relationships that emerged only in specific war phases, showing how the conflict's dynamics evolve over time." />
          </div>
          <div className="findings">
            {data.phase_emergent.map((pe, i) => (
              <div key={i} className="finding-section" style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #2a3a5a' }}>
                <div className="finding-row">
                  <span style={{ color: predColor(pe.cause) }}>{pe.cause}</span>
                  <span className="arrow"> → </span>
                  <span style={{ color: predColor(pe.effect) }}>{pe.effect}</span>
                </div>
                <p style={{ color: '#8b949e', fontSize: 12, marginTop: 4 }}>
                  First: {pe.first_appeared}
                  {pe.last_appeared && ` | Last: ${pe.last_appeared}`}
                </p>
                <p style={{ color: '#c9d1d9', fontSize: 13, marginTop: 4 }}>
                  {pe.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>Window Detail</h4>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #2a3a5a' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#8b949e' }}>Period</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#8b949e' }}>Dates</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#8b949e' }}>Pairs</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#8b949e' }}>Character</th>
                </tr>
              </thead>
              <tbody>
                {windows.map((w, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid #1e2d4a',
                    backgroundColor: i === 0 || i === windows.length - 2 ? '#ff7b7210' : i === minIdx ? '#3fb95010' : 'transparent',
                  }}>
                    <td style={{ padding: '6px 12px', color: '#e0e0e0', fontWeight: i === 0 || i === minIdx || i === windows.length - 2 ? 'bold' : 'normal' }}>{w.period}</td>
                    <td style={{ padding: '6px 12px', color: '#8b949e', fontFamily: 'monospace', fontSize: 12 }}>{w.label}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'center', color: w.n_significant > 20 ? '#ff7b72' : w.n_significant < 8 ? '#3fb950' : '#58a6ff', fontWeight: 'bold' }}>{w.n_significant}</td>
                    <td style={{ padding: '6px 12px', color: '#c9d1d9' }}>{w.character}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
