import { useState } from 'react';
import MethodologyModal from './components/MethodologyModal';
import Overview from './components/Overview';
import TimeSeries from './components/TimeSeries';
import GrangerExplorer from './components/GrangerExplorer';
import CausalNetwork from './components/CausalNetwork';
import CorrelationHeatmap from './components/CorrelationHeatmap';
import CrossDomainOverlay from './components/CrossDomainOverlay';
import EntityAnalysis from './components/EntityAnalysis';
import './index.css';

const TABS = [
  { id: 'overview', label: 'Overview', color: '#a0a0b0' },
  { id: 'timeseries', label: 'Time Series', color: '#4fc3f7' },
  { id: 'overlay', label: 'Cross-Domain Overlay', color: '#3fb950' },
  { id: 'granger', label: 'Granger Causality', color: '#ff7b72' },
  { id: 'network', label: 'Causal Network', color: '#d2a8ff' },
  { id: 'heatmap', label: 'Correlation Heatmap', color: '#ffa657' },
  { id: 'entities', label: 'Entity Analysis', color: '#fdd835' },
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="app">
      <header className="app-header">
        <a href="https://hcss.nl/rubase/" target="_blank" rel="noopener noreferrer">
          <img src={import.meta.env.BASE_URL + 'rubase_logo.svg'} alt="RuBase" className="header-logo" />
        </a>
        <div className="header-center">
          <h1>Causal Analysis Dashboard</h1>
          <p className="subtitle">War Events x Russian RRLS/NTS Rhetoric — Temporal Knowledge Graph Analysis</p>
          <MethodologyModal />
        </div>
        <a href="https://hcss.nl/" target="_blank" rel="noopener noreferrer">
          <img src={import.meta.env.BASE_URL + 'hcss_logo.svg'} alt="HCSS" className="header-logo" />
        </a>
      </header>

      <nav className="tab-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            style={{ borderBottomColor: activeTab === t.id ? t.color : 'transparent' }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'timeseries' && <TimeSeries />}
        {activeTab === 'overlay' && <CrossDomainOverlay />}
        {activeTab === 'granger' && <GrangerExplorer />}
        {activeTab === 'network' && <CausalNetwork />}
        {activeTab === 'heatmap' && <CorrelationHeatmap />}
        {activeTab === 'entities' && <EntityAnalysis />}
      </main>

      <footer>
        <p>Causal Analysis Dashboard | Data from TKG snapshots {new Date().toISOString().slice(0, 10)}</p>
      </footer>
    </div>
  );
}

export default App;
