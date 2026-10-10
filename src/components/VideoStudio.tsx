import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Sparkles,
  Wand2,
  Upload,
  Trash2,
  Loader2,
  Film,
  Maximize2,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Clapperboard,
} from 'lucide-react';
import { VideoResolution, VideoAspectRatio, GeneratedItem } from '../types';
import { apiFetch } from '../utils/api';
import { videoCost } from '../utils/cost';
import { CostBadge } from './CostBadge';

const POLL_INTERVAL_MS = 6000;
const MAX_WAIT_MS = 10 * 60 * 1000; // give up after 10 minutes
const MAX_POLL_FAILURES = 4; // consecutive network/server failures tolerated

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });

const formatElapsed = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

interface VideoStudioProps {
  lang: 'ar' | 'en';
  initialPrompt?: string;
  initialImage?: string | null;
  onSaveGeneration: (item: GeneratedItem) => void;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  lang,
  initialPrompt = '',
  initialImage = null,
  onSaveGeneration,
}) => {
  const isAr = lang === 'ar';

  const [prompt, setPrompt] = useState(initialPrompt);
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [model, setModel] = useState<'veo-3.1-lite-generate-preview' | 'veo-3.1-generate-preview'>(
    'veo-3.1-lite-generate-preview'
  );
  const [startingImage, setStartingImage] = useState<string | null>(initialImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video generation execution states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight request/polling when leaving the studio.
  useEffect(() => () => abortRef.current?.abort(), []);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoResult, setCurrentVideoResult] = useState<GeneratedItem | null>(null);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if props update
  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialImage) setStartingImage(initialImage);
  }, [initialPrompt, initialImage]);

  const exampleVideoPrompts = [
    isAr
      ? 'لقطة سينمائية بطيئة لنسر يحلق فوق وديان جليدية مع ضوء شمس شتوي دافئ وانعكاسات على الثلج'
      : 'Slow cinematic tracking shot of an eagle soaring over majestic frozen canyons, warm winter sunlight',
    isAr
      ? 'سيارة رياضية مضيئة تسير بسرعة في شوارع طوكيو الممطرة ليلاً مع حركة كاميرا درامية ديناميكية'
      : 'Futuristic luminous hypercar speeding through Tokyo rain slicked streets at night, dynamic dolly zoom camera',
    isAr
      ? 'تحول تدريجي لزهرة أوركيد تتفتح ببطء في غابة مضيئة حيوياً بتقنية تايم لابس'
      : 'Time-lapse of an alien bioluminescent orchid blooming inside an enchanted glowing forest',
  ];

  // Honest stages (we can't observe Veo's real progress, only start / done / download).
  const videoStages = isAr
    ? ['إرسال الطلب إلى Veo...', 'Veo يولّد الفيديو (عادةً من 1 إلى 3 دقائق)...', 'تنزيل الفيديو النهائي...']
    : ['Submitting request to Veo...', 'Veo is rendering (usually 1–3 minutes)...', 'Downloading the final video...'];

  // Fast Video Prompt Enhancement (Flash-Lite)
  const handleEnhanceVideoPrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await apiFetch('/api/low-latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Enhance this video prompt for Veo 3.1 video generation model. Add camera motion, lighting, and pacing: "${prompt.trim()}"`,
          type: 'enhance',
          currentLanguage: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to polish prompt');

      if (data.data?.enhancedPrompt) {
        setPrompt(isAr && data.data.enhancedPromptArabic ? data.data.enhancedPromptArabic : data.data.enhancedPrompt);
      } else if (data.text) {
        setPrompt(data.text.trim());
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not polish video prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStartingImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelVideo = () => abortRef.current?.abort();

  // Video Generation Flow
  const handleGenerateVideo = async () => {
    if (!prompt.trim() && !startingImage) {
      setError(
        isAr
          ? 'يرجى كتابة وصف للحركة أو رفع صورة بداية.'
          : 'Please enter a prompt or upload a starting frame.'
      );
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setIsGenerating(true);
    setError(null);
    setElapsedSeconds(0);
    setCurrentStage(videoStages[0]);

    const startedAt = Date.now();
    const clock = setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);

    try {
      // Step 1: start generation
      const startRes = await apiFetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          prompt: prompt.trim() || undefined,
          base64Image: startingImage || undefined,
          resolution,
          aspectRatio,
          model,
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || startData.details || 'Failed to start video generation');
      }

      const operationName = startData.operationName;
      setCurrentStage(videoStages[1]);

      // Step 2: poll sequentially (next poll only starts after the previous one finished)
      let failures = 0;
      for (;;) {
        if (Date.now() - startedAt > MAX_WAIT_MS) {
          throw new Error(
            isAr
              ? 'انتهت مهلة الانتظار (10 دقائق). قد يكون الفيديو ما زال قيد التوليد لدى Google؛ حاول لاحقاً.'
              : 'Timed out after 10 minutes. Google may still be rendering; try again later.'
          );
        }

        await sleep(POLL_INTERVAL_MS, signal);

        try {
          const statusRes = await apiFetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal,
            body: JSON.stringify({ operationName }),
          });
          const statusData = await statusRes.json();

          if (statusRes.status === 429) {
            // rate limited: just wait for the next round
            continue;
          }
          if (!statusRes.ok) throw new Error(statusData.error || 'Failed to check status');
          if (statusData.error) {
            throw Object.assign(new Error(statusData.error.message || 'Operation returned error'), { fatal: true });
          }

          failures = 0;
          if (statusData.done) break;
        } catch (pollErr: any) {
          if (pollErr?.name === 'AbortError' || pollErr?.fatal) throw pollErr;
          failures++;
          console.warn(`Poll error (${failures}/${MAX_POLL_FAILURES}):`, pollErr);
          if (failures >= MAX_POLL_FAILURES) throw pollErr;
        }
      }

      // Step 3: download
      setCurrentStage(videoStages[2]);
      const downloadRes = await apiFetch('/api/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        const errorJson = await downloadRes.json().catch(() => null);
        throw new Error(errorJson?.error || 'Failed to download generated video stream');
      }

      const videoBlob = await downloadRes.blob();

      const newItem: GeneratedItem = {
        id: 'vid_' + Date.now(),
        type: 'video',
        url: URL.createObjectURL(videoBlob),
        blob: videoBlob, // persisted by the gallery storage (blob: URLs die on reload)
        prompt: prompt.trim() || 'Image-to-Video Animation',
        aspectRatio,
        sizeOrResolution: resolution,
        model,
        createdAt: Date.now(),
      };

      setCurrentVideoResult(newItem);
      onSaveGeneration(newItem);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError(
          isAr
            ? 'تم إلغاء الانتظار. ملاحظة: قد تكون Google بدأت التوليد وتُحاسبك عليه.'
            : 'Cancelled waiting. Note: Google may already have started rendering and may still bill it.'
        );
      } else {
        console.error('Video generation error:', err);
        setError(
          err?.message ||
            (isAr
              ? 'تعذر توليد الفيديو. يرجى التأكد من تفعيل صلاحيات نموذج Veo 3.1 في مفتاح API.'
              : 'Failed to generate video. Please verify Veo 3.1 permissions and quota on your API key.')
        );
      }
    } finally {
      clearInterval(clock);
      abortRef.current = null;
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Control Panel */}
      <div className="lg:col-span-7 space-y-6">
        {/* Prompt Card */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Clapperboard className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {isAr ? 'سيناريو وحركة الفيديو (Veo 3.1)' : 'Video Motion & Prompt (Veo 3.1)'}
              </h2>
            </div>

            <button
              onClick={handleEnhanceVideoPrompt}
              disabled={isEnhancing || isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
              title={isAr ? 'تحسين سيناريو وحركة الكاميرا بـ Flash-Lite' : 'Fast Polish with Flash-Lite'}
            >
              {isEnhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isAr ? 'تحسين سينمائي (Flash-Lite)' : 'Polish with Flash-Lite'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isAr
                  ? 'صف حركة الكاميرا والعناصر... (مثال: لقطة سينمائية تتبع طائر الفينيق وهو يرتفع فوق بركان مشتعل مع تصاعد الدخان وانعكاسات الحمم)'
                  : 'Describe motion, camera movement, and pacing... (e.g., A slow cinematic tracking shot following a phoenix rising above an erupting volcano with glowing embers)'
              }
              rows={4}
              className="w-full p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white placeholder-neutral-500 text-sm outline-none resize-none transition"
            />
            {prompt && (
              <div className="absolute bottom-3 end-3 flex items-center gap-2">
                <button
                  onClick={copyPrompt}
                  className="p-1.5 rounded-md bg-neutral-800/80 text-neutral-400 hover:text-white transition"
                  title="Copy"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setPrompt('')}
                  className="p-1.5 rounded-md bg-neutral-800/80 text-neutral-400 hover:text-red-400 transition"
                  title="Clear"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Video Inspiration Pills */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-neutral-400">
            <span className="shrink-0 text-[11px] font-semibold text-neutral-500">
              {isAr ? 'أمثلة سينمائية:' : 'Sample Prompts:'}
            </span>
            {exampleVideoPrompts.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(ex)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50 text-[11px] truncate max-w-[210px] transition cursor-pointer"
                title={ex}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Video Configuration & Image-to-Video Frame */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-6">
          {/* Starting Frame (Image-to-Video) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-200">
                {isAr ? 'إطار البداية (Image-to-Video)' : 'Starting Frame (Image-to-Video)'}
              </span>
              <span className="text-[10px] text-neutral-400">
                {isAr ? 'اختياري: تحريك صورة ثابتة' : 'Optional: Animate a still image'}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {startingImage ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <img
                  src={startingImage}
                  alt="Starting Frame"
                  className="w-16 h-16 object-cover rounded-lg border border-neutral-700"
                />
                <div className="flex-1 text-xs">
                  <span className="text-white font-bold block">
                    {isAr ? 'تم تعيين إطار البداية للتحريك' : 'Starting Frame Loaded'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {isAr
                      ? 'سيبدأ الفيديو من هذه الصورة ويتحرك وفقاً لوصفك'
                      : 'Veo will animate from this image according to your prompt'}
                  </span>
                </div>
                <button
                  onClick={() => setStartingImage(null)}
                  className="p-1.5 text-neutral-400 hover:text-red-400 rounded-md transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-4 border border-dashed border-neutral-700 hover:border-purple-500 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs flex items-center justify-center gap-2 transition cursor-pointer bg-neutral-950/40"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'انقر لرفع صورة ثابتة لتحريكها إلى فيديو (PNG/JPG)'
                    : 'Upload a starting frame image to animate'}
                </span>
              </button>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <span className="block text-xs font-bold text-neutral-200 mb-2.5">
              {isAr ? 'نموذج الفيديو (Veo 3.1)' : 'Veo 3.1 Video Model'}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModel('veo-3.1-lite-generate-preview')}
                className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                  model === 'veo-3.1-lite-generate-preview'
                    ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">Veo 3.1 Lite</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {isAr ? 'توليد أسرع وأكثر كفاءة' : 'Fast and efficient generation'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setModel('veo-3.1-generate-preview')}
                className={`p-3 rounded-xl border text-start transition cursor-pointer ${
                  model === 'veo-3.1-generate-preview'
                    ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">Veo 3.1 Pro</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {isAr ? 'أقصى تفاصيل وحركة سينمائية' : 'Flagship cinema motion'}
                </div>
              </button>
            </div>
          </div>

          {/* Resolution & Aspect Ratio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resolution */}
            <div>
              <span className="block text-xs font-bold text-neutral-200 mb-2">
                {isAr ? 'دقة الفيديو' : 'Resolution'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['720p', '1080p'] as VideoResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setResolution(res)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                      resolution === res
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {res} {res === '1080p' && 'FHD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <span className="block text-xs font-bold text-neutral-200 mb-2">
                {isAr ? 'نسبة الأبعاد' : 'Aspect Ratio'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { val: '16:9', label: '16:9', sub: isAr ? 'عريض' : 'Landscape' },
                    { val: '9:16', label: '9:16', sub: isAr ? 'طولي' : 'Reels/Story' },
                  ] as { val: VideoAspectRatio; label: string; sub: string }[]
                ).map((ar) => (
                  <button
                    key={ar.val}
                    type="button"
                    onClick={() => setAspectRatio(ar.val)}
                    className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer ${
                      aspectRatio === ar.val
                        ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{ar.label}</div>
                    <div className="text-[9px] text-neutral-400">{ar.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isAr ? 'تنبيه حول توليد الفيديو' : 'Video Generation Notice'}</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <CostBadge lang={lang} units={videoCost(resolution, model)} />

          {/* Generate Button */}
          <button
            onClick={handleGenerateVideo}
            disabled={isGenerating || (!prompt.trim() && !startingImage)}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {isAr
                    ? `جاري توليد الفيديو عبر ${model} (${formatElapsed(elapsedSeconds)})...`
                    : `Rendering video with ${model} (${formatElapsed(elapsedSeconds)})...`}
                </span>
              </>
            ) : (
              <>
                <Film className="w-5 h-5" />
                <span>
                  {isAr
                    ? `توليد الفيديو الآن (${resolution} • ${aspectRatio})`
                    : `Generate Video (${resolution} • ${aspectRatio})`}
                </span>
              </>
            )}
          </button>

          {isGenerating && (
            <button
              type="button"
              onClick={handleCancelVideo}
              className="w-full py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 text-xs font-semibold transition cursor-pointer"
            >
              {isAr ? 'إلغاء الانتظار' : 'Cancel waiting'}
            </button>
          )}
        </div>
      </div>

      {/* Right / Video Canvas */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm min-h-[480px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isAr ? 'مشغل مخرجات الفيديو' : 'Video Player'}
              </h3>
            </div>
            {currentVideoResult && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {currentVideoResult.sizeOrResolution} • {currentVideoResult.aspectRatio}
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden min-h-[380px]">
            {isGenerating ? (
              <div className="text-center p-8 space-y-5 max-w-sm">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" />
                  <div className="w-full h-full rounded-full border-4 border-t-purple-500 border-r-pink-500 border-b-indigo-500 border-l-transparent animate-spin" />
                  <Film className="w-8 h-8 text-purple-400 absolute inset-0 m-auto" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white">
                    {isAr ? 'جاري تصيير الفيديو عبر Veo 3.1...' : 'Rendering with Veo 3.1...'}
                  </h4>
                  <p className="text-xs text-purple-300 font-medium">{currentStage}</p>

                  {/* Indeterminate bar: real progress isn't exposed by the API */}
                  <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden mt-3">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 w-1/3 rounded-full animate-pulse" />
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono block">
                    {formatElapsed(elapsedSeconds)}
                  </span>

                  <p className="text-[11px] text-neutral-500 pt-2">
                    {isAr
                      ? 'توليد الفيديوهات يتطلب دقيقة إلى بضع دقائق لضمان أقصى اتساق سينمائي وجودة.'
                      : 'Video synthesis takes a moment to ensure temporal coherence and cinema quality.'}
                  </p>
                </div>
              </div>
            ) : currentVideoResult ? (
              <div className="w-full h-full flex flex-col relative group">
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={videoRef}
                    src={currentVideoResult.url}
                    controls
                    loop
                    className="max-h-[460px] w-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>

                <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-3">
                  <p className="text-xs text-neutral-300 line-clamp-2">"{currentVideoResult.prompt}"</p>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Model: {currentVideoResult.model}
                    </span>
                    <a
                      href={currentVideoResult.url}
                      download={`aether-video-${currentVideoResult.id}.mp4`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تحميل MP4' : 'Download MP4'}</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-300">
                    {isAr ? 'جاهز لتوليد الفيديو' : 'Ready for Video Generation'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
                    {isAr
                      ? 'أدخل وصف الحركة أو قم بتحريك صورة موجودة باستخدام نموذج Veo 3.1.'
                      : 'Enter a motion prompt or upload a starting image to synthesize a video.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
