import { Upload } from 'lucide-react';

interface Props { onFile: (file: File) => void; }

export const DropZone = ({ onFile }: Props) => (
  <label className="dropzone" aria-label="Upload ECG file">
    <Upload size={30} />
    <p>Drop your ECG .txt/.csv file here or click to browse</p>
    <input type="file" accept=".txt,.csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
  </label>
);
