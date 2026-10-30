import React from 'react';
import { Film, Sparkles, ShoppingBag, Share2, Settings, Zap, ArrowRight } from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'reels' | 'storefront' | 'marketplace' | 'api-hub';
  setActiveTab: (tab: 'studio' | 'reels' | 'storefront' | 'marketplace' | 'api-hub') => void;
  productsCount: number;
  onQuickTrySample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  productsCount,
  onQuickTrySample,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <div className="w-4 h-4 bg-black rotate-45 transition-transform hover:rotate-90 duration-300"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tighter text-white">
                AURA<span className="text-white/50">AI</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                VTON
              </span>
            </div>
            <p className="text-[10px] text-white/40 hidden sm:block font-mono tracking-tight">Virtual Try-On • 9:16 Video • BLIK Checkout</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10 text-xs sm:text-sm">
          <button
            id="tab-studio"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio VTON</span>
          </button>

          <button
            id="tab-reels"
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'reels'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Rolki</span>
          </button>

          <button
            id="tab-storefront"
            onClick={() => setActiveTab('storefront')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'storefront'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Rolka & Sklep</span>
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
              activeTab === 'storefront' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'
            }`}>
              {productsCount}
            </span>
          </button>

          <button
            id="tab-marketplace"
            onClick={() => setActiveTab('marketplace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'marketplace'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Automatyzacja</span>
            <span>Vinted/OLX</span>
          </button>

          <button
            id="tab-api-hub"
            onClick={() => setActiveTab('api-hub')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'api-hub'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">API & Integracje</span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
          <button
            id="btn-quick-sample"
            onClick={onQuickTrySample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 border border-white/20 bg-white/5 hover:bg-white hover:text-black transition-all"
            title="Wczytaj przykładową jedwabną sukienkę lub garnitur"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Demo Preset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
