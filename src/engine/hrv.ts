import type { HRVMetrics } from '../types/ecg.types';

const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / Math.max(1, x.length);
const std = (x: number[]) => {
  const m = mean(x);
  return Math.sqrt(mean(x.map((v) => (v - m) ** 2)));
};

export const computeHRV = (rr: number[]): HRVMetrics => {
  const diffs = rr.slice(1).map((v, i) => v - rr[i]);
  return {
    sdnn_ms: std(rr),
    rmssd_ms: Math.sqrt(mean(diffs.map((d) => d ** 2))),
    pnn50_percent: (diffs.filter((d) => Math.abs(d) > 50).length / Math.max(1, diffs.length)) * 100,
    meanRR_ms: mean(rr)
  };
};
