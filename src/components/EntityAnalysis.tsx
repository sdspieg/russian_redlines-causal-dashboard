import { useEffect, useState } from 'react';
import Plot from './Plot';
import ChartInfo from './ChartInfo';
import { load } from '../data';
import type { EntityTimeseries } from '../types';
import { predColor } from '../colors';

const ENTITY_COLORS = [
  '#ff7b72', '#ffa657', '#ffd700', '#3fb950', '#58a6ff',
  '#d2a8ff', '#f778ba', '#79c0ff', '#a5d6ff', '#56d364',
];

export default function EntityAnalysis() {
  const [data, setData] = useState<EntityTimeseries | null>(null);
  const [focusPred, setFocusPred] = useState('RED_LINES');

  useEffect(() => {
    load<EntityTimeseries>('entity_timeseries.json').then(setData);
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  const pairs = data.pairs.filter(p => p.predicate === focusPred);

  return (
    <div className="tab-content">
      <h2>Entity-Level Analysis</h2>
      <p className="subtitle">
        Top source-target entity pairs for rhetoric predicates. Shows which actors direct rhetoric at whom.
      </p>

      <div className="controls">
        <div className="toggle-row">
          <button
            className={`pred-toggle ${focusPred === 'RED_LINES' ? 'active' : ''}`}
            style={{
              borderColor: predColor('RED_LINES'),
              backgroundColor: focusPred === 'RED_LINES' ? predColor('RED_LINES') + '33' : 'transparent',
              color: focusPred === 'RED_LINES' ? predColor('RED_LINES') : '#8b949e',
            }}
            onClick={() => setFocusPred('RED_LINES')}
          >RED_LINES</button>
          <button
            className={`pred-toggle ${focusPred === 'NUCLEAR_THREATS' ? 'active' : ''}`}
            style={{
              borderColor: predColor('NUCLEAR_THREATS'),
              backgroundColor: focusPred === 'NUCLEAR_THREATS' ? predColor('NUCLEAR_THREATS') + '33' : 'transparent',
              color: focusPred === 'NUCLEAR_THREATS' ? predColor('NUCLEAR_THREATS') : '#8b949e',
            }}
            onClick={() => setFocusPred('NUCLEAR_THREATS')}
          >NUCLEAR_THREATS</button>
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Top Entity Pairs — {focusPred}</h4>
            <ChartInfo title="Top Entity Pairs" description="Horizontal bar chart of the most frequent source→target entity pairs for the selected rhetoric predicate. Shows which actors most often direct RED_LINES or NUCLEAR_THREATS at which targets (e.g., Russia → NATO, Russia → United States)." />
          </div>
          <Plot
            data={[{
              type: 'bar',
              y: pairs.map(p => {
                const fmt = (e: string) => e.replace(/^(country|actor):/, '').replace(/_/g, ' ');
                return `${fmt(p.source_entity)} → ${fmt(p.target_entity)}`;
              }),
              x: pairs.map(p => p.total),
              orientation: 'h',
              marker: { color: pairs.map((_, i) => ENTITY_COLORS[i % ENTITY_COLORS.length]) },
              text: pairs.map(p => p.total.toLocaleString()),
              textposition: 'outside',
            }]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 10, b: 30, l: 200, r: 60 },
              height: Math.max(250, pairs.length * 35 + 60),
              yaxis: { autorange: 'reversed', type: 'category' },
              xaxis: { title: 'Total Edges', gridcolor: '#2a3a5a' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>

        <div className="chart-box">
          <div className="chart-title-bar">
            <h4>Top Pairs Over Time — {focusPred}</h4>
            <ChartInfo title="Entity Pairs Over Time" description="Weekly time series for the top 6 entity pairs of the selected rhetoric predicate. Shows how rhetoric between specific actor pairs evolves over the 210-week observation period." />
          </div>
          <Plot
            data={pairs.slice(0, 6).map((p, i) => ({
              type: 'scatter' as const,
              mode: 'lines' as const,
              name: `${p.source_entity.replace(/^(country|actor):/, '').replace(/_/g, ' ')} → ${p.target_entity.replace(/^(country|actor):/, '').replace(/_/g, ' ')}`,
              x: data.dates,
              y: p.series,
              line: { color: ENTITY_COLORS[i % ENTITY_COLORS.length], width: 1.5 },
            }))}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 10, b: 50, l: 50, r: 20 },
              height: 400,
              xaxis: { title: 'Week', gridcolor: '#2a3a5a' },
              yaxis: { title: 'Edge Count', gridcolor: '#2a3a5a' },
              legend: { orientation: 'h', y: 1.15, font: { size: 9 } },
              hovermode: 'x unified',
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
