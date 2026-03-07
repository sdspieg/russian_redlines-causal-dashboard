import { useEffect, useState, useMemo } from 'react';
import Plot from './Plot';
import { load } from '../data';
import type { GrangerResult, CrossCorrelation } from '../types';
import { predColor, sigColor, PRED_COLORS } from '../colors';

const ALL_PREDS = Object.keys(PRED_COLORS);
const RHETORIC = ['RED_LINES', 'NUCLEAR_THREATS'];

export default function GrangerExplorer() {
  const [granger, setGranger] = useState<GrangerResult[]>([]);
  const [xcorr, setXcorr] = useState<CrossCorrelation[]>([]);
  const [focusTarget, setFocusTarget] = useState('RED_LINES');
  const [mode, setMode] = useState<'triggers' | 'effects'>('triggers');
  const [xcorrSource, setXcorrSource] = useState('THREATENS');

  useEffect(() => {
    load<GrangerResult[]>('granger_results.json').then(setGranger);
    load<CrossCorrelation[]>('cross_correlations.json').then(setXcorr);
  }, []);

  // Triggers: X → focusTarget
  const triggers = useMemo(() => {
    return granger
      .filter(g => g.target === focusTarget && g.sig && !g.target.includes('_severity'))
      .sort((a, b) => a.p_value - b.p_value);
  }, [granger, focusTarget]);

  // Effects: focusTarget → X
  const effects = useMemo(() => {
    return granger
      .filter(g => g.source === focusTarget && g.sig && !g.target.includes('_severity'))
      .sort((a, b) => a.p_value - b.p_value);
  }, [granger, focusTarget]);

  const displayed = mode === 'triggers' ? triggers : effects;

  // Cross-correlation for selected pair
  const selectedXcorr = useMemo(() => {
    return xcorr.find(x => x.source === xcorrSource && x.target === focusTarget);
  }, [xcorr, xcorrSource, focusTarget]);

  // Severity-weighted triggers
  const severityTriggers = useMemo(() => {
    return granger
      .filter(g => g.target === `${focusTarget}_severity` && g.sig)
      .sort((a, b) => a.p_value - b.p_value);
  }, [granger, focusTarget]);

  return (
    <div className="tab-content">
      <h2>Granger Causality Explorer</h2>
      <p className="subtitle">
        Granger tests whether past values of X help predict future values of Y beyond Y's own history (max lag = 4 weeks).
      </p>

      <div className="controls">
        <div className="toggle-row">
          <span className="label">Focus:</span>
          {RHETORIC.map(r => (
            <button
              key={r}
              className={`pred-toggle ${focusTarget === r ? 'active' : ''}`}
              style={{
                borderColor: predColor(r),
                backgroundColor: focusTarget === r ? predColor(r) + '33' : 'transparent',
                color: focusTarget === r ? predColor(r) : '#8b949e',
              }}
              onClick={() => setFocusTarget(r)}
            >
              {r}
            </button>
          ))}
          <span className="label" style={{ marginLeft: 20 }}>Direction:</span>
          <button
            className={`btn-sm ${mode === 'triggers' ? 'active' : ''}`}
            onClick={() => setMode('triggers')}
          >
            What triggers it?
          </button>
          <button
            className={`btn-sm ${mode === 'effects' ? 'active' : ''}`}
            onClick={() => setMode('effects')}
          >
            What does it cause?
          </button>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          <h4>
            {mode === 'triggers'
              ? `What Triggers ${focusTarget}?`
              : `What Does ${focusTarget} Cause?`}
          </h4>
          {displayed.length > 0 ? (
            <Plot
              data={[{
                type: 'bar',
                y: displayed.map(g => mode === 'triggers' ? g.source : g.target),
                x: displayed.map(g => g.f_stat),
                orientation: 'h',
                marker: {
                  color: displayed.map(g => mode === 'triggers'
                    ? sigColor(g.p_value)
                    : '#3fb950'),
                },
                text: displayed.map(g => {
                  const stars = g.p_value < 0.001 ? '***' : g.p_value < 0.01 ? '**' : '*';
                  return `F=${g.f_stat.toFixed(1)} p=${g.p_value.toFixed(4)} ${stars} (lag=${g.lag}w)`;
                }),
                textposition: 'outside',
                textfont: { size: 10 },
              }]}
              layout={{
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                font: { color: '#e0e0e0' },
                margin: { t: 10, b: 30, l: 140, r: 180 },
                height: Math.max(200, displayed.length * 40 + 60),
                yaxis: { autorange: 'reversed', type: 'category' },
                xaxis: { title: 'F-statistic', gridcolor: '#21262d' },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="no-data">No significant causal relationships found.</p>
          )}
        </div>

        <div className="chart-box">
          <h4>Severity-Weighted: What Triggers High-Severity {focusTarget}?</h4>
          {severityTriggers.length > 0 ? (
            <Plot
              data={[{
                type: 'bar',
                y: severityTriggers.map(g => g.source),
                x: severityTriggers.map(g => g.f_stat),
                orientation: 'h',
                marker: {
                  color: severityTriggers.map(g => sigColor(g.p_value)),
                },
                text: severityTriggers.map(g => {
                  const stars = g.p_value < 0.001 ? '***' : g.p_value < 0.01 ? '**' : '*';
                  return `F=${g.f_stat.toFixed(1)} p=${g.p_value.toFixed(4)} ${stars}`;
                }),
                textposition: 'outside',
                textfont: { size: 10 },
              }]}
              layout={{
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                font: { color: '#e0e0e0' },
                margin: { t: 10, b: 30, l: 140, r: 160 },
                height: Math.max(200, severityTriggers.length * 40 + 60),
                yaxis: { autorange: 'reversed', type: 'category' },
                xaxis: { title: 'F-statistic', gridcolor: '#21262d' },
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="no-data">No significant severity-weighted triggers.</p>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <h4>Cross-Correlation: {xcorrSource} ↔ {focusTarget}</h4>
          <div className="controls" style={{ marginBottom: 10 }}>
            <select
              value={xcorrSource}
              onChange={e => setXcorrSource(e.target.value)}
              className="select-input"
            >
              {ALL_PREDS.filter(p => p !== focusTarget).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {selectedXcorr ? (
            <Plot
              data={[{
                type: 'bar',
                x: selectedXcorr.lags,
                y: selectedXcorr.correlations,
                marker: {
                  color: selectedXcorr.lags.map(l =>
                    l > 0 ? predColor(xcorrSource) : predColor(focusTarget)),
                },
              }]}
              layout={{
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                font: { color: '#e0e0e0' },
                margin: { t: 10, b: 50, l: 60, r: 20 },
                height: 300,
                xaxis: {
                  title: `Lag (weeks) — positive = ${xcorrSource} leads`,
                  gridcolor: '#21262d',
                },
                yaxis: { title: 'Correlation', gridcolor: '#21262d' },
                shapes: [
                  { type: 'line', x0: -8.5, x1: 8.5, y0: 0, y1: 0, line: { color: '#484f58' } },
                  { type: 'line', x0: -8.5, x1: 8.5, y0: 0.135, y1: 0.135, line: { color: '#484f58', dash: 'dot' } },
                  { type: 'line', x0: -8.5, x1: 8.5, y0: -0.135, y1: -0.135, line: { color: '#484f58', dash: 'dot' } },
                ],
                annotations: [
                  { x: -6, y: 0.95, xref: 'x', yref: 'paper', text: `← ${focusTarget} leads`, showarrow: false, font: { color: predColor(focusTarget), size: 11 } },
                  { x: 6, y: 0.95, xref: 'x', yref: 'paper', text: `${xcorrSource} leads →`, showarrow: false, font: { color: predColor(xcorrSource), size: 11 } },
                ],
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          ) : (
            <p className="no-data">Select a predicate above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
