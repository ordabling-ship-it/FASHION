import React, { useEffect, useState } from 'react';
import { Sparkles, Video, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TryOnGenerationConfig } from '../types';

interface AILoaderModalProps {
  isOpen: boolean;
  config: TryOnGenerationConfig | null;
  onComplete: () => void;
}

const GENERATION_STEPS = [
  {
    title: 'Segmentacja tkaniny & Masking',
    detail: 'Wycinanie tła, analiza tekstury materiału i punktów kluczowych sylwetki.',
    duration: 1200,
  },
  {
    title: 'Nakładanie VTON na wirtualnego modela',
    detail: 'Dopasowanie fałd, światłocienia i proporcji tkaniny do modela (CatVTON / IDM-VTON).',
    duration: 1600,
  },
  {
    title: 'Synteza wideo 9:16 w ruchu (Kling / Fal.ai)',
    detail: 'Renderowanie dynamicznego kroku modela w formacie pionowym 1080x1920 30FPS.',
    duration: 1800,
  },
  {
    title: 'Generowanie Landing Page & Checkout BLIK',
    detail: 'Konfiguracja formularza płatności Apple Pay/BLIK i mostka scrapingowego Vinted & OLX.',
    duration: 1000,
  },
];

export const AILoaderModal: React.FC<AILoaderModalProps> = ({
  isOpen,
  config,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  useEffect(() => {
    if (progress < 25) {
      setCurrentStepIndex(0);
    } else if (progress < 55) {
      setCurrentStepIndex(1);
    } else if (progress < 85) {
      setCurrentStepIndex(2);
    } else {
      setCurrentStepIndex(3);
    }
  }, [progress]);

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center">
        {/* Subtle ambient light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />

        {/* Sleek Interface Radar Container */}
        <div className="relative w-44 h-44 flex items-center justify-center mx-auto my-3">
          <div className="absolute inset-0 border border-white/10 rounded-full animate-pulse" />
          <div className="absolute inset-3 border border-white/20 rounded-full" />
          <div className="absolute inset-6 border border-dashed border-white/30 rounded-full animate-spin [animation-duration:12s]" />
          <div className="text-center z-10">
            <div className="text-3xl font-light text-white font-mono">{progress}%</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-mono">AI_SYNTHESIS</div>
            <div className="flex gap-1.5 justify-center mt-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
              <span className="w-1.5 h-1.5 bg-white rounded-full opacity-40 animate-pulse" />
              <span className="w-1.5 h-1.5 bg-white rounded-full opacity-20" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase text-white/60">
            <Sparkles className="w-3 h-3 text-white/80" />
            <span>AI Neural Pipeline 9:16</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {GENERATION_STEPS[currentStepIndex].title}
          </h2>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            {GENERATION_STEPS[currentStepIndex].detail}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
            <span>Neural VTON Engine</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-150 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step List Indicators */}
        <div className="space-y-2 text-left bg-white/5 p-3.5 rounded-xl border border-white/10 font-mono">
          {GENERATION_STEPS.map((step, idx) => {
            const isDone = currentStepIndex > idx || progress === 100;
            const isCurrent = currentStepIndex === idx && progress < 100;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 text-xs transition-opacity ${
                  isDone
                    ? 'text-white/80'
                    : isCurrent
                    ? 'text-white font-semibold'
                    : 'text-white/30'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                ) : isCurrent ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" />
                )}
                <span className="truncate text-[11px]">{step.title}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[10px] font-mono text-white/40 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
          <span>Automated 9:16 vertical export • Fast BLIK Checkout setup</span>
        </div>
      </div>
    </div>
  );
};
