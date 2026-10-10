import React, { useState, useEffect, useRef } from 'react';
import {
  FolderHeart,
  Image as ImageIcon,
  Video,
  Download,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Calendar,
  Layers,
  Cpu,
  Ratio,
} from 'lucide-react';
import { GeneratedItem } from '../types';

interface GalleryProps {
  lang: 'ar' | 'en';
  items: GeneratedItem[];
  onDeleteItem: (id: string) => void;
  onReuseForImage: (prompt: string) => void;
  onReuseForVideo: (prompt: string, imageSrc?: string) => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  lang,
  items,
  onDeleteItem,
  onReuseForImage,
  onReuseForVideo,
}) => {
  const isAr = lang === 'ar';

  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fullscreen Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showInfoSidebar, setShowInfoSidebar] = useState(true);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const activeItem: GeneratedItem | null =
    selectedItemIndex !== null && filteredItems[selectedItemIndex]
      ? filteredItems[selectedItemIndex]
      : null;

  // Reset zoom & pan when opening a new item or switching items
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedItemIndex]);

  // Keyboard navigation & Esc handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemIndex === null) return;

      if (e.key === 'Escape') {
        setSelectedItemIndex(null);
      } else if (e.key === 'ArrowRight') {
        // In RTL, ArrowRight usually goes to previous, but let's handle logically
        if (isAr) {
          handlePrev();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (isAr) {
          handleNext();
        } else {
          handlePrev();
        }
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIndex, filteredItems.length, isAr]);

  const handleNext = () => {
    if (selectedItemIndex === null || filteredItems.length === 0) return;
    setSelectedItemIndex((prev) => ((prev! + 1) % filteredItems.length));
  };

  const handlePrev = () => {
    if (selectedItemIndex === null || filteredItems.length === 0) return;
    setSelectedItemIndex((prev) => ((prev! - 1 + filteredItems.length) % filteredItems.length));
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.35, 0.6);
      if (next <= 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Browser Fullscreen toggle
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsBrowserFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsBrowserFullscreen(false)).catch(() => {});
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <FolderHeart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {isAr ? 'معرض الإبداعات والمحفوظات' : 'Creations & History Gallery'}
            </h2>
            <p className="text-xs text-neutral-400">
              {isAr
                ? `إجمالي الأعمال المحفوظة: ${items.length} عنصر (انقر على أي عنصر لمعاينته بملء الشاشة)`
                : `Total saved assets: ${items.length} (Click any item for full-screen inspection)`}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-neutral-800 text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({items.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === 'image'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'الصور' : 'Images'}</span>
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterType === 'video'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isAr ? 'الفيديوهات' : 'Videos'}</span>
          </button>
        </div>
      </div>

      {/* Grid of creations */}
      {filteredItems.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/80 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-neutral-300">
            {isAr ? 'لا توجد عناصر محفوظة حتى الآن' : 'No Assets Generated Yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {isAr
              ? 'انتقل إلى مولد الصور أو الفيديوهات لتوليد إبداعاتك الأولى وستظهر هنا تلقائياً.'
              : 'Head to the Image or Video Studio to generate assets; they will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => {
            const isImage = item.type === 'image';
            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg flex flex-col hover:border-indigo-500/60 hover:shadow-indigo-500/10 transition duration-200 cursor-pointer"
                onClick={() => setSelectedItemIndex(index)}
              >
                {/* Visual Thumbnail */}
                <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={item.url}
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center bg-neutral-950">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                        <div className="w-10 h-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 ms-0.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 start-2 flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isImage
                          ? 'bg-indigo-600/90 text-white'
                          : 'bg-purple-600/90 text-white'
                      }`}
                    >
                      {item.sizeOrResolution}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white">
                      {item.aspectRatio}
                    </span>
                  </div>

                  {/* Fullscreen Preview Trigger Badge */}
                  <div className="absolute top-2 end-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition shadow">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <p className="text-xs text-neutral-300 line-clamp-2" title={item.prompt}>
                    "{item.prompt}"
                  </p>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleCopy(item.id, item.prompt)}
                        className="p-1.5 rounded-lg bg-neutral-800/80 text-neutral-400 hover:text-white transition"
                        title="Copy Prompt"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={item.url}
                        download={`aether-${item.id}.${isImage ? 'png' : 'mp4'}`}
                        className="p-1.5 rounded-lg bg-neutral-800/80 text-neutral-400 hover:text-indigo-400 transition"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-neutral-800/80 text-neutral-400 hover:text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 🚀 ULTIMATE FULLSCREEN MODAL (معاينة كاملة للشاشة والتفاصيل) */}
      {/* ============================================================== */}
      {activeItem && selectedItemIndex !== null && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-50 bg-neutral-950/98 backdrop-blur-2xl flex flex-col text-neutral-100 select-none overflow-hidden animate-in fade-in duration-200"
          onClick={() => setSelectedItemIndex(null)}
        >
          {/* Top Floating App Bar */}
          <div
            className="h-16 px-6 bg-neutral-950/80 border-b border-neutral-800/80 flex items-center justify-between z-20 shrink-0 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Item Counter & Type Info */}
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl text-white ${
                  activeItem.type === 'image' ? 'bg-indigo-600' : 'bg-purple-600'
                }`}
              >
                {activeItem.type === 'image' ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <Video className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {activeItem.type === 'image'
                      ? (isAr ? 'معاينة كاملة للصورة فائقة الدقة' : 'Ultra HD Image Inspection')
                      : (isAr ? 'معاينة كاملة لمشهد الفيديو' : 'Cinema Video Playback')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-indigo-300 font-bold border border-neutral-700">
                    {activeItem.sizeOrResolution} • {activeItem.aspectRatio}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {selectedItemIndex + 1} / {filteredItems.length}
                </span>
              </div>
            </div>

            {/* Center: Image Zoom Controls (Only for images) */}
            {activeItem.type === 'image' && (
              <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.6}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 cursor-pointer"
                  title={isAr ? 'تصغير (-)' : 'Zoom Out'}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-2.5 text-xs font-mono font-bold text-indigo-300 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition disabled:opacity-40 cursor-pointer"
                  title={isAr ? 'تكبير (+)' : 'Zoom In'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-neutral-800 mx-1" />

                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                  title={isAr ? 'إعادة ضبط (0)' : 'Reset Fit'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Right: Actions, Fullscreen toggle & Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInfoSidebar(!showInfoSidebar)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  showInfoSidebar
                    ? 'bg-neutral-800 border-neutral-700 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title={isAr ? 'تبديل لوحة التفاصيل' : 'Toggle Info Panel'}
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                onClick={toggleBrowserFullscreen}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
                title={isAr ? 'ملء الشاشة في المتصفح' : 'Fullscreen'}
              >
                {isBrowserFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <a
                href={activeItem.url}
                download={`aether-${activeItem.id}.${activeItem.type === 'image' ? 'png' : 'mp4'}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
                title="Download File"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'تحميل' : 'Download'}</span>
              </a>

              <button
                onClick={() => setSelectedItemIndex(null)}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                title={isAr ? 'إغلاق (Esc)' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Stage & Content Area */}
          <div
            className="flex-1 flex overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Nav Arrow */}
            {filteredItems.length > 1 && (
              <button
                onClick={isAr ? handleNext : handlePrev}
                className="absolute start-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-2xl flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95"
                title={isAr ? 'التالي (سهم يمين)' : 'Previous (Left Arrow)'}
              >
                <ChevronLeft className="w-6 h-6 rtl:rotate-180" />
              </button>
            )}

            {/* Right Nav Arrow */}
            {filteredItems.length > 1 && (
              <button
                onClick={isAr ? handlePrev : handleNext}
                className="absolute end-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-2xl flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95"
                title={isAr ? 'السابق (سهم يسار)' : 'Next (Right Arrow)'}
              >
                <ChevronRight className="w-6 h-6 rtl:rotate-180" />
              </button>
            )}

            {/* Media Canvas Stage */}
            <div
              className={`flex-1 flex items-center justify-center p-4 bg-black/60 overflow-hidden relative ${
                zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={zoomLevel > 1 ? handleResetZoom : handleZoomIn}
            >
              {activeItem.type === 'image' ? (
                <div
                  className="transition-transform duration-75 ease-out select-none"
                  style={{
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  }}
                >
                  <img
                    src={activeItem.url}
                    alt={activeItem.prompt}
                    draggable={false}
                    className="max-h-[82vh] max-w-[85vw] object-contain rounded-lg shadow-2xl pointer-events-auto"
                  />
                </div>
              ) : (
                <div className="max-w-[88vw] max-h-[82vh] w-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={activeItem.url}
                    controls
                    autoPlay
                    loop
                    className="max-h-[82vh] max-w-[85vw] rounded-xl shadow-2xl object-contain border border-neutral-800"
                  />
                </div>
              )}
            </div>

            {/* Collapsible Metadata Drawer */}
            {showInfoSidebar && (
              <aside className="w-80 md:w-96 border-s border-neutral-800 bg-neutral-950/95 p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-20 backdrop-blur-xl animate-in slide-in-from-right-5 duration-200">
                <div className="space-y-6">
                  {/* Title & Badge */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                      {isAr ? 'تفاصيل العنصر والمواصفات' : 'Asset Specifications'}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {activeItem.type === 'image'
                        ? (isAr ? 'صورة استوديو مولدة' : 'Synthesized Still Asset')
                        : (isAr ? 'فيديو سينمائي متحرك' : 'Cinematic Video Render')}
                    </h3>
                  </div>

                  {/* Complete Prompt with Copy */}
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-300">
                        {isAr ? 'نص البرومبت الكامل:' : 'Full Master Prompt:'}
                      </span>
                      <button
                        onClick={() => handleCopy('prompt', activeItem.prompt)}
                        className="p-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition flex items-center gap-1 text-[10px]"
                        title="Copy Prompt"
                      >
                        {copiedId === 'prompt' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{isAr ? 'نسخ' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-medium break-words">
                      "{activeItem.prompt}"
                    </p>
                  </div>

                  {/* Metadata Specs Grid */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                      <span className="text-neutral-400 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{isAr ? 'الدقة والجودة' : 'Resolution'}</span>
                      </span>
                      <span className="font-bold text-white font-mono">
                        {activeItem.sizeOrResolution}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                      <span className="text-neutral-400 flex items-center gap-2">
                        <Ratio className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isAr ? 'نسبة الأبعاد' : 'Aspect Ratio'}</span>
                      </span>
                      <span className="font-bold text-white font-mono">
                        {activeItem.aspectRatio}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                      <span className="text-neutral-400 flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isAr ? 'نموذج التوليد' : 'Model Engine'}</span>
                      </span>
                      <span className="font-bold text-neutral-300 font-mono text-[11px] truncate max-w-[130px]">
                        {activeItem.model}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
                      <span className="text-neutral-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isAr ? 'تاريخ التوليد' : 'Created At'}</span>
                      </span>
                      <span className="text-neutral-400 font-mono text-[11px]">
                        {new Date(activeItem.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {activeItem.notes && (
                    <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 text-[11px] text-neutral-400">
                      <span className="font-bold text-neutral-300 block mb-0.5">
                        {isAr ? 'ملاحظات النموذج:' : 'Model Feedback:'}
                      </span>
                      <p>{activeItem.notes}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Cross-Studio Actions */}
                <div className="pt-6 border-t border-neutral-800 space-y-2.5">
                  <span className="text-[11px] font-bold text-neutral-400 block mb-1">
                    {isAr ? 'إعادة الاستخدام في الاستوديوهات:' : 'Reuse In Studio:'}
                  </span>

                  <button
                    onClick={() => {
                      onReuseForImage(activeItem.prompt);
                      setSelectedItemIndex(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>{isAr ? 'فتح في مولد الصور (1K-4K) 🎨' : 'To Image Studio'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onReuseForVideo(
                        activeItem.prompt,
                        activeItem.type === 'image' ? activeItem.url : undefined
                      );
                      setSelectedItemIndex(null);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>
                      {isAr
                        ? activeItem.type === 'image'
                          ? 'تحريك هذه الصورة في استوديو الفيديو 🎬'
                          : 'فتح في استوديو الفيديو 🎬'
                        : 'To Video Studio'}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        onDeleteItem(activeItem.id);
                        setSelectedItemIndex(null);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حذف من المعرض' : 'Delete Asset'}</span>
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
