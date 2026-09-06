import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Sliders, 
  Tag, 
  Video, 
  Check, 
  Layers, 
  Zap, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  GarmentCategory, 
  ClothingSize, 
  GarmentCondition, 
  ModelArchetype, 
  ReelMotionStyle, 
  TryOnGenerationConfig 
} from '../types';
import { PRESET_GARMENTS } from '../data/sampleProducts';

interface UploadZoneProps {
  onStartGeneration: (config: TryOnGenerationConfig) => void;
  isGenerating: boolean;
}

const CATEGORIES: GarmentCategory[] = [
  'Sukienki',
  'Garnitury i Marynarki',
  'Kurtki i Płaszcze',
  'Koszule i Bluzki',
  'Bluzy i Swetry',
  'Spodnie i Spódnice',
];

const SIZES: ClothingSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const CONDITIONS: GarmentCondition[] = [
  'Nowy z metką',
  'Nowy bez metki',
  'Bardzo dobry',
  'Dobry',
];

const MODEL_OPTIONS: { id: ModelArchetype; label: string; gender: string; style: string; avatar: string }[] = [
  {
    id: 'female_runway',
    label: 'Modelka Runway',
    gender: 'Kobieta',
    style: 'Wybieg High-Fashion',
    avatar: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'female_studio',
    label: 'Modelka Minimal Studio',
    gender: 'Kobieta',
    style: 'Czyste studio fotograficzne',
    avatar: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'female_street',
    label: 'Modelka Streetwear',
    gender: 'Kobieta',
    style: 'Styl miejski / urban aesthetic',
    avatar: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_street',
    label: 'Model Streetwear',
    gender: 'Mężczyzna',
    style: 'Oversize / street casual',
    avatar: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_casual',
    label: 'Model Smart Casual',
    gender: 'Mężczyzna',
    style: 'Klasyczna elegancja miejska',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'male_editorial',
    label: 'Model Editorial',
    gender: 'Mężczyzna',
    style: 'Prezentacja wybiegowa',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
];

const MOTION_STYLES: { id: ReelMotionStyle; title: string; desc: string }[] = [
  {
    id: 'runway_walk',
    title: 'Runway Dynamic Walk',
    desc: 'Pewny krok w stronę kamery, naturalny ruch tkaniny (9:16).',
  },
  {
    id: 'spin_360',
    title: '360° Spin & Silhouette',
    desc: 'Płynny obrót wokół modela, prezentacja tyłu i detali (TikTok reel).',
  },
  {
    id: 'slowmo_cinematic',
    title: 'Cinematic Slow-Motion',
    desc: 'Zbliżenie i płynna panorama w zwolnionym tempie 60fps.',
  },
  {
    id: 'urban_street',
    title: 'Urban Street Style',
    desc: 'Dynamiczne zatrzymanie, krok i naturalny gest modela.',
  },
];

export const UploadZone: React.FC<UploadZoneProps> = ({
  onStartGeneration,
  isGenerating,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form State
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'
  );
  const [title, setTitle] = useState<string>('Jedwabna Sukienka Maxi Emerald Glow');
  const [description, setDescription] = useState<string>(
    'Ekskluzywna wieczorowa sukienka z naturalnego jedwabiu morwowego o satynowym połysku. Dopasowany krój z głębokim wycięciem na plecach.'
  );
  const [pricePln, setPricePln] = useState<number>(349.00);
  const [size, setSize] = useState<ClothingSize>('S');
  const [category, setCategory] = useState<GarmentCategory>('Sukienki');
  const [condition, setCondition] = useState<GarmentCondition>('Nowy z metką');
  const [brand, setBrand] = useState<string>('Zara Atelier / Studio');
  
  // AI Config State
  const [modelArchetype, setModelArchetype] = useState<ModelArchetype>('female_runway');
  const [motionStyle, setMotionStyle] = useState<ReelMotionStyle>('runway_walk');
  const [aiProvider, setAiProvider] = useState<'fal_ai' | 'replicate' | 'kling_ai' | 'auto'>('auto');

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setImageUrl(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_GARMENTS[0]) => {
    setImageUrl(preset.imageUrl);
    setTitle(preset.name);
    setDescription(preset.description);
    setPricePln(preset.price);
    setSize(preset.size);
    setCategory(preset.category);
    setBrand(preset.brand);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Proszę dodać zdjęcie ubrania.');
      return;
    }

    onStartGeneration({
      garmentImageUrl: imageUrl,
      title,
      description,
      pricePln,
      size,
      category,
      condition,
      brand,
      modelArchetype,
      motionStyle,
      aiProvider,
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-white/80" />
          <span className="font-mono uppercase tracking-wider text-[11px]">AI VTON PIPELINE 9:16</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter text-white">
          Zamień zdjęcie wieszaka w <span className="text-white/70">sprzedającą rolkę AI</span>
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-white/60">
          Wgraj zdjęcie odzieży. Algorytmy VTON nałożą fason na modela, a silnik wideo (Kling/Fal.ai) wyrenderuje dynamiczną pionową rolkę 9:16 z gotowym checkoutem BLIK i automatycznym wystawieniem na Vinted oraz OLX.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Visual Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">1. Product Upload</h2>
              <span className="text-[10px] text-white/40 font-mono">JPG, PNG, WebP</span>
            </div>

            {/* Drag and Drop Zone */}
            <div
              id="upload-dropzone"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all overflow-hidden aspect-[4/5] flex flex-col items-center justify-center p-6 text-center ${
                dragActive
                  ? 'border-white bg-white/10'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-input-garment"
              />

              {imageUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={imageUrl}
                    alt="Podgląd ubrania"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                    <Upload className="w-8 h-8 mb-2 text-white" />
                    <span className="text-xs font-medium">Kliknij lub upuść, aby zmienić zdjęcie</span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white/80 border border-white/10 font-mono">
                    UPLOAD_READY
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-3xl text-white/80 font-light">+</div>
                  <div>
                    <p className="text-xs font-medium text-white/80">Drag and drop clothing photo</p>
                    <p className="text-[11px] text-white/40 mt-1">lub kliknij, aby wybrać z dysku</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">
                Lub wybierz preset:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_GARMENTS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition text-left text-xs"
                  >
                    <img
                      src={preset.imageUrl}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="text-white font-medium truncate text-[11px]">{preset.name}</p>
                      <p className="text-white/40 text-[10px] font-mono">{preset.price} zł • {preset.size}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form Fields & AI Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* Garment Details Card */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-white/40" />
              <span>2. Item Parameters & Listing Details</span>
            </h2>

            {/* Title */}
            <div>
              <label htmlFor="input-title" className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                Item Name (Vinted / OLX / Sklep)
              </label>
              <input
                id="input-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Silk Evening Dress"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 transition"
              />
            </div>

            {/* Price & Size Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="input-price" className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5 flex items-center justify-between">
                  <span>Price (PLN)</span>
                  <span className="text-[10px] text-white/40 font-mono">Stripe & BLIK</span>
                </label>
                <div className="relative">
                  <input
                    id="input-price"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={pricePln}
                    onChange={(e) => setPricePln(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-white/40 font-mono transition"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-white/40 font-mono">
                    PLN
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Size
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSize(sz)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                        size === sz
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="select-category" className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Category
                </label>
                <select
                  id="select-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GarmentCategory)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-white/40 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#111] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="select-condition" className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Condition
                </label>
                <select
                  id="select-condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as GarmentCondition)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-white/40 transition"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond} className="bg-[#111] text-white">
                      {cond}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="input-brand" className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Brand / Designer
                </label>
                <input
                  id="input-brand"
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="np. Zara Atelier, COS, AllSaints..."
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="input-description" className="block text-[10px] uppercase tracking-wider text-white/40 mb-1.5">
                  Listing Description (Vinted, OLX, Landing Page)
                </label>
                <textarea
                  id="input-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Szczegóły fasonu, skład materiału, stan faktyczny..."
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 resize-none transition"
                />
              </div>
            </div>
          </div>

          {/* AI Virtual Try-On & 9:16 Video Setup Card */}
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-white/40" />
                <span>3. Virtual Model & 9:16 Motion Reel</span>
              </h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                <span>KLING AI • FAL.AI • REPLICATE</span>
              </div>
            </div>

            {/* Model Selection Grid */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">
                AI Model Archetype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MODEL_OPTIONS.map((m) => {
                  const isSelected = modelArchetype === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModelArchetype(m.id)}
                      className={`relative p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        isSelected
                          ? 'border-white bg-white/10 shadow-sm'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={m.avatar}
                        alt={m.label}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-medium text-white truncate">{m.label}</p>
                        <p className="text-[10px] text-white/40 truncate">{m.style}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motion Style Selection */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">
                9:16 Camera & Motion Framing
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MOTION_STYLES.map((motion) => {
                  const isSelected = motionStyle === motion.id;
                  return (
                    <button
                      key={motion.id}
                      type="button"
                      onClick={() => setMotionStyle(motion.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-white bg-white/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                    >
                      <p className="text-xs font-semibold text-white">{motion.title}</p>
                      <p className="text-[11px] text-white/40 mt-0.5">{motion.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit CTA Button */}
            <div className="pt-2 space-y-2">
              <button
                id="btn-generate-ai-reel"
                type="submit"
                disabled={isGenerating}
                className="w-full bg-white text-black font-bold py-3.5 rounded-lg text-sm hover:bg-white/90 transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating ? 'Generating AI Preview...' : 'Generate AI Preview'}
                </span>
                <span className="text-[10px] bg-black/10 text-black px-2 py-0.5 rounded font-mono ml-1">
                  ~45s
                </span>
              </button>
              <p className="text-[10px] text-center text-white/30 font-mono">
                Estimated generation time: 45s • Automated VTON + 9:16 Video + Multichannel Sync
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
