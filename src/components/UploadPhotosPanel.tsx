import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { reelsApi } from '../lib/reelsApi';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
const OK_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;

/** Upload up to N photos of one garment at once (alternative to the watched folder). */
export const UploadPhotosPanel: React.FC<{ maxFiles: number; onUploaded: (itemId: string) => void }> = ({ maxFiles, onUploaded }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => OK_EXT.test(f.name) || f.type.startsWith('image/'));
    const next = [...files, ...picked];
    setError(next.length > maxFiles ? `Maksymalnie ${maxFiles} zdjęć na produkt.` : null);
    setFiles(next.slice(0, maxFiles));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await reelsApi.upload(files, { name, price });
      setFiles([]);
      setName('');
      setPrice('');
      onUploaded(res.itemId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/30 text-xs cursor-pointer hover:bg-white/5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="w-4 h-4" /> Wybierz lub upuść do {maxFiles} zdjęć jednego produktu
          <input type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nazwa (opcjonalnie)" className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs w-48" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Cena" inputMode="decimal" className="bg-black border border-white/10 rounded-lg px-3 py-2 text-xs w-24" />
        <button type="button" disabled={busy || !files.length} onClick={submit} className="px-3 py-2 rounded-lg bg-white text-black text-xs font-semibold disabled:opacity-40">
          {busy ? 'Wysyłam…' : `Utwórz rolkę (${files.length}/${maxFiles})`}
        </button>
      </div>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1 text-[11px] bg-white/10 rounded px-2 py-1">
              {f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)
              <button type="button" aria-label="Usuń" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-white/40 mt-2">Za duże zdjęcia i HEIC są automatycznie obracane, zmniejszane i konwertowane (oryginał zostaje).</p>
      {error && <p className="text-xs text-red-300 mt-2">{error}</p>}
    </div>
  );
};
