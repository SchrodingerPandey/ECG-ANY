export interface BiquadCoefficients {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

const clampFreq = (f: number, fs: number) => Math.min(fs / 2 - 1, Math.max(0.001, f));

export const designNotch = (f0: number, q: number, fs: number): BiquadCoefficients => {
  const w0 = (2 * Math.PI * clampFreq(f0, fs)) / fs;
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = 1;
  const b1 = -2 * Math.cos(w0);
  const b2 = 1;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
};

export const designLowPass = (fc: number, fs: number, q = Math.SQRT1_2): BiquadCoefficients => {
  const w0 = (2 * Math.PI * clampFreq(fc, fs)) / fs;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const b0 = (1 - c) / 2;
  const b1 = 1 - c;
  const b2 = (1 - c) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * c;
  const a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
};

export const designHighPass = (fc: number, fs: number, q = Math.SQRT1_2): BiquadCoefficients => {
  const w0 = (2 * Math.PI * clampFreq(fc, fs)) / fs;
  const alpha = Math.sin(w0) / (2 * q);
  const c = Math.cos(w0);
  const b0 = (1 + c) / 2;
  const b1 = -(1 + c);
  const b2 = (1 + c) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * c;
  const a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
};

export const applyBiquad = (input: Float32Array, c: BiquadCoefficients): Float32Array => {
  const out = new Float32Array(input.length);
  let x1 = 0; let x2 = 0; let y1 = 0; let y2 = 0;
  for (let i = 0; i < input.length; i += 1) {
    const x0 = input[i];
    const y0 = c.b0 * x0 + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    out[i] = y0;
    x2 = x1; x1 = x0; y2 = y1; y1 = y0;
  }
  return out;
};

export const chainBiquads = (input: Float32Array, coeffs: BiquadCoefficients[]): Float32Array =>
  coeffs.reduce((acc, biquad) => applyBiquad(acc, biquad), input);

export const resampleLinear = (samples: Float32Array, fromFs: number, toFs: number): Float32Array => {
  if (fromFs === toFs) return samples;
  const newLength = Math.max(1, Math.floor((samples.length * toFs) / fromFs));
  const out = new Float32Array(newLength);
  for (let i = 0; i < newLength; i += 1) {
    const sourcePos = (i * fromFs) / toFs;
    const lo = Math.floor(sourcePos);
    const hi = Math.min(samples.length - 1, lo + 1);
    const frac = sourcePos - lo;
    out[i] = samples[lo] * (1 - frac) + samples[hi] * frac;
  }
  return out;
};
