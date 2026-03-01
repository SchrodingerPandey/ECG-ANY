import { useEffect, useRef } from 'react';
import type { AnalysisResult, ViewerSettings } from '../types/ecg.types';

export const useWaveformRenderer = (analysis: AnalysisResult | null, settings: ViewerSettings) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analysis) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const samples = analysis.signal.samples;
    const fs = analysis.signal.sampleRate;
    const start = Math.floor(settings.timeWindow * fs);
    const span = Math.floor(10 * fs / (settings.paperSpeed / 25));
    const end = Math.min(samples.length, start + span);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#080b0f';
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x < width; x += 8) {
      ctx.strokeStyle = x % 40 === 0 ? 'rgba(255,170,0,0.18)' : 'rgba(255,170,0,0.08)';
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 8) {
      ctx.strokeStyle = y % 40 === 0 ? 'rgba(255,170,0,0.18)' : 'rgba(255,170,0,0.08)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,255,136,0.45)';
    ctx.shadowBlur = 10;
    for (let i = start; i < end; i += 1) {
      const x = ((i - start) / Math.max(1, end - start - 1)) * width;
      const y = height / 2 - samples[i] * (height * 0.35) * settings.gain;
      if (i === start) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const drawMarker = (idx: number, color: string) => {
      if (idx < start || idx >= end) return;
      const x = ((idx - start) / Math.max(1, end - start - 1)) * width;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, 14);
      ctx.lineTo(x, height - 14);
      ctx.stroke();
    };

    analysis.fiducialPoints.forEach((f) => {
      if (settings.showP && f.P) drawMarker(f.P, '#00d4ff');
      if (settings.showQRS) drawMarker(f.R, '#00ff88');
      if (settings.showT && f.T) drawMarker(f.T, '#ffaa00');
    });
  }, [analysis, settings]);

  return { canvasRef };
};
