import { useWaveformRenderer } from '../../hooks/useWaveformRenderer';
import type { AnalysisResult, ViewerSettings } from '../../types/ecg.types';

export const ECGCanvas = ({ analysis, settings }: { analysis: AnalysisResult | null; settings: ViewerSettings }) => {
  const { canvasRef } = useWaveformRenderer(analysis, settings);
  return <canvas ref={canvasRef} className="ecg-canvas" aria-label="ECG waveform canvas" />;
};
