import { Activity, Download, Settings } from 'lucide-react';

interface Props {
  fileName?: string;
  onToggleSettings: () => void;
  onExport: () => void;
}

export const TopBar = ({ fileName, onToggleSettings, onExport }: Props) => (
  <header className="topbar">
    <div className="brand"><Activity size={18} /> CARDIO·LENS</div>
    <div className="status">{fileName ? `Loaded: ${fileName}` : 'Awaiting ECG file upload'}</div>
    <div className="actions">
      <button aria-label="Export report" onClick={onExport}><Download size={16} /></button>
      <button aria-label="Open settings" onClick={onToggleSettings}><Settings size={16} /></button>
    </div>
  </header>
);
