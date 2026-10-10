import React, { useState } from 'react';
import {
  Zap,
  Wand2,
  Sparkles,
  Camera,
  SunMedium,
  ShieldAlert,
  Copy,
  Check,
  Image as ImageIcon,
  Video,
  Loader2,
  Clock,
} from 'lucide-react';
import { FastEnhanceResult } from '../types';
import { apiFetch } from '../utils/api';

interface FastMagicProps {
  lang: 'ar' | 'en';
  onUseForImage: (prompt: string) => void;
  onUseForVideo: (prompt: string) => void;
}

export const FastMagic: React.FC<FastMagicProps> = ({
  lang,
  onUseForImage,
  onUseForVideo,
}) => {
  const isAr = lang === 'ar';

  const [inputIdea, setInputIdea] = useState('');
  const [mode, setMode] = useState<'enhance' | 'critique'>('enhance');
  const [isLoading, setIsLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [resultData, setResultData] = useState<FastEnhanceResult | null>(null);
  const [rawTextResult, setRawTextResult] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const quickPresets = [
    isAr ? 'قط في بدلة فضاء نيون على سطح المريخ' : 'Cyberpunk cat in neon astronaut suit on Mars',
    isAr ? 'قصر أندلسي عائم مع نافورة ماء زمردية' : 'Floating Andalusian palace with emerald water fountain',
    isAr ? 'سباق دراجات نارية في نفق رقمي تحت الأرض' : 'High speed motorcycle chase inside a digital subterranean tube',
  ];

  const handleExecute = async (presetText?: string) => {
    const text = presetText || inputIdea;
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setLatencyMs(null);
    setResultData(null);
    setRawTextResult(null);

    const startTime = performance.now();

    try {
      const res = await apiFetch('/api/low-latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text.trim(),
          type: mode,
          currentLanguage: lang,
        }),
      });

      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);
      setLatencyMs(duration);

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch low-latency result');
      }

      if (data.data && typeof data.data === 'object') {
        setResultData(data.data);
      } else {
        setRawTextResult(data.text);
      }
    } catch (err: any) {
      console.error(err);
      setRawTextResult(err?.message || 'Error executing request.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isAr ? 'محرك السحر فائق السرعة (Low-Latency Magic)' : 'Low-Latency Magic Engine'}
              </h2>
              <p className="text-xs text-neutral-400">
                {isAr
                  ? 'استجابة فورية بأقل زمن تأخير ممكن مع نموذج gemini-3.1-flash-lite'
                  : 'Sub-second real-time reasoning powered by gemini-3.1-flash-lite'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <span>gemini-3.1-flash-lite</span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 mb-4 pt-2 border-t border-neutral-800">
          <button
            onClick={() => setMode('enhance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'enhance'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'تعزيز فوري للبرومبت والكاميرا' : 'Instant Prompt Expansion'}</span>
          </button>

          <button
            onClick={() => setMode('critique')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'critique'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'نقد وتوجيه فني سريع' : 'Rapid Scene Critique'}</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="relative">
          <input
            type="text"
            value={inputIdea}
            onChange={(e) => setInputIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleExecute();
            }}
            placeholder={
              isAr
                ? 'أدخل كلمات بسيطة أو فكرة سريعة... (مثال: محارب في عاصفة ثلجية)'
                : 'Enter a few words or rough concept... (e.g., Samurai in snow blizzard)'
            }
            className="w-full px-4 py-3.5 pe-28 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
          <button
            onClick={() => handleExecute()}
            disabled={isLoading || !inputIdea.trim()}
            className="absolute end-2 top-2 bottom-2 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-40 transition cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{isAr ? 'تنفيذ فوري' : 'Execute'}</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="shrink-0 text-[11px] text-neutral-500 font-semibold">
            {isAr ? 'جرّب بسرعة:' : 'Try fast:'}
          </span>
          {quickPresets.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputIdea(qp);
                handleExecute(qp);
              }}
              className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-950 hover:bg-neutral-800 text-neutral-300 text-[11px] border border-neutral-800 transition cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Latency & Results Showcase */}
      {(latencyMs !== null || isLoading || resultData || rawTextResult) && (
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isAr ? 'النتيجة الفورية' : 'Instant Result'}
              </h3>
            </div>

            {latencyMs !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {latencyMs}ms {isAr ? '(زمن استجابة فائق)' : '(Ultra Low Latency)'}
                </span>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
              <p className="text-xs text-neutral-400">
                {isAr
                  ? 'جاري المعالجة السريعة عبر gemini-3.1-flash-lite...'
                  : 'Fast response streaming via gemini-3.1-flash-lite...'}
              </p>
            </div>
          ) : resultData ? (
            <div className="space-y-4">
              {/* Enhanced English Master Prompt */}
              {resultData.enhancedPrompt && (
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'البرومبت المعزز (English Master Prompt)' : 'Enhanced Master Prompt'}</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard('master', resultData.enhancedPrompt)}
                      className="px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 hover:text-white text-[11px] flex items-center gap-1 transition"
                    >
                      {copiedKey === 'master' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isAr ? 'نسخ' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-mono bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/60">
                    {resultData.enhancedPrompt}
                  </p>

                  {/* Transfer to Image or Video Studio */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => onUseForImage(resultData.enhancedPrompt)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isAr ? 'استخدام في توليد الصور (1K-4K) 🎨' : 'Send to Image Studio 🎨'}</span>
                    </button>

                    <button
                      onClick={() => onUseForVideo(resultData.enhancedPrompt)}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isAr ? 'استخدام في توليد الفيديو (Veo 3.1) 🎬' : 'Send to Video Studio 🎬'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Arabic Translation if present */}
              {resultData.enhancedPromptArabic && (
                <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300">
                  <span className="font-bold text-neutral-400 block mb-1">الوصف بالعربية:</span>
                  <p>{resultData.enhancedPromptArabic}</p>
                </div>
              )}

              {/* Camera & Lighting Recommendations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultData.camera && (
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isAr ? 'توصيات الكاميرا والعدسة' : 'Camera & Lens Tips'}</span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">{resultData.camera}</p>
                  </div>
                )}

                {resultData.lighting && (
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <SunMedium className="w-3.5 h-3.5" />
                      <span>{isAr ? 'الإضاءة والمزاج اللوني' : 'Lighting & Mood'}</span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">{resultData.lighting}</p>
                  </div>
                )}
              </div>

              {/* Negative Prompt */}
              {resultData.negativePrompt && (
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isAr ? 'الكلمات السلبية المقترحة (Negative)' : 'Suggested Negative Prompts'}</span>
                  </div>
                  <p className="text-neutral-300 font-mono text-[11px]">{resultData.negativePrompt}</p>
                </div>
              )}
            </div>
          ) : rawTextResult ? (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
              {rawTextResult}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
