export const computeSQI = (raw: Float32Array, filtered: Float32Array, rPeaks: number[], fs: number): number => {
  let score = 100;
  const meanRaw = raw.reduce((a, b) => a + b, 0) / Math.max(1, raw.length);
  const baselinePenalty = Math.min(25, Math.abs(meanRaw) * 30);
  score -= baselinePenalty;

  const clipping = raw.filter((x) => Math.abs(x) > 0.99 * Math.max(...Array.from(raw, Math.abs))).length / Math.max(1, raw.length);
  score -= clipping * 40;

  const residual = raw.map((v, i) => v - (filtered[i] ?? v));
  const rms = Math.sqrt(residual.reduce((acc, v) => acc + v * v, 0) / Math.max(1, residual.length));
  score -= Math.min(25, rms * 20);

  const rr = rPeaks.slice(1).map((r, i) => ((r - rPeaks[i]) / fs) * 1000);
  const rrMean = rr.reduce((a, b) => a + b, 0) / Math.max(1, rr.length);
  const rrStd = Math.sqrt(rr.reduce((acc, v) => acc + (v - rrMean) ** 2, 0) / Math.max(1, rr.length));
  score -= Math.min(15, (rrStd / Math.max(1, rrMean)) * 100);

  const expected = (raw.length / fs / 60) * 72;
  score -= Math.abs(expected - rPeaks.length) / Math.max(1, expected) * 20;

  return Math.max(0, Math.min(100, score));
};
