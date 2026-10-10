import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { ChatDirector } from './components/ChatDirector';
import { FastMagic } from './components/FastMagicModal';
import { Gallery } from './components/GalleryModal';
import { MobileGenerator } from './components/MobileGenerator';
import { AppMode, GeneratedItem } from './types';
import { loadItems, saveItem, deleteItem, trimItems, requestPersistence } from './utils/storage';
import { Sparkles, Image as ImageIcon, Video, MessageSquare, Zap, FolderHeart, Smartphone } from 'lucide-react';

const MAX_ITEMS = 50;

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('image');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');

  // Shared prompt transit between studios
  const [imageStudioPrompt, setImageStudioPrompt] = useState<string>('');
  const [videoStudioPrompt, setVideoStudioPrompt] = useState<string>('');
  const [videoStartingFrame, setVideoStartingFrame] = useState<string | null>(null);

  // History state (persisted in IndexedDB)
  const [historyItems, setHistoryItems] = useState<GeneratedItem[]>([]);

  useEffect(() => {
    let alive = true;
    requestPersistence();
    loadItems()
      .then((items) => {
        if (!alive) return;
        // Merge: something may have been generated before the load finished.
        setHistoryItems((prev) => {
          const ids = new Set(prev.map((i) => i.id));
          return [...prev, ...items.filter((i) => !ids.has(i.id))]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, MAX_ITEMS);
        });
      })
      .catch((e) => console.warn('Failed to load gallery from IndexedDB:', e));
    return () => {
      alive = false;
    };
  }, []);

  // Sync language with document direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Persist history
  const handleSaveGeneration = (item: GeneratedItem) => {
    setHistoryItems((prev) => [item, ...prev].slice(0, MAX_ITEMS));
    saveItem(item)
      .then(() => trimItems(MAX_ITEMS))
      .catch((e) => console.warn('Could not save item to gallery storage:', e));
  };

  const handleDeleteItem = (id: string) => {
    setHistoryItems((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url);
      return prev.filter((i) => i.id !== id);
    });
    deleteItem(id).catch((e) => console.warn('Could not delete item from gallery storage:', e));
  };

  // Cross-Studio Navigation Handlers
  const handleUsePromptForImage = (promptText: string) => {
    setImageStudioPrompt(promptText);
    setCurrentMode('image');
  };

  const handleUsePromptForVideo = (promptText: string, imageSrc?: string) => {
    setVideoStudioPrompt(promptText);
    if (imageSrc) {
      setVideoStartingFrame(imageSrc);
    }
    setCurrentMode('video');
  };

  const isAr = lang === 'ar';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -start-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -end-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 start-1/3 w-96 h-96 bg-pink-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        lang={lang}
        onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        historyCount={historyItems.length}
      />

      {/* Main Studio Workstation */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Quick studio switcher banner for easy discoverability */}
        <div className="mb-6 flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAr ? 'بيئة العمل النشطة:' : 'Active Studio:'}</span>
            </span>
            <span className="font-semibold text-indigo-300">
              {currentMode === 'image' && (isAr ? 'مولد الصور فائق الدقة (1K, 2K, 4K)' : 'Image Studio (1K, 2K, 4K)')}
              {currentMode === 'video' && (isAr ? 'مولد الفيديوهات السينمائية (Veo 3.1)' : 'Video Studio (Veo 3.1)')}
              {currentMode === 'chat' && (isAr ? 'المخرج الذكي متعدد الأدوار (Gemini 3)' : 'Multi-Role AI Director')}
              {currentMode === 'fast' && (isAr ? 'محرك السحر فائق السرعة (Flash-Lite)' : 'Low-Latency Magic Engine')}
              {currentMode === 'gallery' && (isAr ? 'معرض الأعمال والمحفوظات' : 'Creations Gallery')}
              {currentMode === 'mobile' && (isAr ? 'توليد تطبيق الموبايل & تحميل HTML المستقل' : 'Mobile App & Standalone HTML')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMode('image')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                currentMode === 'image' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Image Studio"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMode('video')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                currentMode === 'video' ? 'bg-purple-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Video Studio"
            >
              <Video className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMode('chat')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                currentMode === 'chat' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="AI Director"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMode('fast')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                currentMode === 'fast' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Fast Magic"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMode('gallery')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                currentMode === 'gallery' ? 'bg-pink-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Gallery"
            >
              <FolderHeart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentMode('mobile')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                currentMode === 'mobile' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Mobile & HTML"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Routing */}
        {currentMode === 'image' && (
          <ImageStudio
            lang={lang}
            initialPrompt={imageStudioPrompt}
            onSaveGeneration={handleSaveGeneration}
            onSendToVideo={handleUsePromptForVideo}
          />
        )}

        {currentMode === 'video' && (
          <VideoStudio
            lang={lang}
            initialPrompt={videoStudioPrompt}
            initialImage={videoStartingFrame}
            onSaveGeneration={handleSaveGeneration}
          />
        )}

        {currentMode === 'chat' && (
          <ChatDirector
            lang={lang}
            onUseForImage={handleUsePromptForImage}
            onUseForVideo={(prompt) => handleUsePromptForVideo(prompt)}
          />
        )}

        {currentMode === 'fast' && (
          <FastMagic
            lang={lang}
            onUseForImage={handleUsePromptForImage}
            onUseForVideo={(prompt) => handleUsePromptForVideo(prompt)}
          />
        )}

        {currentMode === 'gallery' && (
          <Gallery
            lang={lang}
            items={historyItems}
            onDeleteItem={handleDeleteItem}
            onReuseForImage={handleUsePromptForImage}
            onReuseForVideo={handleUsePromptForVideo}
          />
        )}

        {currentMode === 'mobile' && (
          <MobileGenerator lang={lang} />
        )}
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950/90 py-6 text-center text-xs text-neutral-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-300">MAEK7-Studio AI</span>
            <span>•</span>
            <span>
              {isAr
                ? 'مدعوم بنماذج Gemini 3 Pro و Veo 3.1 و Flash Lite'
                : 'Powered by Gemini 3 Pro, Veo 3.1 & Flash Lite'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-neutral-500">
            <span>High Quality 1K / 2K / 4K</span>
            <span>•</span>
            <span>Low-Latency Realtime</span>
            <span>•</span>
            <span>Multi-Turn Chatbot</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
