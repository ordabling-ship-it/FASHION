import React from 'react';
import { 
  Share2, 
  ExternalLink, 
  TrendingUp, 
  Eye, 
  CheckCircle2, 
  Clock, 
  ShoppingBag,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ProductItem } from '../types';

interface MarketplaceDashboardProps {
  products: ProductItem[];
  onOpenSyncModal: (product: ProductItem) => void;
  onGoToStudio: () => void;
}

export const MarketplaceDashboard: React.FC<MarketplaceDashboardProps> = ({
  products,
  onOpenSyncModal,
  onGoToStudio,
}) => {
  const totalViews = products.reduce((acc, p) => {
    const vintedViews = p.vintedListing?.views || 0;
    const olxViews = p.olxListing?.views || 0;
    return acc + vintedViews + olxViews;
  }, 0);

  const activeVintedCount = products.filter((p) => p.vintedListing?.status === 'synced').length;
  const activeOlxCount = products.filter((p) => p.olxListing?.status === 'synced').length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 mb-2">
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Multichannel Syndication Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
            Zarządzanie Ofertami: Vinted & OLX
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Automatycznie synchronizuj wygenerowane rolki 9:16 i opisy z największymi marketplace'ami w Polsce.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToStudio}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj nowe ubranie</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Łączne wyświetlenia</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100">
            {totalViews + 640} <span className="text-xs text-emerald-400 font-sans font-medium">+24% dziś</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Aktywne na Vinted.pl</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100">
            {activeVintedCount} <span className="text-xs text-zinc-400 font-sans font-normal">ofert</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-2">
            <span>Aktywne na OLX.pl</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-zinc-100">
            {activeOlxCount} <span className="text-xs text-zinc-400 font-sans font-normal">ogłoszeń</span>
          </div>
        </div>
      </div>

      {/* Product Listings Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
            Katalog Produktów i Status Wystawień
          </h2>
          <span className="text-xs text-zinc-400">
            {products.length} pozycji w bazie
          </span>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {products.map((item) => {
            return (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-800/20 transition">
                {/* Product Info */}
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex-shrink-0">
                    <img
                      src={item.tryOnPhotoUrl || item.originalGarmentPhotoUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                      9:16
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-zinc-100">{item.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {item.size}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {item.brand} • {item.category} • <strong className="text-zinc-200 font-mono">{item.pricePln.toFixed(2)} zł</strong>
                    </p>
                  </div>
                </div>

                {/* Multichannel Status Badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Vinted Status */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-medium text-zinc-300">Vinted:</span>
                    {item.vintedListing?.status === 'synced' ? (
                      <a
                        href={item.vintedListing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <span>Aktywne ({item.vintedListing.views} views)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400">Nie wystawiono</span>
                    )}
                  </div>

                  {/* OLX Status */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-medium text-zinc-300">OLX:</span>
                    {item.olxListing?.status === 'synced' ? (
                      <a
                        href={item.olxListing.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <span>Aktywne ({item.olxListing.views} views)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400">Nie wystawiono</span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => onOpenSyncModal(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Wystaw / Synchronizuj</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
