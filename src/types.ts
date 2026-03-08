export interface PredicateTimeseries {
  dates: string[];
  predicates: Record<string, number[]>;
  severity_rl: number[];
  severity_nt: number[];
}

export interface GrangerResult {
  source: string;
  target: string;
  f_stat: number;
  p_value: number;
  lag: number;
  sig: boolean;
}

export interface CrossCorrelation {
  source: string;
  target: string;
  lags: number[];
  correlations: number[];
}

export interface CorrelationMatrix {
  predicates: string[];
  matrix: number[][];
}

export interface EntityPairSeries {
  predicate: string;
  source_entity: string;
  target_entity: string;
  total: number;
  series: number[];
}

export interface EntityTimeseries {
  dates: string[];
  pairs: EntityPairSeries[];
}

export interface SummaryStats {
  n_snapshots: number;
  date_start: string;
  date_end: string;
  total_triples: number;
  predicate_totals: Record<string, number>;
  n_significant_granger: number;
  n_predicates: number;
  confidence_threshold: number;
}

export interface CausalEdge {
  source: string;
  target: string;
  f_stat: number;
  p_value: number;
  lag: number;
  sig: boolean;
}

export interface RRLSStatement {
  chunk_id: string;
  date: string;
  source: string;
  db: string;
  overall_confidence?: number;
  speaker?: string;
  target?: string;
  context_text_span?: string;
  theme?: string;
  audience?: string;
  nature_of_threat?: string;
  level_of_escalation?: string;
  line_type?: string;
  threat_type?: string;
  specificity?: string;
  immediacy?: string;
}

// v6: Country-specific triggers
export interface CountryTrigger {
  source_country: string;
  target_country?: string;
  predicate: string;
  rhetoric_target: string;
  f_stat: number;
  p_value: number;
  lag: number;
  note?: string;
}

export interface CountryTriggersData {
  description: string;
  total_tests: number;
  fdr_surviving: number;
  threats: CountryTrigger[];
  aid: CountryTrigger[];
  attacks: CountryTrigger[];
  other: CountryTrigger[];
}

// v6: Weapon-type triggers
export interface WeaponTrigger {
  weapon_type: string;
  rhetoric_target: string;
  total_events: number;
  f_stat: number;
  p_value: number;
  lag: number;
  note?: string;
}

export interface WeaponTriggersData {
  description: string;
  total_tests: number;
  fdr_surviving: number;
  results: WeaponTrigger[];
  non_significant: WeaponTrigger[];
  insight: string;
}

// v6: Sliding-window analysis
export interface SlidingWindow {
  label: string;
  period: string;
  n_significant: number;
  character: string;
}

export interface PersistentPair {
  cause: string;
  effect: string;
  windows_present: number;
  pct: number;
  note: string;
}

export interface PhaseEmergent {
  cause: string;
  effect: string;
  first_appeared: string;
  last_appeared?: string;
  note: string;
}

export interface SlidingWindowData {
  description: string;
  window_size: number;
  step: number;
  n_windows: number;
  stable_pairs: number;
  total_phase_changing: number;
  windows: SlidingWindow[];
  persistent_pairs: PersistentPair[];
  phase_emergent: PhaseEmergent[];
}

export interface NTSStatement {
  chunk_id: string;
  date: string;
  source: string;
  db: string;
  overall_confidence?: number;
  speaker?: string;
  target?: string;
  context_text_span?: string;
  nts_statement_type?: string;
  nts_threat_type?: string;
  capability?: string;
  tone?: string;
  consequences?: string;
  specificity?: string;
  conditionality?: string;
}
