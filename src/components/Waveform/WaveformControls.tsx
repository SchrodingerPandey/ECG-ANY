import type { ViewerSettings } from '../../types/ecg.types';

export const WaveformControls = ({ settings, onChange, maxTime }: { settings: ViewerSettings; onChange: (v: Partial<ViewerSettings>) => void; maxTime: number }) => (
  <div className="controls">
    <select aria-label="Paper speed" value={settings.paperSpeed} onChange={(e) => onChange({ paperSpeed: Number(e.target.value) as ViewerSettings['paperSpeed'] })}>
      {[6.25, 12.5, 25, 50].map((v) => <option key={v} value={v}>{v} mm/s</option>)}
    </select>
    <select aria-label="Gain" value={settings.gain} onChange={(e) => onChange({ gain: Number(e.target.value) as ViewerSettings['gain'] })}>
      {[0.5, 1, 2, 4].map((v) => <option key={v} value={v}>{v}x</option>)}
    </select>
    <label><input type="checkbox" checked={settings.showP} onChange={(e) => onChange({ showP: e.target.checked })} />P</label>
    <label><input type="checkbox" checked={settings.showQRS} onChange={(e) => onChange({ showQRS: e.target.checked })} />QRS</label>
    <label><input type="checkbox" checked={settings.showT} onChange={(e) => onChange({ showT: e.target.checked })} />T</label>
    <input aria-label="Time window" type="range" min={0} max={Math.max(0, maxTime - 1)} step={0.1} value={settings.timeWindow} onChange={(e) => onChange({ timeWindow: Number(e.target.value) })} />
  </div>
);
