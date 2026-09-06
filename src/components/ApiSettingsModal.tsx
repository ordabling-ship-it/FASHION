import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Key, 
  Database, 
  CreditCard, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const ApiSettingsModal: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 text-left">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-2">
          <Settings className="w-3.5 h-3.5 text-zinc-400" />
          <span>Konfiguracja Środowiska & API</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Zewnętrzne API & Połączenia SaaS
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Aplikacja posiada gotowe moduły produkcyjne dla Stripe (BLIK / Apple Pay), AI VTON (Fal.ai, Replicate, Kling) oraz bazy Supabase.
        </p>
      </div>

      {/* Backend Status Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Stan Serwera Backend (Express + Vite Node.js)
            </h2>
          </div>
          <button
            type="button"
            onClick={checkHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Sprawdź status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Status API Health:</span>
            <span className="text-emerald-400 font-mono font-semibold">
              {healthData?.status === 'ok' ? '200 OK (Aktywny)' : 'Nawiązywanie...'}
            </span>
          </div>

          <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Port Serwera:</span>
            <span className="text-zinc-200 font-mono">3000 (0.0.0.0)</span>
          </div>
        </div>
      </div>

      {/* API Integrations Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stripe */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-400" />
              <h3 className="font-semibold text-zinc-200 text-sm">Stripe Payments</h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {healthData?.env?.hasStripeKey ? 'Live Mode' : 'Sandbox Active'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Obsługuje <strong>BLIK</strong> (Polska) oraz <strong>Apple Pay</strong> / Google Pay. W trybie sandbox symuluje natychmiastowe zatwierdzenie w aplikacji mobilnej banku.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-400">
            Zmienna: <code className="text-zinc-200">STRIPE_SECRET_KEY</code>
          </div>
        </div>

        {/* AI VTON Engines */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-zinc-200 text-sm">AI VTON & Kling Wideo</h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {healthData?.env?.hasReplicateToken || healthData?.env?.hasFalKey ? 'Live API' : 'Neural Fallback'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Algorytmy przymiarki CatVTON / IDM-VTON oraz generowania wideo w proporcji 9:16 (Kling AI / Fal.ai / Replicate).
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-400">
            Zmienne: <code className="text-zinc-200">REPLICATE_API_TOKEN</code>, <code className="text-zinc-200">FAL_KEY</code>
          </div>
        </div>

        {/* Supabase */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-zinc-200 text-sm">Baza Danych Supabase</h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              {healthData?.env?.hasSupabase ? 'Połączono' : 'Lokalny Rejestr'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Trwały magazyn ubrań, wygenerowanych rolek wideo 9:16 oraz ciasteczek sesyjnych dla scraperów Vinted i OLX.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-400">
            Zmienne: <code className="text-zinc-200">SUPABASE_URL</code>, <code className="text-zinc-200">SUPABASE_ANON_KEY</code>
          </div>
        </div>

        {/* Scrapers */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-zinc-200 text-sm">Scrapery Vinted / OLX</h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              Puppeteer Stealth
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automatyzacja formularzy i omijanie bot-shields (DataDome, Cloudflare Turnstile). Kod w folderze <code className="text-zinc-200">/scrapers</code>.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-400">
            Endpoint: <code className="text-zinc-200">POST /api/marketplace/list</code>
          </div>
        </div>
      </div>
    </div>
  );
};
