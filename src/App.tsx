import React, { useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { VideoPlayer } from './components/VideoPlayer';
import { ProductOverlay } from './components/ProductOverlay';
import { AILoaderModal } from './components/AILoaderModal';
import { CheckoutModal } from './components/CheckoutModal';
import { MultichannelModal } from './components/MultichannelModal';
import { MarketplaceDashboard } from './components/MarketplaceDashboard';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { ReelsDashboard } from './components/ReelsDashboard';
import { DemoBanner } from './components/DemoBanner';
import { JobDto, PublicConfigDto, reelsApi } from './lib/reelsApi';
import { SAMPLE_PRODUCTS, PRESET_GARMENTS } from './data/sampleProducts';
import { ProductItem, TryOnGenerationConfig } from './types';
import { Sparkles, ChevronLeft, ChevronRight, Film, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'reels' | 'storefront' | 'marketplace' | 'api-hub'>('studio');
  const [products, setProducts] = useState<ProductItem[]>(SAMPLE_PRODUCTS);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);

  // Modals state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGenerationConfig, setCurrentGenerationConfig] = useState<TryOnGenerationConfig | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMultichannelOpen, setIsMultichannelOpen] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<PublicConfigDto | null>(null);

  useEffect(() => {
    reelsApi.config().then(setAppConfig).catch(() => setAppConfig(null));
  }, []);
  const [targetSyncProduct, setTargetSyncProduct] = useState<ProductItem | null>(null);

  const currentProduct = products[selectedProductIndex] || products[0];

  const handleStartGeneration = async (config: TryOnGenerationConfig) => {
    setCurrentGenerationConfig(config);
    setGenerationError(null);
    setGenerationJobId(null);
    setIsGenerating(true);

    try {
      // Saves the photo into INPUT_DIR and enqueues the same pipeline used for the watched folder.
      const res = await fetch('/api/vton/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setGenerationJobId(data.jobId);
    } catch (err: any) {
      console.error('Błąd podczas generowania rolki:', err);
      setGenerationError(err.message || 'Błąd generowania');
    }
  };

  const handleGenerationModalComplete = useCallback(
    async (job: JobDto) => {
      setIsGenerating(false);
      setGenerationJobId(null);
      try {
        const { item } = await reelsApi.item(job.itemId);
        if (!item.reelUrl) {
          // REVIEW_BEFORE_RENDER: script is ready for editing in the dashboard.
          setActiveTab('reels');
          return;
        }
        const cfg = currentGenerationConfig;
        const product: ProductItem = {
          id: item.id,
          title: item.name,
          description: item.script?.caption ?? cfg?.description ?? '',
          pricePln: item.info.price ?? cfg?.pricePln ?? 0,
          size: cfg?.size ?? 'M',
          category: cfg?.category ?? 'Sukienki',
          condition: cfg?.condition ?? 'Bardzo dobry',
          brand: cfg?.brand ?? '',
          originalGarmentPhotoUrl: cfg?.garmentImageUrl ?? '',
          tryOnPhotoUrl: item.tryOnImageUrl ?? cfg?.garmentImageUrl ?? '',
          reelVideoUrl: item.reelUrl,
          reelPosterUrl: item.tryOnImageUrl ?? '',
          tags: ['AI-generated', '9:16 Reel'],
          createdAt: item.createdAt,
          modelArchetype: cfg?.modelArchetype ?? 'female_studio',
          motionStyle: cfg?.motionStyle ?? 'runway_walk',
        };
        setProducts((prev) => [product, ...prev.filter((p) => p.id !== product.id)]);
        setSelectedProductIndex(0);
        setActiveTab('storefront');
      } catch (err) {
        console.error(err);
        setActiveTab('reels');
      }
    },
    [currentGenerationConfig],
  );

  const handleQuickTrySample = () => {
    setActiveTab('storefront');
    setSelectedProductIndex(0);
  };

  const handleOpenSyncModal = (prod: ProductItem) => {
    setTargetSyncProduct(prod);
    setIsMultichannelOpen(true);
  };

  const handleSyncComplete = (results: any) => {
    if (!targetSyncProduct && !currentProduct) return;
    const prodId = targetSyncProduct?.id || currentProduct.id;

    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === prodId) {
          return {
            ...item,
            vintedListing: results.vinted
              ? {
                  id: results.vinted.listingId,
                  url: results.vinted.itemUrl,
                  status: 'synced',
                  views: Math.floor(10 + Math.random() * 50),
                }
              : item.vintedListing,
            olxListing: results.olx
              ? {
                  id: results.olx.listingId,
                  url: results.olx.itemUrl,
                  status: 'synced',
                  views: Math.floor(5 + Math.random() * 30),
                }
              : item.olxListing,
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-white selection:text-black antialiased">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        productsCount={products.length}
        onQuickTrySample={handleQuickTrySample}
      />

      <DemoBanner config={appConfig} />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {activeTab === 'studio' && (
          <UploadZone
            onStartGeneration={handleStartGeneration}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'reels' && <ReelsDashboard config={appConfig} />}

        {activeTab === 'storefront' && (
          <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
            {/* Storefront Reel Carousel Navigator */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-white/40" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Landing Page Przedmiotu (Rolka 9:16)
                </span>
              </div>

              {/* Product switcher buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40 mr-1 hidden sm:inline font-mono">
                  Przedmiot {selectedProductIndex + 1} z {products.length}:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProductIndex((prev) => (prev > 0 ? prev - 1 : products.length - 1))
                  }
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition"
                  title="Poprzednia rolka"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedProductIndex((prev) => (prev < products.length - 1 ? prev + 1 : 0))
                  }
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center transition"
                  title="Następna rolka"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reel Player & Product Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* 9:16 Vertical Video Player (Col 5) */}
              <div className="lg:col-span-5 flex justify-center">
                <VideoPlayer product={currentProduct} />
              </div>

              {/* Product Checkout & Multichannel Actions (Col 7) */}
              <div className="lg:col-span-7">
                <ProductOverlay
                  product={currentProduct}
                  onBuyNow={() => setIsCheckoutOpen(true)}
                  onListMarketplaces={() => handleOpenSyncModal(currentProduct)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'marketplace' && (
          <MarketplaceDashboard
            products={products}
            onOpenSyncModal={handleOpenSyncModal}
            onGoToStudio={() => setActiveTab('studio')}
          />
        )}

        {activeTab === 'api-hub' && <ApiSettingsModal />}
      </main>

      {/* Sleek Interface Footer */}
      <footer className="h-8 border-t border-white/10 bg-[#050505] flex items-center px-4 sm:px-8 justify-between text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono">
        <div>{appConfig?.demoMode ? 'DEMO MODE • mock providers' : 'Live providers'}</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AI-generated content is labeled (EU AI Act)</span>
        </div>
      </footer>

      {/* AI Loader Modal */}
      <AILoaderModal
        isOpen={isGenerating}
        config={currentGenerationConfig}
        jobId={generationJobId}
        error={generationError}
        onComplete={handleGenerationModalComplete}
        onClose={() => setIsGenerating(false)}
      />

      {/* Stripe Checkout Modal (BLIK, Apple Pay, Cards) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        product={currentProduct}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Multichannel Listing Modal (Vinted & OLX Scrapers) */}
      <MultichannelModal
        isOpen={isMultichannelOpen}
        product={targetSyncProduct || currentProduct}
        onClose={() => setIsMultichannelOpen(false)}
        onSyncComplete={handleSyncComplete}
      />
    </div>
  );
}
