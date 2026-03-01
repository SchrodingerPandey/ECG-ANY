import { useState } from 'react';
import { TopBar } from './components/Layout/TopBar';
import { DropZone } from './components/Upload/DropZone';
import { ProcessingOverlay } from './components/Upload/ProcessingOverlay';
import { ECGCanvas } from './components/Waveform/ECGCanvas';
import { WaveformControls } from './components/Waveform/WaveformControls';
import { Cards } from './components/Dashboard/Cards';
import { SettingsDrawer } from './components/Settings/SettingsDrawer';
import { exportPeaksCsv, exportReport } from './components/Export/ExportMenu';
import { useECGAnalysis } from './hooks/useECGAnalysis';
import type { ViewerSettings } from './types/ecg.types';

const initialSettings: ViewerSettings = {
  paperSpeed: 25,
  gain: 1,
  timeWindow: 0,
  selectedLead: 0,
  showP: true,
  showQRS: true,
  showT: true
};

function App() {
  const { analysis, runAnalysis, processingSteps, leadOptions } = useECGAnalysis();
  const [settings, setSettings] = useState<ViewerSettings>(initialSettings);
  const [fileName, setFileName] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [sampleRateOverride, setSampleRateOverride] = useState<number>();

  const onFile = async (file: File) => {
    setLoading(true);
    setFileName(file.name);
    await runAnalysis(file, settings.selectedLead, sampleRateOverride);
    setLoading(false);
  };

  return (
    <div className="app">
      <TopBar fileName={fileName} onToggleSettings={() => setOpenSettings((v) => !v)} onExport={() => exportReport(analysis)} />
      <SettingsDrawer
        open={openSettings}
        sampleRateOverride={sampleRateOverride}
        onOverrideChange={setSampleRateOverride}
        leadOptions={leadOptions}
        selectedLead={settings.selectedLead}
        onLeadChange={(idx) => setSettings((s) => ({ ...s, selectedLead: idx }))}
      />

      {!analysis ? (
        <main className="upload-shell"><DropZone onFile={onFile} /></main>
      ) : (
        <main className="layout">
          <section className="left-panel glass">
            <ECGCanvas analysis={analysis} settings={settings} />
            <WaveformControls settings={settings} onChange={(part) => setSettings((s) => ({ ...s, ...part }))} maxTime={analysis.signal.durationSeconds} />
            <div className="bottom-bar">
              Fs {analysis.signal.sampleRate} Hz · Duration {analysis.signal.durationSeconds.toFixed(1)} s · Samples {analysis.signal.samples.length}
              <button aria-label="Export peaks CSV" onClick={() => exportPeaksCsv(analysis)}>Export Peaks CSV</button>
            </div>
          </section>
          <aside className="right-panel"><Cards analysis={analysis} /></aside>
        </main>
      )}

      {loading && <ProcessingOverlay steps={processingSteps} />}
    </div>
  );
}

export default App;
