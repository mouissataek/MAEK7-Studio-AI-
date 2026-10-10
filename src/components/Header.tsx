import React from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  MessageSquare,
  Zap,
  FolderHeart,
  Globe,
  Radio,
  Smartphone,
} from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  lang,
  onToggleLang,
  historyCount,
}) => {
  const isAr = lang === 'ar';

  const navItems: { mode: AppMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      mode: 'image',
      label: isAr ? 'مولد الصور' : 'Image Studio',
      icon: <ImageIcon className="w-4 h-4" />,
      badge: '1K-4K',
    },
    {
      mode: 'video',
      label: isAr ? 'مولد الفيديوهات' : 'Video Studio',
      icon: <Video className="w-4 h-4" />,
      badge: 'Veo 3.1',
    },
    {
      mode: 'chat',
      label: isAr ? 'المخرج الذكي' : 'AI Director',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: 'Multi-Role',
    },
    {
      mode: 'fast',
      label: isAr ? 'السحر السريع' : 'Fast Magic',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      badge: 'Lite',
    },
    {
      mode: 'gallery',
      label: isAr ? 'المعرض' : 'Gallery',
      icon: <FolderHeart className="w-4 h-4" />,
      badge: historyCount > 0 ? String(historyCount) : undefined,
    },
    {
      mode: 'mobile',
      label: isAr ? 'تطبيق الموبايل & HTML' : 'Mobile & HTML',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      badge: 'Download',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-400">
                  MAEK7-Studio AI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Pro GenAI
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                {isAr
                  ? 'استوديو توليد الصور والفيديوهات الاحترافي'
                  : 'Next-Gen Visual AI Creation Studio'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Modes */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800">
            {navItems.map((item) => {
              const active = currentMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => onSelectMode(item.mode)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Tools & Language Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Live API Health indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{isAr ? 'Gemini 3 Pro نشط' : 'Gemini 3 Pro Active'}</span>
            </div>

            {/* Language Switch */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer hover:bg-neutral-800"
              title={isAr ? 'تبديل إلى الإنجليزية' : 'Switch to Arabic'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-neutral-800/60 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const active = currentMode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => onSelectMode(item.mode)}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition shrink-0 ${
                  active
                    ? 'text-indigo-400 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
