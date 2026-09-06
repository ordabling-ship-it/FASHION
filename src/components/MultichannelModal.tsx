import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  CheckCircle2, 
  ExternalLink, 
  Terminal, 
  ShieldAlert, 
  Code2, 
  Sparkles, 
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ProductItem } from '../types';

interface MultichannelModalProps {
  isOpen: boolean;
  product: ProductItem;
  onClose: () => void;
  onSyncComplete?: (results: any) => void;
}

export const MultichannelModal: React.FC<MultichannelModalProps> = ({
  isOpen,
  product,
  onClose,
  onSyncComplete,
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<('vinted' | 'olx')[]>(['vinted', 'olx']);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'code'>('status');

  const [logs, setLogs] = useState<string[]>([]);
  const [vintedResult, setVintedResult] = useState<{ id: string; url: string } | null>(
    product.vintedListing ? { id: product.vintedListing.id, url: product.vintedListing.url } : null
  );
  const [olxResult, setOlxResult] = useState<{ id: string; url: string } | null>(
    product.olxListing ? { id: product.olxListing.id, url: product.olxListing.url } : null
  );

  if (!isOpen) return null;

  const togglePlatform = (p: 'vinted' | 'olx') => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((x) => x !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleStartSync = async () => {
    setIsRunning(true);
    setLogs([
      `[${new Date().toLocaleTimeString()}] Rozpoczęcie procesu automatyzacji dla przedmiotu: "${product.title}"...`,
      `[${new Date().toLocaleTimeString()}] Platformy docelowe: ${selectedPlatforms.map((s) => s.toUpperCase()).join(', ')}`,
    ]);

    try {
      const res = await fetch('/api/marketplace/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product,
          platforms: selectedPlatforms,
        }),
      });
      const data = await res.json();

      if (data.results?.vinted) {
        setLogs((prev) => [...prev, ...data.results.vinted.logs]);
        setVintedResult({
          id: data.results.vinted.listingId,
          url: data.results.vinted.itemUrl,
        });
      }

      if (data.results?.olx) {
        setLogs((prev) => [...prev, ...data.results.olx.logs]);
        setOlxResult({
          id: data.results.olx.listingId,
          url: data.results.olx.itemUrl,
        });
      }

      if (onSyncComplete) {
        onSyncComplete(data.results);
      }
    } catch (err: any) {
      setLogs((prev) => [
        ...prev,
        `[Błąd połączenia API] ${err.message || 'Nie udało się połączyć z backendem scrapera'}`,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden my-6 text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">Marketplace Sync Automation</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
                HEADLESS ENGINE
              </span>
            </div>
            <p className="text-xs text-white/50">
              Automated listing generator for Vinted & OLX with session persistence.
            </p>
          </div>
        </div>

        {/* View Switcher: Live Runner vs Technical Scraper Code */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'status'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/50 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>RUNNER_CONSOLE</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'code'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/50 hover:text-white bg-white/5 border border-white/10'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>ARCHITECTURE</span>
            </button>
          </div>

          <div className="text-[11px] text-white/40 font-mono flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-white/60" />
            <span>Anti-bot stealth</span>
          </div>
        </div>

        {activeTab === 'status' ? (
          <div className="space-y-5">
            {/* Target Platforms Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Vinted Tile */}
              <div
                onClick={() => togglePlatform('vinted')}
                className={`cursor-pointer p-4 rounded-xl border transition relative ${
                  selectedPlatforms.includes('vinted')
                    ? 'border-white/40 bg-white/10 shadow-sm'
                    : 'border-white/10 bg-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="font-bold text-sm text-white">Vinted.pl</span>
                  </div>
                  {vintedResult && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SYNCED
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50">
                  Category matching, size mapping, and automated photo payload injection.
                </p>
                {vintedResult && (
                  <a
                    href={vintedResult.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-white hover:underline font-mono mt-3"
                  >
                    <span>Open Vinted Listing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* OLX Tile */}
              <div
                onClick={() => togglePlatform('olx')}
                className={`cursor-pointer p-4 rounded-xl border transition relative ${
                  selectedPlatforms.includes('olx')
                    ? 'border-white/40 bg-white/10 shadow-sm'
                    : 'border-white/10 bg-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-bold text-sm text-white">OLX.pl</span>
                  </div>
                  {olxResult && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> SYNCED
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50">
                  OLX shipping activated, automated price negotiation settings.
                </p>
                {olxResult && (
                  <a
                    href={olxResult.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-white hover:underline font-mono mt-3"
                  >
                    <span>Open OLX Listing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Run Button */}
            <div>
              <button
                type="button"
                onClick={handleStartSync}
                disabled={isRunning || selectedPlatforms.length === 0}
                className="w-full py-3.5 rounded-lg bg-white hover:bg-white/90 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Executing Headless Multi-Listing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>
                      Trigger Automation on {selectedPlatforms.map((s) => s.toUpperCase()).join(' & ')}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Live Terminal Log Viewer */}
            <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-xs text-white/70 space-y-1 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] text-white/40 border-b border-white/10 pb-2 mb-2">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-white/40" />
                  <span>Execution Logs (Puppeteer / Playwright)</span>
                </span>
                <span className="text-[10px] text-emerald-400">READY</span>
              </div>
              {logs.length === 0 ? (
                <p className="text-white/40 italic">
                  Press the button above to launch headless browser automation and session dispatch.
                </p>
              ) : (
                logs.map((line, idx) => (
                  <p key={idx} className="leading-relaxed">
                    <span className="text-white/40 select-none">&gt; </span>
                    <span className={line.includes('Pomyślnie') || line.includes('Sukces') ? 'text-white font-semibold' : ''}>
                      {line}
                    </span>
                  </p>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Scraper Architecture Technical Breakdown */
          <div className="space-y-4 text-xs text-white/70">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-white/60" />
                <span>Headless Architecture Strategy</span>
              </h4>
              <p className="text-white/50 leading-relaxed">
                Because neither Vinted nor OLX provides a public individual merchant REST API, the backend module in <code className="text-white bg-black px-1.5 py-0.5 rounded font-mono border border-white/10">/scrapers</code> runs <strong>Headless Chromium (Playwright / Puppeteer-Extra)</strong> with custom stealth plugins.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <p className="font-semibold text-white mb-1">1. Session Deserialization</p>
                <p className="text-[11px] text-white/50">
                  Cookie jars (<code className="text-white">_vinted_fr_session</code> and OLX tokens) are injected into the browser context prior to navigating to the form.
                </p>
              </div>

              <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <p className="font-semibold text-white mb-1">2. Anti-Bot Evasion</p>
                <p className="text-[11px] text-white/50">
                  Canvas/WebGL spoofing, human-like typing delays, and Bézier mouse curves prevent automated flags.
                </p>
              </div>
            </div>

            <div className="bg-black/60 p-3.5 rounded-xl border border-white/10 font-mono text-[11px] text-white/40">
              <div className="text-white font-semibold mb-1">// Scraper Module Endpoints:</div>
              <div>• /scrapers/vintedScraper.ts - Vinted listing pipeline</div>
              <div>• /scrapers/olxScraper.ts - OLX listing form pipeline</div>
              <div>• /server.ts - POST /api/marketplace/list proxy route</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
