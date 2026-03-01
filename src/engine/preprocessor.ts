import { chainBiquads, designHighPass, designLowPass, designNotch, resampleLinear } from './filters';
import type { PreprocessingLog } from '../types/ecg.types';

interface PreprocessOptions {
  sampleRate: number;
  targetSampleRate?: number;
  applyBaseline?: boolean;
  powerlineMode?: 'off' | '50' | '60' | 'both';
}

const median = (arr: number[]) => {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const removeArtifacts = (samples: Float32Array) => {
  const cleaned = new Float32Array(samples);
  const window = 250;
  const bad = new Set<number>();
  for (let i = 0; i < samples.length; i += window) {
    const seg = Array.from(samples.slice(i, i + window));
    const med = median(seg);
    const mad = median(seg.map((v) => Math.abs(v - med))) || 1e-6;
    for (let j = i; j < Math.min(i + window, samples.length); j += 1) {
      if (Math.abs(samples[j] - med) > 5 * mad) bad.add(j);
    }
  }
  for (const idx of bad) {
    let l = idx - 1;
    while (l >= 0 && bad.has(l)) l -= 1;
    let r = idx + 1;
    while (r < samples.length && bad.has(r)) r += 1;
    const lv = l >= 0 ? samples[l] : samples[Math.min(r, samples.length - 1)];
    const rv = r < samples.length ? samples[r] : lv;
    cleaned[idx] = lv + ((rv - lv) * (idx - l)) / Math.max(1, r - l);
  }
  return { cleaned, replaced: bad.size };
};

export const preprocessSignal = (
  samples: Float32Array,
  options: PreprocessOptions
): { filtered: Float32Array; normalized: Float32Array; sampleRate: number; log: Partial<PreprocessingLog> } => {
  const applied: string[] = [];
  const { cleaned, replaced } = removeArtifacts(samples);
  let filtered = cleaned;
  let fs = options.sampleRate;

  if (options.applyBaseline !== false) {
    filtered = chainBiquads(filtered, [designHighPass(0.5, fs), designHighPass(0.5, fs)]);
    applied.push('High-pass 0.5Hz (4th-order approx)');
  }

  if (options.powerlineMode !== 'off') {
    const mode = options.powerlineMode ?? 'both';
    const coeffs = [];
    if (mode === '50' || mode === 'both') coeffs.push(designNotch(50, 30, fs));
    if (mode === '60' || mode === 'both') coeffs.push(designNotch(60, 30, fs));
    filtered = chainBiquads(filtered, coeffs);
    applied.push(`Notch ${mode}Hz`);
  }

  filtered = chainBiquads(filtered, [designLowPass(40, fs), designLowPass(40, fs)]);
  applied.push('Low-pass 40Hz');

  const target = options.targetSampleRate ?? 500;
  if (fs !== target) {
    filtered = resampleLinear(filtered, fs, target);
    fs = target;
    applied.push(`Resampled to ${target}Hz`);
  }

  let maxAbs = 0;
  for (let i = 0; i < filtered.length; i += 1) maxAbs = Math.max(maxAbs, Math.abs(filtered[i]));
  const scale = maxAbs || 1;
  const normalized = new Float32Array(filtered.length);
  for (let i = 0; i < filtered.length; i += 1) normalized[i] = filtered[i] / scale;

  return {
    filtered,
    normalized,
    sampleRate: fs,
    log: { artifactSamplesReplaced: replaced, filtersApplied: applied, finalSampleCount: filtered.length, detectedSampleRate: fs }
  };
};
