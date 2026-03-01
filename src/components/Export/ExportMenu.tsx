import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisResult } from '../../types/ecg.types';

export const exportReport = async (analysis: AnalysisResult | null) => {
  if (!analysis) return;
  const doc = new jsPDF();
  doc.text('CARDIO·LENS ECG Report', 10, 10);
  doc.text(`Mean HR: ${analysis.meanHR.toFixed(1)} BPM`, 10, 20);
  doc.text(`Rhythm: ${analysis.rhythmClassification}`, 10, 28);
  doc.text(`SQI: ${analysis.sqi.toFixed(0)}%`, 10, 36);
  const canvasEl = document.querySelector('.ecg-canvas') as HTMLCanvasElement | null;
  if (canvasEl) {
    const snap = await html2canvas(canvasEl);
    const img = snap.toDataURL('image/png');
    doc.addImage(img, 'PNG', 10, 45, 190, 60);
  }
  doc.save('cardiolens-report.pdf');
};

export const exportPeaksCsv = (analysis: AnalysisResult | null) => {
  if (!analysis) return;
  const lines = ['beat_index,R_sample,R_time_ms,RR_interval_ms,HR_bpm,PR_ms,QRS_ms,QT_ms,QTc'];
  analysis.beatMeasurements.forEach((b) => {
    const r = analysis.fiducialPoints.find((f) => f.beatIndex === b.beatIndex)?.R ?? 0;
    lines.push([b.beatIndex, r, ((r / analysis.signal.sampleRate) * 1000).toFixed(1), b.rr_ms.toFixed(1), b.hr_bpm.toFixed(1), b.pr_ms?.toFixed(1) ?? '', b.qrs_ms?.toFixed(1) ?? '', b.qt_ms?.toFixed(1) ?? '', b.qtc_bazett?.toFixed(1) ?? ''].join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ecg-peaks.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};
