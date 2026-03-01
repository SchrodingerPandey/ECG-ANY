interface Props { steps: string[]; }

export const ProcessingOverlay = ({ steps }: Props) => (
  <div className="overlay">
    <div className="panel">
      <h3>Preprocessing Pipeline</h3>
      <ul>{steps.map((s) => <li key={s}>{s}</li>)}</ul>
    </div>
  </div>
);
