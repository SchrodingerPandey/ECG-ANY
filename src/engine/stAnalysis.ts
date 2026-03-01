import type { BeatMeasurements, FiducialPoints } from '../types/ecg.types';

export const analyzeST = (signal: Float32Array, beats: FiducialPoints[], fs: number, meanHR: number) => {
  const levels = beats.map((b) => {
    if (b.S === undefined) return 0;
    const j = b.S + Math.round(0.04 * fs);
    const offset = j + Math.round((meanHR > 100 ? 0.08 : 0.06) * fs);
    return signal[Math.min(signal.length - 1, offset)] - signal[Math.max(0, b.Q ?? b.S - Math.round(0.04 * fs))];
  });
  const elevation = levels.filter((l) => l > 0.1).length;
  const depression = levels.filter((l) => l < -0.1).length;
  const status = elevation > depression && elevation > 0 ? 'Elevated' : depression > elevation && depression > 0 ? 'Depressed' : 'Normal';
  return { elevation, depression, status: status as 'Normal' | 'Elevated' | 'Depressed' };
};

export const mapSTToBeats = (measures: BeatMeasurements[], stStatus: ReturnType<typeof analyzeST>) =>
  measures.map((m) => ({ ...m, st_level_mv: stStatus.status === 'Elevated' ? 0.12 : stStatus.status === 'Depressed' ? -0.12 : 0 }));
