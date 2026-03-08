import { useEffect, useState, useMemo } from 'react';
import Plot from './Plot';
import ChartInfo from './ChartInfo';
import { load } from '../data';
import type { CausalEdge, CountryTriggersData } from '../types';
import { predColor } from '../colors';

// Fixed positions for network layout
const NODE_POS: Record<string, [number, number]> = {
  THREATENS: [1.5, 8],
  ATTACKS: [8.5, 8],
  LAUNCHES: [5, 9.5],
  RED_LINES: [2, 5],
  NUCLEAR_THREATS: [8, 5],
  AIDS: [0.5, 2],
  SANCTIONS: [3.5, 1],
  CYBER_ATTACKS: [6.5, 1],
  DISINFORMS: [2, 0],
  CONTROLS: [8, 2],
  DISPLACES: [5, 0],
  TRADES_FOSSIL: [10, 3],
  ARMS: [0, 4],
};

type ViewMode = 'aggregate' | 'country';

export default function CausalNetwork() {
  const [edges, setEdges] = useState<CausalEdge[]>([]);
  const [countryData, setCountryData] = useState<CountryTriggersData | null>(null);
  const [pThreshold, setPThreshold] = useState(0.05);
  const [highlightRhetoric, setHighlightRhetoric] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('aggregate');

  useEffect(() => {
    load<CausalEdge[]>('causal_network.json').then(setEdges);
    load<CountryTriggersData>('country_triggers.json').then(setCountryData);
  }, []);

  const filteredEdges = useMemo(() => {
    return edges.filter(e => e.p_value < pThreshold);
  }, [edges, pThreshold]);

  // Build aggregate traces with proper directional arrows and labels
  const aggregateTraces = useMemo(() => {
    const out: Plotly.Data[] = [];

    for (const edge of filteredEdges) {
      const sp = NODE_POS[edge.source];
      const tp = NODE_POS[edge.target];
      if (!sp || !tp) continue;

      const isRhetoricTarget = edge.target === 'RED_LINES' || edge.target === 'NUCLEAR_THREATS';
      const isRhetoricSource = edge.source === 'RED_LINES' || edge.source === 'NUCLEAR_THREATS';
      const color = highlightRhetoric
        ? (isRhetoricTarget ? '#ff4444' : isRhetoricSource ? '#3fb950' : '#484f58')
        : '#58a6ff';
      const width = Math.min(1 + edge.f_stat / 8, 5);

      // Offset for bidirectional edges
      const dx = tp[0] - sp[0];
      const dy = tp[1] - sp[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const ox = -dy / len * 0.15;
      const oy = dx / len * 0.15;

      // Shorten line slightly so arrow doesn't overlap node
      const shrink = 0.4 / len;
      const sx = sp[0] + ox + dx * shrink;
      const sy = sp[1] + oy + dy * shrink;
      const tx = tp[0] + ox - dx * shrink;
      const ty = tp[1] + oy - dy * shrink;

      // Edge line
      out.push({
        type: 'scatter', mode: 'lines',
        x: [sx, tx, null],
        y: [sy, ty, null],
        line: { color, width },
        opacity: 0.6 + Math.min(edge.f_stat / 40, 0.4),
        hoverinfo: 'text',
        text: `${edge.source} → ${edge.target}\nF=${edge.f_stat.toFixed(1)}, p=${edge.p_value.toFixed(4)}\nLag: ${edge.lag} week(s)`,
        showlegend: false,
      } as Plotly.Data);

      // Arrowhead (triangle)
      const arrowLen = 0.35;
      const angle = Math.atan2(dy, dx);
      const ax1 = tx - arrowLen * Math.cos(angle - 0.35);
      const ay1 = ty - arrowLen * Math.sin(angle - 0.35);
      const ax2 = tx - arrowLen * Math.cos(angle + 0.35);
      const ay2 = ty - arrowLen * Math.sin(angle + 0.35);

      // Filled arrow
      out.push({
        type: 'scatter', mode: 'lines',
        x: [ax1, tx, ax2],
        y: [ay1, ty, ay2],
        fill: 'toself',
        fillcolor: color,
        line: { color, width: 1 },
        opacity: 0.7,
        hoverinfo: 'skip',
        showlegend: false,
      } as Plotly.Data);

      // F-stat label at midpoint
      const mx = (sx + tx) / 2 + ox * 1.5;
      const my = (sy + ty) / 2 + oy * 1.5;
      out.push({
        type: 'scatter', mode: 'text',
        x: [mx], y: [my],
        text: [`F=${edge.f_stat.toFixed(0)}`],
        textfont: { size: 8, color: '#8b949e' },
        hoverinfo: 'skip',
        showlegend: false,
      } as Plotly.Data);
    }

    // Node markers
    const nodes = Object.entries(NODE_POS);
    const isRhetoric = (n: string) => n === 'RED_LINES' || n === 'NUCLEAR_THREATS';
    out.push({
      type: 'scatter', mode: 'markers+text',
      x: nodes.map(([, p]) => p[0]),
      y: nodes.map(([, p]) => p[1]),
      marker: {
        size: nodes.map(([n]) => isRhetoric(n) ? 30 : 20),
        color: nodes.map(([n]) => predColor(n)),
        opacity: 0.9,
        line: { color: '#1a1a2e', width: 2 },
      },
      text: nodes.map(([n]) => n === 'NUCLEAR_THREATS' ? 'NUCLEAR\nTHREATS' : n.replace('_', '\n')),
      textposition: 'bottom center',
      textfont: { size: 9, color: '#e0e0e0' },
      hoverinfo: 'text',
      hovertext: nodes.map(([n]) => {
        const incoming = filteredEdges.filter(e => e.target === n).length;
        const outgoing = filteredEdges.filter(e => e.source === n).length;
        return `${n}\nIncoming: ${incoming}\nOutgoing: ${outgoing}`;
      }),
      showlegend: false,
    } as Plotly.Data);

    return out;
  }, [filteredEdges, highlightRhetoric]);

  // Build country-level network
  const countryTraces = useMemo(() => {
    if (!countryData) return [];
    const out: Plotly.Data[] = [];

    // Country node positions in a force-directed-like layout
    const COUNTRY_POS: Record<string, [number, number]> = {
      // Western powers (left side)
      USA: [0, 8], GBR: [1, 9.5], CAN: [2, 9], FRA: [0, 6],
      NOR: [1, 7], FIN: [2, 6.5],
      // Small donors (bottom left)
      CZE: [0, 4], LUX: [1, 3.5], LVA: [2, 4.5], SVN: [0, 2.5],
      PRT: [1, 2], AUT: [2, 3], CHE: [0.5, 1],
      // Russia (center-right)
      RUS: [6, 6],
      // Ukraine (center)
      UKR: [4, 7],
      // Rhetoric nodes (right side)
      RED_LINES: [8, 7], NUCLEAR_THREATS: [8, 4],
      // Other targets
      ARM: [5, 3],
    };

    const allTriggers = [...countryData.threats, ...countryData.aid, ...countryData.attacks, ...countryData.other];

    // Edges
    for (const t of allTriggers) {
      const srcKey = t.source_country;
      const tgtKey = t.rhetoric_target;
      const sp = COUNTRY_POS[srcKey];
      const tp = COUNTRY_POS[tgtKey];
      if (!sp || !tp) continue;

      const isAid = countryData.aid.includes(t);
      const isThreat = countryData.threats.includes(t);
      const color = isAid ? '#3fb950' : isThreat ? '#58a6ff' : '#ff4444';
      const width = Math.min(1 + t.f_stat / 8, 4);

      const dx = tp[0] - sp[0];
      const dy = tp[1] - sp[1];
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const shrink = 0.3 / len;

      out.push({
        type: 'scatter', mode: 'lines',
        x: [sp[0] + dx * shrink, tp[0] - dx * shrink, null],
        y: [sp[1] + dy * shrink, tp[1] - dy * shrink, null],
        line: { color, width },
        opacity: 0.7,
        hoverinfo: 'text',
        text: `${srcKey} ${t.predicate} → ${tgtKey}\nF=${t.f_stat.toFixed(1)}, p=${t.p_value.toFixed(4)}, lag=${t.lag}w`,
        showlegend: false,
      } as Plotly.Data);

      // Arrow
      const angle = Math.atan2(dy, dx);
      const tx2 = tp[0] - dx * shrink;
      const ty2 = tp[1] - dy * shrink;
      out.push({
        type: 'scatter', mode: 'lines',
        x: [tx2 - 0.25 * Math.cos(angle - 0.35), tx2, tx2 - 0.25 * Math.cos(angle + 0.35)],
        y: [ty2 - 0.25 * Math.sin(angle - 0.35), ty2, ty2 - 0.25 * Math.sin(angle + 0.35)],
        fill: 'toself',
        fillcolor: color,
        line: { color, width: 1 },
        opacity: 0.7,
        hoverinfo: 'skip',
        showlegend: false,
      } as Plotly.Data);

      // Label
      const mx = (sp[0] + tp[0]) / 2;
      const my = (sp[1] + tp[1]) / 2;
      out.push({
        type: 'scatter', mode: 'text',
        x: [mx], y: [my],
        text: [`F=${t.f_stat.toFixed(0)}`],
        textfont: { size: 8, color: '#8b949e' },
        hoverinfo: 'skip',
        showlegend: false,
      } as Plotly.Data);
    }

    // Country nodes
    const usedNodes = new Set<string>();
    for (const t of allTriggers) {
      usedNodes.add(t.source_country);
      usedNodes.add(t.rhetoric_target);
      if (t.target_country) usedNodes.add(t.target_country);
    }

    const nodeColor = (n: string) => {
      if (n === 'RED_LINES') return '#ff7b72';
      if (n === 'NUCLEAR_THREATS') return '#ffd700';
      if (n === 'RUS') return '#c0392b';
      if (n === 'UKR') return '#2471a3';
      if (['USA', 'GBR', 'CAN', 'FRA', 'NOR'].includes(n)) return '#27ae60';
      return '#17a589'; // small donors
    };

    const nodeEntries = Object.entries(COUNTRY_POS).filter(([n]) => usedNodes.has(n));
    out.push({
      type: 'scatter', mode: 'markers+text',
      x: nodeEntries.map(([, p]) => p[0]),
      y: nodeEntries.map(([, p]) => p[1]),
      marker: {
        size: nodeEntries.map(([n]) => n === 'RED_LINES' || n === 'NUCLEAR_THREATS' ? 28 : n === 'RUS' || n === 'UKR' ? 22 : 16),
        color: nodeEntries.map(([n]) => nodeColor(n)),
        opacity: 0.9,
        line: { color: '#1a1a2e', width: 2 },
      },
      text: nodeEntries.map(([n]) => n),
      textposition: 'bottom center',
      textfont: { size: 10, color: '#e0e0e0' },
      hoverinfo: 'text',
      hovertext: nodeEntries.map(([n]) => {
        const asSource = allTriggers.filter(t => t.source_country === n).length;
        const asTarget = allTriggers.filter(t => t.rhetoric_target === n).length;
        return `${n}\nTriggering: ${asSource}\nTargeted: ${asTarget}`;
      }),
      showlegend: false,
    } as Plotly.Data);

    return out;
  }, [countryData]);

  return (
    <div className="tab-content">
      <h2>Causal Network</h2>
      <p className="subtitle">
        Directed graph of Granger-causal relationships. Arrows show direction of causation (X → Y means X's past predicts Y's future).
        Labels show F-statistic. Arrow width proportional to F-stat.
      </p>

      <div className="controls">
        <div className="toggle-row">
          <span className="label">View:</span>
          <button className={`btn-sm ${viewMode === 'aggregate' ? 'active' : ''}`}
            onClick={() => setViewMode('aggregate')}>Aggregate Predicates</button>
          <button className={`btn-sm ${viewMode === 'country' ? 'active' : ''}`}
            onClick={() => setViewMode('country')}>Country-Level</button>
          {viewMode === 'aggregate' && (
            <>
              <span className="label" style={{ marginLeft: 16 }}>p-value threshold:</span>
              <input
                type="range" min={0.001} max={0.05} step={0.001}
                value={pThreshold}
                onChange={e => setPThreshold(Number(e.target.value))}
              />
              <span className="label">p &lt; {pThreshold.toFixed(3)}</span>
              <label style={{ marginLeft: 12 }}>
                <input type="checkbox" checked={highlightRhetoric} onChange={e => setHighlightRhetoric(e.target.checked)} />
                Highlight rhetoric edges
              </label>
            </>
          )}
        </div>
        <div className="legend-row">
          {viewMode === 'aggregate' ? (
            <>
              <span style={{ color: '#ff4444' }}>&#9632; Triggers rhetoric</span>
              <span style={{ color: '#3fb950' }}>&#9632; Rhetoric causes</span>
              <span style={{ color: '#484f58' }}>&#9632; Other causal links</span>
              <span className="muted">({filteredEdges.length} edges at p &lt; {pThreshold.toFixed(3)})</span>
            </>
          ) : (
            <>
              <span style={{ color: '#58a6ff' }}>&#9632; Diplomatic threats</span>
              <span style={{ color: '#3fb950' }}>&#9632; Military aid</span>
              <span style={{ color: '#ff4444' }}>&#9632; Attacks</span>
              <span style={{ color: '#c0392b' }}>&#9679; Russia</span>
              <span style={{ color: '#2471a3' }}>&#9679; Ukraine</span>
              <span style={{ color: '#27ae60' }}>&#9679; Major powers</span>
              <span style={{ color: '#17a589' }}>&#9679; Small donors</span>
            </>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="chart-box" style={{ minWidth: '100%' }}>
          <div className="chart-title-bar">
            <h4>{viewMode === 'aggregate' ? 'Granger Causal Network (Predicate-Level)' : 'Country-Level Causal Network (FDR-Corrected)'}</h4>
            <ChartInfo
              title={viewMode === 'aggregate' ? 'Aggregate Causal Network' : 'Country-Level Network'}
              description={viewMode === 'aggregate'
                ? 'Directed graph showing Granger-causal relationships between predicates. Each arrow means the source\'s past values help predict the target\'s future. Arrow width = F-statistic strength. Labels show F-stat. Red arrows point toward rhetoric; green arrows show what rhetoric causes.'
                : 'Country-specific Granger-causal relationships (24 FDR-surviving pairs from 450 tests). Shows which specific countries\' actions trigger Russian rhetoric. Blue = diplomatic threats, green = military aid, red = attacks. All pairs survive Benjamini-Hochberg FDR correction at alpha=0.05.'
              }
            />
          </div>
          <Plot
            data={viewMode === 'aggregate' ? aggregateTraces : countryTraces}
            layout={{
              paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
              font: { color: '#e0e0e0' },
              margin: { t: 10, b: 10, l: 10, r: 10 },
              height: 650,
              xaxis: { visible: false, range: viewMode === 'aggregate' ? [-1, 11] : [-1, 10] },
              yaxis: {
                visible: false,
                range: viewMode === 'aggregate' ? [-1.5, 10.5] : [-0.5, 10.5],
                scaleanchor: 'x',
              },
              hovermode: 'closest',
              hoverlabel: { bgcolor: '#1e2a45', bordercolor: '#2a3a5a', font: { color: '#e0e0e0' } },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
