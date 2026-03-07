import { useEffect, useState } from 'react';
import Plot from './Plot';
import { load } from '../data';
import type { CorrelationMatrix } from '../types';

export default function CorrelationHeatmap() {
  const [data, setData] = useState<CorrelationMatrix | null>(null);

  useEffect(() => {
    load<CorrelationMatrix>('correlation_matrix.json').then(setData);
  }, []);

  if (!data) return <div className="loading">Loading...</div>;

  return (
    <div className="tab-content">
      <h2>Lagged Correlation Matrix</h2>
      <p className="subtitle">
        Pearson correlation between predicate X at week t-1 and predicate Y at week t.
        Values near 1 indicate strong co-movement with a 1-week lead.
      </p>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <Plot
            data={[{
              type: 'heatmap',
              z: data.matrix,
              x: data.predicates,
              y: data.predicates,
              colorscale: [
                [0, '#1a1a2e'],
                [0.25, '#16213e'],
                [0.5, '#0f3460'],
                [0.75, '#e94560'],
                [1, '#ff7b72'],
              ],
              zmin: -0.3,
              zmax: 0.8,
              text: data.matrix.map(row => row.map(v => v.toFixed(3))),
              texttemplate: '%{text}',
              textfont: { size: 9, color: '#e0e0e0' },
              hovertemplate: '%{y} [t-1] → %{x} [t]<br>Correlation: %{z:.3f}<extra></extra>',
            }]}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 20, b: 100, l: 130, r: 20 },
              height: 550,
              xaxis: { tickangle: -45, side: 'bottom' },
              yaxis: { autorange: 'reversed' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
