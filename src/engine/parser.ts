import type { ParseResult } from '../types/ecg.types';

const NUMERIC_REGEX = /[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g;

const detectDelimiter = (lines: string[]): string => {
  const delimiters = ['\t', ',', ';', ' '];
  let best = ' ';
  let bestScore = -Infinity;
  for (const delim of delimiters) {
    const counts = lines.slice(0, 50).map((line) => line.split(delim).filter(Boolean).length);
    const mean = counts.reduce((a, b) => a + b, 0) / Math.max(1, counts.length);
    const variance = counts.reduce((acc, count) => acc + (count - mean) ** 2, 0) / Math.max(1, counts.length);
    const score = mean - variance;
    if (score > bestScore) {
      bestScore = score;
      best = delim;
    }
  }
  return best;
};

const shouldStripLine = (line: string): boolean => {
  const l = line.trim();
  if (!l) return true;
  if (/^(patient|date|time|lead|sample|hz|gain|channel|#|;)/i.test(l)) return true;
  if (/^[^0-9\-+\.eE]+$/.test(l)) return true;
  if (/^[^,:=]+\s*[:=,]\s*[^0-9\-+\.eE]+/i.test(l)) return true;
  return false;
};

export const parseECGText = (text: string): ParseResult => {
  const lines = text.split(/\r?\n/);
  const strippedLines: string[] = [];
  const kept: string[] = [];

  let sampleRateHint: number | undefined;
  lines.slice(0, 80).forEach((line) => {
    const m = line.match(/(?:fs|samplerate|sample\s*rate)\s*[:=]\s*(\d+(?:\.\d+)?)/i);
    if (m) sampleRateHint = Number(m[1]);
  });

  lines.forEach((line, idx) => {
    if (idx < 50 && shouldStripLine(line)) {
      strippedLines.push(line);
      return;
    }
    kept.push(line);
  });

  const nonEmpty = kept.filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiter(nonEmpty);
  const rawRows = nonEmpty
    .map((line) => {
      const tokens = delimiter === ' '
        ? line.trim().split(/\s+/)
        : line.split(delimiter).map((t) => t.trim());
      const numbers = tokens.flatMap((token) => (token.match(NUMERIC_REGEX) ?? []).map(Number));
      return numbers;
    })
    .filter((row) => row.length > 0);

  if (!rawRows.length) {
    throw new Error('No parseable numeric data found.');
  }

  const firstCol = rawRows.slice(0, 100).map((r) => r[0]);
  const monotonicIndex = firstCol.length > 10 && firstCol.every((v, i, arr) => i === 0 || Number.isInteger(v) && v > arr[i - 1]);

  const processedRows = rawRows.map((row) => (monotonicIndex ? row.slice(1) : row)).filter((row) => row.length > 0);
  const width = Math.max(...processedRows.map((r) => r.length));
  const leads: Float32Array[] = [];

  for (let i = 0; i < width; i += 1) {
    const leadSamples = processedRows.map((row) => row[Math.min(i, row.length - 1)]);
    leads.push(Float32Array.from(leadSamples));
  }

  return {
    leads,
    leadNames: leads.map((_, i) => `Lead ${i + 1}`),
    sampleRateHint,
    log: {
      originalLineCount: lines.length,
      headerLinesRemoved: strippedLines.length,
      indexColumnsRemoved: monotonicIndex,
      warnings: [],
      strippedLines
    }
  };
};
