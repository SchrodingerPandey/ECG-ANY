import { useMemo, useState } from 'react';
import { parseECGText } from '../engine/parser';
import { preprocessSignal } from '../engine/preprocessor';
import { detectRPeaks } from '../engine/panTompkins';
import { detectWaves } from '../engine/waveDetection';
import { measureIntervals } from '../engine/intervalMeasurement';
import { computeHRV } from '../engine/hrv';
import { analyzeST, mapSTToBeats } from '../engine/stAnalysis';
import { computeSQI } from '../engine/sqi';
import { classifyRhythm } from '../engine/rhythmClassifier';
import type { AnalysisResult } from '../types/ecg.types';

const mean = (x: number[]) => x.reduce((a, b) => a + b, 0) / Math.max(1, x.length);

export const useECGAnalysis = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [leadOptions, setLeadOptions] = useState<string[]>([]);

  const runAnalysis = async (file: File, leadIndex = 0, sampleRateOverride?: number) => {
    setProcessingSteps(['Parsing file…']);
    const text = await file.text();
    const parsed = parseECGText(text);
    setLeadOptions(parsed.leadNames);

    setProcessingSteps((s) => [...s, 'Cleaning artifacts…', 'Filtering signal…']);
    const originalFs = sampleRateOverride ?? parsed.sampleRateHint ?? 500;
    const selectedLead = parsed.leads[Math.min(leadIndex, parsed.leads.length - 1)];
    const pre = preprocessSignal(selectedLead, { sampleRate: originalFs, targetSampleRate: 500, powerlineMode: 'both' });

    setProcessingSteps((s) => [...s, 'Detecting peaks…']);
    const rPeaks = detectRPeaks(pre.normalized, pre.sampleRate);
    const fid = detectWaves(pre.normalized, rPeaks, pre.sampleRate);
    const intervals = measureIntervals(fid, pre.sampleRate);
    const meanHR = mean(intervals.map((b) => b.hr_bpm));
    const hrv = computeHRV(intervals.map((b) => b.rr_ms));
    const st = analyzeST(pre.normalized, fid, pre.sampleRate, meanHR);
    const beatMeasurements = mapSTToBeats(intervals, st);
    const sqi = computeSQI(selectedLead, pre.filtered, rPeaks, pre.sampleRate);
    const rhythm = classifyRhythm(meanHR, beatMeasurements, fid, sqi);

    const events = beatMeasurements
      .filter((b) => b.isEctopic)
      .map((b) => ({ timestamp_s: (fid[b.beatIndex]?.R ?? 0) / pre.sampleRate, description: `PVC candidate at beat ${b.beatIndex}`, severity: 'warning' as const }));

    setProcessingSteps((s) => [...s, 'Analysis complete ✓']);
    setAnalysis({
      signal: {
        samples: pre.normalized,
        sampleRate: pre.sampleRate,
        durationSeconds: pre.normalized.length / pre.sampleRate,
        unit: 'normalized',
        leadName: parsed.leadNames[leadIndex]
      },
      preprocessingLog: { ...parsed.log, ...pre.log, warnings: parsed.log.warnings },
      fiducialPoints: fid,
      beatMeasurements,
      meanHR,
      hrv,
      rhythmClassification: rhythm.rhythm,
      rhythmConfidence: rhythm.confidence,
      stAnalysis: st,
      sqi,
      events
    });
  };

  return useMemo(() => ({ analysis, runAnalysis, processingSteps, leadOptions }), [analysis, processingSteps, leadOptions]);
};
