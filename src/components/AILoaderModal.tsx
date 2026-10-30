import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';
import { TryOnGenerationConfig } from '../types';
import { JobDto, STEP_LABELS, reelsApi } from '../lib/reelsApi';

interface AILoaderModalProps {
  isOpen: boolean;
  config: TryOnGenerationConfig | null;
  /** Job id returned by /api/vton/generate. Progress is read from /api/jobs/:id (no fake timers). */
  jobId: string | null;
  error?: string | null;
  onComplete: (job: JobDto) => void;
  onClose: () => void;
}

export const AILoaderModal: React.FC<AILoaderModalProps> = ({ isOpen, config, jobId, error, onComplete, onClose }) => {
  const [job, setJob] = useState<JobDto | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) {
      setJob(null);
      setPollError(null);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const { job } = await reelsApi.job(jobId);
        if (cancelled) return;
        setJob(job);
        if (job.status === 'completed') {
          setTimeout(() => !cancelled && onComplete(job), 500);
          return;
        }
        if (job.status === 'failed') return;
      } catch (e: any) {
        if (!cancelled) setPollError(e.message);
      }
      timer = setTimeout(tick, 1000);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, jobId, onComplete]);

  if (!isOpen || !config) return null;

  const progress = job?.progress ?? 0;
  const steps = job?.steps ?? [];
  const current = job?.currentStep ? STEP_LABELS[job.currentStep] : null;
  const failed = job?.status === 'failed' || Boolean(error) || Boolean(pollError);
  const lastLog = job?.logs.at(-1)?.msg;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center">
        <div className="relative w-36 h-36 flex items-center justify-center mx-auto my-3">
          <div className="absolute inset-0 border border-white/10 rounded-full" />
          {!failed && <div className="absolute inset-4 border border-dashed border-white/30 rounded-full animate-spin [animation-duration:12s]" />}
          <div className="text-center z-10">
            <div className="text-3xl font-light text-white font-mono">{progress}%</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-mono">{job?.status ?? 'queued'}</div>
          </div>
        </div>

        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/60">
            <Sparkles className="w-3 h-3 text-white/80" />
            <span>Reels pipeline 9:16</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {failed ? 'Generowanie nie powiodło się' : current?.pl ?? (job?.status === 'completed' ? 'Gotowe!' : 'W kolejce…')}
          </h2>
          <p className="text-xs text-white/50 max-w-sm mx-auto">{failed ? error ?? pollError ?? job?.error : current?.detail ?? lastLog}</p>
        </div>

        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-5">
          <div className={`h-full transition-all duration-500 rounded-full ${failed ? 'bg-red-500' : 'bg-white'}`} style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-2 text-left bg-white/5 p-3.5 rounded-xl border border-white/10 font-mono">
          {steps.map((step) => {
            const done = job?.completedSteps.includes(step);
            const isCurrent = job?.currentStep === step && job.status === 'running';
            const isFailed = job?.status === 'failed' && job.currentStep === step;
            return (
              <div key={step} className={`flex items-center gap-2.5 text-[11px] ${done ? 'text-white/80' : isCurrent ? 'text-white font-semibold' : 'text-white/30'}`}>
                {done ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : isFailed ? (
                  <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                )}
                <span className="truncate">{STEP_LABELS[step].pl}</span>
              </div>
            );
          })}
          {!steps.length && <div className="text-[11px] text-white/40">Czekam na zadanie…</div>}
        </div>

        {failed && (
          <button type="button" onClick={onClose} className="mt-4 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold">
            Zamknij (ponów w zakładce Rolki)
          </button>
        )}

        <div className="mt-4 text-[10px] font-mono text-white/40 flex items-center justify-center gap-1.5">
          {failed ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5 text-white/40" />}
          <span>Treść wygenerowana przez AI • postęp z /api/jobs</span>
        </div>
      </div>
    </div>
  );
};
