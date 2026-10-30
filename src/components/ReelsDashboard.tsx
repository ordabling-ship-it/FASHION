import React, { useCallback, useEffect, useState } from 'react';
import { FolderSearch, RefreshCw, Film, Wand2, Save, RotateCcw, Loader2 } from 'lucide-react';
import { ItemDto, JobDto, PublicConfigDto, STEP_LABELS, reelsApi } from '../lib/reelsApi';

const STATUS_STYLES: Record<ItemDto['status'], string> = {
  new: 'bg-white/10 text-white/70',
  processing: 'bg-sky-500/20 text-sky-300',
  awaiting_review: 'bg-amber-500/20 text-amber-300',
  done: 'bg-emerald-500/20 text-emerald-300',
  failed: 'bg-red-500/20 text-red-300',
};
const STATUS_LABEL: Record<ItemDto['status'], string> = {
  new: 'nowy',
  processing: 'w trakcie',
  awaiting_review: 'do akceptacji',
  done: 'gotowe',
  failed: 'błąd',
};

export const ReelsDashboard: React.FC<{ config: PublicConfigDto | null }> = ({ config }) => {
  const [items, setItems] = useState<ItemDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [{ items }, { jobs }] = await Promise.all([reelsApi.items(), reelsApi.jobs()]);
      setItems(items);
      setJobs(jobs);
    } catch (e: any) {
      setMessage(e.message);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [refresh]);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const itemJobs = jobs.filter((j) => j.itemId === selected?.id);
  const activeJob = itemJobs.find((j) => j.status === 'running' || j.status === 'queued');
  const lastJob = itemJobs[0];

  useEffect(() => {
    if (!dirty) setDraft(selected?.scriptText ?? '');
  }, [selected?.id, selected?.scriptText, dirty]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
      setMessage(ok);
      await refresh();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const wordCount = draft.split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Film className="w-5 h-5" /> Rolki z folderu
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            Wrzuć zdjęcia do <span className="text-white/70">{config?.inputDir ?? 'INPUT_DIR'}</span> (podfolder lub prefiks nazwy = jeden produkt).
            Wyniki: <span className="text-white/70">{config?.outputDir ?? 'OUTPUT_DIR'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={() => act(() => reelsApi.scan(), 'Przeskanowano folder.')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black text-xs font-semibold disabled:opacity-50">
            <FolderSearch className="w-4 h-4" /> Skanuj folder
          </button>
          <button type="button" onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs">
            <RefreshCw className="w-4 h-4" /> Odśwież
          </button>
        </div>
      </div>

      {message && <div className="mb-4 text-xs font-mono text-white/70 bg-white/5 border border-white/10 rounded-lg px-3 py-2">{message}</div>}

      {!items.length ? (
        <div className="text-center text-white/40 text-sm py-24 border border-dashed border-white/10 rounded-2xl">
          Brak produktów. Dodaj zdjęcia ubrań do folderu wejściowego albo użyj zakładki Studio.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <ul className="lg:col-span-3 space-y-2">
            {items.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(i.id);
                    setDirty(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${selected?.id === i.id ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="text-sm font-semibold truncate">{i.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-white/40">{i.photos.length} zdj.</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${STATUS_STYLES[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selected && (
            <>
              <div className="lg:col-span-4 flex flex-col items-center gap-2">
                <div className="w-full max-w-[320px] aspect-[9/16] bg-black rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                  {selected.reelUrl ? (
                    <video key={selected.reelUrl} src={selected.reelUrl} controls playsInline className="w-full h-full object-cover" />
                  ) : selected.tryOnImageUrl ? (
                    <img src={selected.tryOnImageUrl} alt="try-on" className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <span className="text-white/30 text-xs">Brak podglądu</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-white/40">Treść wygenerowana przez AI • 1080x1920</span>
              </div>

              <div className="lg:col-span-5 space-y-4">
                {(activeJob || lastJob) && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                    {(() => {
                      const j = activeJob ?? lastJob!;
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span>
                              {j.kind} • {j.status}
                              {j.currentStep && j.status === 'running' ? ` • ${STEP_LABELS[j.currentStep].pl}` : ''}
                            </span>
                            <span>{j.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${j.status === 'failed' ? 'bg-red-500' : 'bg-white'} transition-all`} style={{ width: `${j.progress}%` }} />
                          </div>
                          <pre className="text-[10px] text-white/50 max-h-28 overflow-auto whitespace-pre-wrap">
                            {j.logs.slice(-8).map((l) => `${l.at.slice(11, 19)} ${l.level} ${l.msg}`).join('\n')}
                          </pre>
                          {j.status === 'failed' && (
                            <button type="button" disabled={busy} onClick={() => act(() => reelsApi.retry(j.id), 'Ponowiono zadanie.')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 text-xs">
                              <RotateCcw className="w-3.5 h-3.5" /> Ponów
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="script" className="text-xs font-bold uppercase tracking-widest text-white/50">
                      Scenariusz (edytowalny)
                    </label>
                    <span className={`text-[10px] font-mono ${wordCount > 85 ? 'text-amber-300' : 'text-white/40'}`}>
                      {wordCount} słów ≈ {Math.round(wordCount / 2.6)} s
                    </span>
                  </div>
                  <textarea
                    id="script"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setDirty(true);
                    }}
                    rows={8}
                    placeholder="Scenariusz pojawi się po kroku 'script'."
                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white/90 focus:outline-none focus:border-white/40"
                  />
                  {selected.script && (
                    <p className="text-[11px] text-white/40 mt-1">
                      {selected.script.caption} {selected.script.hashtags.join(' ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy || !dirty || draft.trim().length < 10} onClick={() => act(async () => { await reelsApi.saveScript(selected.id, draft); setDirty(false); }, 'Zapisano scenariusz.')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-xs disabled:opacity-40">
                    <Save className="w-4 h-4" /> Zapisz
                  </button>
                  <button type="button" disabled={busy || Boolean(activeJob) || !selected.analysis} onClick={() => { setDirty(false); void act(() => reelsApi.regenerateScript(selected.id), 'Generuję nowy scenariusz…'); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 text-xs disabled:opacity-40">
                    <Wand2 className="w-4 h-4" /> Nowy scenariusz
                  </button>
                  <button type="button" disabled={busy || Boolean(activeJob) || !selected.scriptText || dirty} onClick={() => act(() => reelsApi.render(selected.id), 'Renderuję rolkę…')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-black text-xs font-semibold disabled:opacity-40">
                    {activeJob ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                    {selected.reelUrl ? 'Renderuj ponownie' : 'Renderuj rolkę'}
                  </button>
                </div>
                {dirty && <p className="text-[11px] text-amber-300">Zapisz zmiany przed renderowaniem.</p>}

                {selected.analysis && (
                  <details className="text-xs text-white/60 bg-white/5 border border-white/10 rounded-xl p-3">
                    <summary className="cursor-pointer font-semibold">Analiza ubrania</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-[11px]">{JSON.stringify(selected.analysis, null, 2)}</pre>
                  </details>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
