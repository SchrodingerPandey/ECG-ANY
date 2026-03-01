interface Props {
  open: boolean;
  sampleRateOverride?: number;
  onOverrideChange: (v?: number) => void;
  leadOptions: string[];
  selectedLead: number;
  onLeadChange: (idx: number) => void;
}

export const SettingsDrawer = ({ open, sampleRateOverride, onOverrideChange, leadOptions, selectedLead, onLeadChange }: Props) => (
  <aside className={`settings ${open ? 'open' : ''}`}>
    <h3>Settings</h3>
    <label>Sample Rate Override
      <input aria-label="Sample rate override" type="number" placeholder="Auto" value={sampleRateOverride ?? ''} onChange={(e) => onOverrideChange(e.target.value ? Number(e.target.value) : undefined)} />
    </label>
    <label>Lead Selection
      <select aria-label="Lead selection" value={selectedLead} onChange={(e) => onLeadChange(Number(e.target.value))}>
        {leadOptions.map((lead, i) => <option key={lead} value={i}>{lead}</option>)}
      </select>
    </label>
  </aside>
);
