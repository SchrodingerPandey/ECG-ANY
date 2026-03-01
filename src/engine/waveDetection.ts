import type { FiducialPoints } from '../types/ecg.types';

export const detectWaves = (signal: Float32Array, rPeaks: number[], fs: number): FiducialPoints[] => {
  const search = (start: number, end: number, mode: 'min' | 'max') => {
    let idx = start;
    let best = signal[start] ?? 0;
    for (let i = Math.max(0, start); i < Math.min(signal.length, end); i += 1) {
      if ((mode === 'min' && signal[i] < best) || (mode === 'max' && signal[i] > best)) {
        best = signal[i];
        idx = i;
      }
    }
    return idx;
  };

  return rPeaks.map((R, beatIndex) => {
    const Q = search(R - Math.round(0.1 * fs), R, 'min');
    const S = search(R, R + Math.round(0.1 * fs), 'min');
    const P = search(Q - Math.round(0.2 * fs), Q - Math.round(0.05 * fs), 'max');
    const T = search(S + Math.round(0.15 * fs), S + Math.round(0.4 * fs), 'max');
    return { beatIndex, R, P, Q, S, T };
  });
};
