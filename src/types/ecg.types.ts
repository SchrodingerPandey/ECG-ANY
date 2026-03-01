export interface ECGSignal {
  samples: Float32Array;
  sampleRate: number;
  durationSeconds: number;
  unit: 'mV' | 'adc' | 'normalized';
  leadName?: string;
}

export interface PreprocessingLog {
  originalLineCount: number;
  headerLinesRemoved: number;
  indexColumnsRemoved: boolean;
  artifactSamplesReplaced: number;
  filtersApplied: string[];
  detectedSampleRate: number;
  finalSampleCount: number;
  warnings: string[];
  strippedLines: string[];
}

export interface FiducialPoints {
  beatIndex: number;
  R: number;
  P?: number;
  Q?: number;
  S?: number;
  T?: number;
}

export interface BeatMeasurements {
  beatIndex: number;
  rr_ms: number;
  pr_ms?: number;
  qrs_ms?: number;
  qt_ms?: number;
  qtc_bazett?: number;
  hr_bpm: number;
  st_level_mv?: number;
  isEctopic: boolean;
}

export interface HRVMetrics {
  sdnn_ms: number;
  rmssd_ms: number;
  pnn50_percent: number;
  meanRR_ms: number;
  lfhf_ratio?: number;
}

export interface AnalysisResult {
  signal: ECGSignal;
  preprocessingLog: PreprocessingLog;
  fiducialPoints: FiducialPoints[];
  beatMeasurements: BeatMeasurements[];
  meanHR: number;
  hrv: HRVMetrics;
  rhythmClassification: string;
  rhythmConfidence: 'High' | 'Medium' | 'Low';
  stAnalysis: { elevation: number; depression: number; status: 'Normal' | 'Elevated' | 'Depressed' };
  sqi: number;
  events: { timestamp_s: number; description: string; severity: 'info' | 'warning' | 'critical' }[];
}

export interface ParseResult {
  leads: Float32Array[];
  leadNames: string[];
  sampleRateHint?: number;
  log: Omit<PreprocessingLog, 'artifactSamplesReplaced' | 'filtersApplied' | 'finalSampleCount' | 'detectedSampleRate'>;
}

export interface ViewerSettings {
  paperSpeed: 6.25 | 12.5 | 25 | 50;
  gain: 0.5 | 1 | 2 | 4;
  timeWindow: number;
  selectedLead: number;
  showP: boolean;
  showQRS: boolean;
  showT: boolean;
}
