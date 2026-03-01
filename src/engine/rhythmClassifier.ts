import type { BeatMeasurements, FiducialPoints } from '../types/ecg.types';

export const classifyRhythm = (meanHR: number, beats: BeatMeasurements[], fid: FiducialPoints[], sqi: number) => {
  const rr = beats.map((b) => b.rr_ms);
  const sdnn = Math.sqrt(rr.reduce((acc, v) => acc + (v - rr.reduce((a, b) => a + b, 0) / Math.max(1, rr.length)) ** 2, 0) / Math.max(1, rr.length));
  const missingP = fid.filter((b) => b.P === undefined).length / Math.max(1, fid.length) > 0.5;
  const prolongedPR = beats.filter((b) => (b.pr_ms ?? 0) > 200).length > beats.length * 0.5;
  const wideQRS = beats.filter((b) => (b.qrs_ms ?? 0) > 120).length;

  let rhythm = 'Normal Sinus Rhythm';
  if (meanHR < 60) rhythm = 'Bradycardia';
  else if (meanHR > 100) rhythm = 'Tachycardia';
  if (sdnn > 80 && missingP) rhythm = 'Probable Atrial Fibrillation';
  else if (wideQRS > 0 && wideQRS < beats.length * 0.5) rhythm = 'PVC detected';
  else if (prolongedPR) rhythm = 'First-Degree AV Block';
  else if (wideQRS > beats.length * 0.5) rhythm = 'Bundle Branch Block pattern';

  const confidence = sqi > 80 && beats.length > 20 ? 'High' : sqi > 50 ? 'Medium' : 'Low';
  return { rhythm, confidence: confidence as 'High' | 'Medium' | 'Low' };
};
