import { useEffect, useState } from 'react';
import Plot from './Plot';
import ChartInfo from './ChartInfo';
import { load } from '../data';
import type { WeaponTriggersData } from '../types';

export default function WeaponTriggers() {
  const [data, setData] = useState<WeaponTriggersData | null>(null);

  useEffect(() => {
    load<WeaponTriggersData>('weapon_triggers.json').then(setData);
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  const sig = data.results;
  const nonsig = data.non_significant;

  return (
    <div className="tab-content">
      <h2>Weapon-Type Triggers of RED_LINES Rhetoric</h2>
      <p className="subtitle">
        Which types of violence predict Russian red-line rhetoric? {data.fdr_surviving} of {data.total_tests} hypotheses
        survive FDR correction (ACLED event types → RED_LINES).
      </p>

      <div className="chart-row">
        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Significant Triggers of RED_LINES Rhetoric (FDR-corrected)</h4>
            <ChartInfo title="Weapon Types → RED_LINES" description="Violence categories from ACLED that Granger-cause Russian red-line rhetoric, after FDR correction. Politically salient events (civilian attacks, territory changes, demonstrations) predict rhetoric; positional warfare (shelling, artillery) does not." />
          </div>
          <Plot
            data={[{
              type: 'bar',
              y: sig.map(w => w.weapon_type),
              x: sig.map(w => w.f_stat),
              orientation: 'h',
              marker: { color: sig.map(w => w.p_value < 0.001 ? '#ff4444' : w.p_value < 0.01 ? '#ffa657' : '#ffd700') },
              text: sig.map(w => {
                const stars = w.p_value < 0.001 ? '***' : w.p_value < 0.01 ? '**' : '*';
                return `F=${w.f_stat.toFixed(1)} ${stars} (${w.lag}w) | ${w.total_events.toLocaleString()} events`;
              }),
              textposition: 'auto',
              textfont: { size: 10, color: '#fff' },
              insidetextanchor: 'start',
            }]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 10, b: 30, l: 170, r: 280 },
              height: Math.max(220, sig.length * 45 + 60),
              yaxis: { autorange: 'reversed', type: 'category' },
              xaxis: { title: 'F-statistic', gridcolor: '#2a3a5a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>

        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Non-Significant (does NOT predict RED_LINES)</h4>
            <ChartInfo title="Violence Types That Don't Trigger RED_LINES" description="These common violence categories do NOT significantly predict Russian red-line rhetoric. Shelling/artillery (28,716 events) is the most common combat activity but fails to predict red-line statements. This reveals that rhetoric responds to media visibility, not military significance." />
          </div>
          <Plot
            data={[{
              type: 'bar',
              y: nonsig.map(w => w.weapon_type),
              x: nonsig.map(w => w.f_stat),
              orientation: 'h',
              marker: { color: '#484f58' },
              text: nonsig.map(w => `F=${w.f_stat.toFixed(1)} ns | ${w.total_events.toLocaleString()} events`),
              textposition: 'auto',
              textfont: { size: 10, color: '#8b949e' },
              insidetextanchor: 'start',
            }]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 10, b: 30, l: 170, r: 260 },
              height: Math.max(200, nonsig.length * 45 + 60),
              yaxis: { autorange: 'reversed', type: 'category' },
              xaxis: { title: 'F-statistic', gridcolor: '#2a3a5a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>Event Volume vs. Predictive Power for RED_LINES</h4>
            <ChartInfo title="Volume vs. Prediction of RED_LINES" description="Scatter plot showing total event count (x-axis, log scale) vs. F-statistic measuring prediction of RED_LINES rhetoric (y-axis). The disconnect between volume and predictive power reveals that Russia's rhetoric responds to what makes headlines, not to what dominates the battlefield." />
          </div>
          <Plot
            data={[
              {
                type: 'scatter',
                mode: 'markers+text',
                x: sig.map(w => w.total_events),
                y: sig.map(w => w.f_stat),
                text: sig.map(w => w.weapon_type),
                textposition: 'top center',
                textfont: { size: 10, color: '#e0e0e0' },
                marker: { color: '#3fb950', size: 12, line: { color: '#1a1a2e', width: 1 } },
                name: 'Significant',
                hoverinfo: 'text',
                hovertext: sig.map(w => `${w.weapon_type}\n${w.total_events.toLocaleString()} events\nF=${w.f_stat.toFixed(1)}`),
              },
              {
                type: 'scatter',
                mode: 'markers+text',
                x: nonsig.map(w => w.total_events),
                y: nonsig.map(w => w.f_stat),
                text: nonsig.map(w => w.weapon_type),
                textposition: 'top center',
                textfont: { size: 10, color: '#8b949e' },
                marker: { color: '#484f58', size: 12, line: { color: '#1a1a2e', width: 1 } },
                name: 'Not significant',
                hoverinfo: 'text',
                hovertext: nonsig.map(w => `${w.weapon_type}\n${w.total_events.toLocaleString()} events\nF=${w.f_stat.toFixed(1)}`),
              },
            ]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 20, b: 50, l: 60, r: 20 },
              height: 400,
              xaxis: { title: 'Total Events (log scale)', gridcolor: '#2a3a5a', type: 'log', titlefont: { size: 13 } },
              yaxis: { title: 'F-statistic (→ RED_LINES)', gridcolor: '#2a3a5a', titlefont: { size: 13 } },
              legend: { orientation: 'h', y: 1.1 },
              shapes: [{
                type: 'line', x0: 10, x1: 50000, y0: 3.84, y1: 3.84,
                line: { color: '#484f58', dash: 'dot', width: 1 },
              }],
              annotations: [{
                x: Math.log10(30000), y: 4.2, text: 'p=0.05 threshold',
                showarrow: false, font: { color: '#8b949e', size: 10 },
              }],
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>Key Insight</h4>
          </div>
          <div className="findings" style={{ maxWidth: 900 }}>
            <p style={{ color: '#c9d1d9', lineHeight: 1.7, fontSize: 14 }}>
              {data.insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
