import type { BeatMeasurements, FiducialPoints } from '../types/ecg.types';

export const measureIntervals = (fid: FiducialPoints[], fs: number): BeatMeasurements[] =>
  fid.slice(1).map((f, i) => {
    const prev = fid[i];
    const rr = ((f.R - prev.R) / fs) * 1000;
    const pr = f.P !== undefined && f.Q !== undefined ? ((f.Q - f.P) / fs) * 1000 + 40 : undefined;
    const qrs = f.Q !== undefined && f.S !== undefined ? ((f.S - f.Q) / fs) * 1000 : undefined;
    const qt = f.Q !== undefined && f.T !== undefined ? ((f.T - f.Q) / fs) * 1000 + 50 : undefined;
    const qtc = qt !== undefined ? qt / Math.sqrt(rr / 1000) : undefined;
    return {
      beatIndex: f.beatIndex,
      rr_ms: rr,
      pr_ms: pr,
      qrs_ms: qrs,
      qt_ms: qt,
      qtc_bazett: qtc,
      hr_bpm: 60000 / rr,
      isEctopic: Boolean(qrs && qrs > 120)
    };
  });
