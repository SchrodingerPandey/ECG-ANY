import type { AnalysisResult } from '../../types/ecg.types';

export const Cards = ({ analysis }: { analysis: AnalysisResult }) => {
  const intervals = analysis.beatMeasurements;
  const avg = (key: keyof (typeof intervals)[number]) => {
    const vals = intervals.map((b) => b[key]).filter((v): v is number => typeof v === 'number');
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-';
  };
  return (
    <div className="cards">
      <article aria-live="polite"><h4>Heart Rate</h4><strong>{analysis.meanHR.toFixed(1)} BPM</strong></article>
      <article aria-live="polite"><h4>Rhythm</h4><strong>{analysis.rhythmClassification}</strong><small>{analysis.rhythmConfidence} confidence</small></article>
      <article aria-live="polite"><h4>HRV</h4><p>SDNN {analysis.hrv.sdnn_ms.toFixed(1)} ms · RMSSD {analysis.hrv.rmssd_ms.toFixed(1)} ms · pNN50 {analysis.hrv.pnn50_percent.toFixed(1)}%</p></article>
      <article aria-live="polite"><h4>Intervals</h4><p>PR {avg('pr_ms')} ms · QRS {avg('qrs_ms')} ms · QT {avg('qt_ms')} ms · QTc {avg('qtc_bazett')} ms</p></article>
      <article aria-live="polite"><h4>ST Segment</h4><p>{analysis.stAnalysis.status} (↑{analysis.stAnalysis.elevation} ↓{analysis.stAnalysis.depression})</p></article>
      <article aria-live="polite"><h4>SQI</h4><strong>{analysis.sqi.toFixed(0)}%</strong></article>
      <article><h4>Detected Events</h4><div className="events">{analysis.events.length ? analysis.events.map((e, i) => <p key={i}>{e.timestamp_s.toFixed(2)}s — {e.description}</p>) : 'No anomalies logged.'}</div></article>
    </div>
  );
};
