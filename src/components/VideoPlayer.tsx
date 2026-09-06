import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Repeat, 
  Layers, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ProductItem } from '../types';

interface VideoPlayerProps {
  product: ProductItem;
  onShowCompare?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  product,
  onShowCompare,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showGarmentOriginal, setShowGarmentOriginal] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-[320px] sm:w-[340px] md:w-[360px] h-[580px] sm:h-[620px] bg-[#111] rounded-[40px] border-[8px] border-[#222] shadow-2xl overflow-hidden mx-auto select-none group"
    >
      {/* Video Element or Original Garment Overlay */}
      {showGarmentOriginal ? (
        <div className="relative w-full h-full">
          <img
            src={product.originalGarmentPhotoUrl}
            alt="Oryginalne ubranie"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] text-white/80 font-mono">
            GARMENT_RAW
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={product.reelVideoUrl}
          poster={product.reelPosterUrl}
          playsInline
          loop
          autoPlay
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
        />
      )}

      {/* Sleek Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Top Floating Badges */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/90 font-medium flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono tracking-tight text-[10px] uppercase">AI Reel 9:16</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/60 text-white/50 backdrop-blur-sm border border-white/10">
            {product.brand}
          </span>
        </div>

        {/* Compare Garment / VTON Toggle */}
        <button
          type="button"
          onClick={() => setShowGarmentOriginal(!showGarmentOriginal)}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black/90 text-white/80 text-xs border border-white/20 backdrop-blur-md transition"
          title="Porównaj zdjęcie wieszaka z modelem AI"
        >
          <Layers className="w-3 h-3 text-white/70" />
          <span className="text-[10px] font-mono uppercase">{showGarmentOriginal ? 'Reel' : 'Raw'}</span>
        </button>
      </div>

      {/* Play/Pause Center Indicator on Hover or Pause */}
      {!isPlaying && !showGarmentOriginal && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-xl transition transform hover:scale-105">
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Floating Side Action Controls (TikTok/Instagram Reels style) */}
      <div className="absolute right-4 bottom-20 z-20 flex flex-col gap-2.5">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          onClick={toggleMute}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 transition hover:border-white/30"
          title={isMuted ? 'Włącz dźwięk' : 'Wycisz'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/40" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Speed button */}
        <button
          type="button"
          onClick={() => setPlaybackRate((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 0.75 : 1))}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 text-[10px] font-mono transition hover:border-white/30"
          title="Prędkość odtwarzania"
        >
          {playbackRate}x
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 transition hover:border-white/30"
          title="Pełny ekran"
        >
          <Maximize2 className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Bottom Scrubber Bar */}
      <div 
        onClick={handleSeek}
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer z-30 group-hover:h-1.5 transition-all"
      >
        <div 
          className="h-full bg-white"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
