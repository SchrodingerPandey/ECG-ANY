import { chainBiquads, designHighPass, designLowPass } from './filters';

export const detectRPeaks = (signal: Float32Array, fs: number, sensitivity = 1): number[] => {
  const band = chainBiquads(signal, [designHighPass(5, fs), designLowPass(15, fs)]);
  const derivative = new Float32Array(band.length);
  for (let i = 2; i < band.length - 2; i += 1) {
    derivative[i] = (2 * band[i + 1] + band[i + 2] - band[i - 2] - 2 * band[i - 1]) / 8;
  }
  const squared = derivative.map((v) => v * v) as Float32Array;
  const win = Math.max(1, Math.round((0.15 * fs)));
  const integrated = new Float32Array(squared.length);
  let sum = 0;
  for (let i = 0; i < squared.length; i += 1) {
    sum += squared[i];
    if (i >= win) sum -= squared[i - win];
    integrated[i] = sum / win;
  }

  const refractory = Math.round(0.2 * fs);
  let spki = 0; let npki = 0;
  let th1 = 0; let th2 = 0;
  const peaks: number[] = [];

  const candidates: { idx: number; value: number }[] = [];
  for (let i = 1; i < integrated.length - 1; i += 1) {
    if (integrated[i] > integrated[i - 1] && integrated[i] > integrated[i + 1]) candidates.push({ idx: i, value: integrated[i] });
  }

  for (const cand of candidates) {
    if (cand.value > th1 * (2 - sensitivity * 0.5)) {
      const last = peaks.at(-1);
      if (last === undefined || cand.idx - last > refractory) {
        peaks.push(cand.idx);
        spki = 0.125 * cand.value + 0.875 * spki;
      } else {
        npki = 0.125 * cand.value + 0.875 * npki;
      }
    } else {
      npki = 0.125 * cand.value + 0.875 * npki;
    }
    th1 = npki + 0.25 * (spki - npki);
    th2 = 0.5 * th1;
  }

  const rr = peaks.slice(1).map((p, i) => p - peaks[i]);
  const rrAvg = rr.length ? rr.reduce((a, b) => a + b, 0) / rr.length : fs;
  for (let i = 1; i < peaks.length; i += 1) {
    if (peaks[i] - peaks[i - 1] > 1.66 * rrAvg) {
      const start = peaks[i - 1] + refractory;
      const end = peaks[i] - refractory;
      let best = -1;
      let bestVal = th2;
      for (let j = start; j < end; j += 1) {
        if (integrated[j] > bestVal) {
          bestVal = integrated[j];
          best = j;
        }
      }
      if (best > 0) peaks.splice(i, 0, best);
    }
  }

  return peaks;
};
