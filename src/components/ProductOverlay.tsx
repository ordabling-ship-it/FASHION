import React, { useState } from 'react';
import { 
  Zap, 
  Share2, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Check, 
  Copy, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  Info
} from 'lucide-react';
import { ProductItem, ClothingSize } from '../types';

interface ProductOverlayProps {
  product: ProductItem;
  onBuyNow: () => void;
  onListMarketplaces: () => void;
}

export const ProductOverlay: React.FC<ProductOverlayProps> = ({
  product,
  onBuyNow,
  onListMarketplaces,
}) => {
  const [selectedSize, setSelectedSize] = useState<ClothingSize>(product.size);
  const [copiedLink, setCopiedLink] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const handleCopyLink = () => {
    const fakeUrl = `${window.location.origin}/p/${product.id}`;
    navigator.clipboard?.writeText(fakeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5 text-left">
      {/* Product Summary Header Card */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
        {/* Brand & Status Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
              {product.brand}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 font-mono">
              {product.condition}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 transition"
            title="Kopiuj link do unikalnego landing page'a tego przedmiotu"
          >
            {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="font-mono text-[10px]">{copiedLink ? 'COPIED' : 'SHARE_LINK'}</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug mb-2">
          {product.title}
        </h1>

        {/* Price display in PLN */}
        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-3xl font-light text-white tracking-tight font-mono">
            {product.pricePln.toFixed(2).replace('.', ',')} PLN
          </span>
          <span className="text-xs text-white/40 line-through font-mono">
            {(product.pricePln * 1.35).toFixed(2).replace('.', ',')} PLN
          </span>
          <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/10">
            VTON_READY
          </span>
        </div>

        {/* Size Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">Select Size:</span>
            <span className="text-white/40 text-[10px] font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white/60" />
              Model: 176cm (Size {product.size})
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['XS', 'S', 'M', 'L', 'XL'] as ClothingSize[]).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`w-10 h-10 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                  selectedSize === sz
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA: Kup teraz (Stripe BLIK & Apple Pay) */}
        <div className="space-y-3">
          <button
            id="btn-buy-now-stripe"
            type="button"
            onClick={onBuyNow}
            className="w-full bg-white text-black font-bold py-3.5 px-6 rounded-full transition duration-200 flex items-center justify-center gap-2 shadow-xl hover:bg-white/90 active:scale-[0.98]"
          >
            <Zap className="w-4 h-4 fill-black text-black" />
            <span className="text-sm tracking-tight font-semibold">Buy Now • {product.pricePln.toFixed(2).replace('.', ',')} PLN</span>
          </button>

          {/* Payment Badges supported */}
          <div className="flex items-center justify-center gap-3 text-[10px] font-mono uppercase text-white/40 py-1">
            <span className="flex items-center gap-1 text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              BLIK (6 Digits)
            </span>
            <span>•</span>
            <span className="text-white/70">Apple Pay</span>
            <span>•</span>
            <span>Stripe Cards</span>
          </div>

          {/* Secondary Action: Wystaw na Vinted i OLX */}
          <button
            id="btn-list-vinted-olx"
            type="button"
            onClick={onListMarketplaces}
            className="w-full border border-white/20 text-white/80 py-3 px-5 rounded-lg text-sm hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span>List to Vinted & OLX (Automation)</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
              Sync
            </span>
          </button>
        </div>

        {/* Value Props & Trust Badges */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3 text-xs text-white/40">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-white/60 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 font-medium text-[11px]">VTON Accuracy Verified</p>
              <p className="text-[10px] text-white/40">Realistic garment drape & cut</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-white/60 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/80 font-medium text-[11px]">Direct InPost & Paczkomat</p>
              <p className="text-[10px] text-white/40">Instant shipping label generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Product Details */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/40" />
            <span>Product Details & Specs</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
        </button>

        {detailsOpen && (
          <div className="mt-3 text-xs text-white/60 space-y-3 leading-relaxed border-t border-white/10 pt-3">
            <p className="text-white/80">{product.description}</p>
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 p-3 rounded-xl border border-white/10 font-mono">
              <div>
                <span className="text-white/40 block text-[9px] uppercase">Category</span>
                <span className="text-white font-medium">{product.category}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[9px] uppercase">Condition</span>
                <span className="text-white font-medium">{product.condition}</span>
              </div>
              <div>
                <span className="text-white/40 block text-[9px] uppercase">Total Length</span>
                <span className="text-white font-medium">124 cm</span>
              </div>
              <div>
                <span className="text-white/40 block text-[9px] uppercase">Chest Width</span>
                <span className="text-white font-medium">44 cm x 2</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
