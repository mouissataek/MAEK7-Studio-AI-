import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Sliders,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Maximize2,
  Trash2,
  Video,
  Upload,
  Layers,
  Camera,
  SunMedium,
  ShieldAlert,
  Loader2,
  Eye,
  X,
} from 'lucide-react';
import { ImageSize, AspectRatio, GeneratedItem } from '../types';
import { apiFetch } from '../utils/api';
import { imageCost, DEFAULT_IMAGE_MODEL } from '../utils/cost';
import { CostBadge } from './CostBadge';

interface ImageStudioProps {
  lang: 'ar' | 'en';
  initialPrompt?: string;
  onSaveGeneration: (item: GeneratedItem) => void;
  onSendToVideo?: (imageSrc: string, promptText: string) => void;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  lang,
  initialPrompt = '',
  onSaveGeneration,
  onSendToVideo,
}) => {
  const isAr = lang === 'ar';

  const [prompt, setPrompt] = useState(initialPrompt);
  const [size, setSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [selectedLighting, setSelectedLighting] = useState<string>('golden_hour');
  const [selectedCamera, setSelectedCamera] = useState<string>('85mm_bokeh');
  const [showProSettings, setShowProSettings] = useState(false);

  // Image-to-Image input
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Execution states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<GeneratedItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [zoomModal, setZoomModal] = useState<string | null>(null);

  // Sync if initialPrompt changes externally
  React.useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const stylePresets = [
    {
      id: 'cinematic',
      label: isAr ? 'سينمائي هوليوودي' : 'Cinematic Movie',
      promptSuffix: ', cinematic lighting, 8k resolution, photorealistic, depth of field, anamorphic lens',
    },
    {
      id: 'photoreal',
      label: isAr ? 'واقعي فائق 8K' : 'Hyper-Realistic 8K',
      promptSuffix: ', raw photo, ultra-detailed, 8k uhd, dslr, soft lighting, high quality',
    },
    {
      id: 'unreal5',
      label: isAr ? 'رندر ثلاثي الأبعاد UE5' : 'Unreal Engine 5 3D',
      promptSuffix: ', 3d render, octane render, unreal engine 5, ray tracing, subsurface scattering, highly detailed',
    },
    {
      id: 'anime',
      label: isAr ? 'أنمي ياباني متقن' : 'Makoto Shinkai Anime',
      promptSuffix: ', anime visual style, makoto shinkai aesthetic, vibrant sky, expressive lighting, masterpiece, clean lines',
    },
    {
      id: 'cyberpunk',
      label: isAr ? 'سايبربانك نيون' : 'Cyberpunk Neon',
      promptSuffix: ', cyberpunk aesthetic, neon lights, night rain reflections, holographic HUD, volumetric fog',
    },
    {
      id: 'fantasy',
      label: isAr ? 'فن رقمي خيالي' : 'Epic Fantasy Art',
      promptSuffix: ', epic fantasy digital painting, intricate magical details, grand scale, volumetric golden lighting',
    },
    {
      id: 'vintage',
      label: isAr ? 'فيلم كلاسيكي 35مم' : 'Vintage 35mm Film',
      promptSuffix: ', vintage 35mm kodachrome photo, authentic analog grain, nostalgic muted color tones, subtle light leak',
    },
  ];

  const lightingPresets = [
    { id: 'golden_hour', label: isAr ? 'الساعة الذهبية' : 'Golden Hour', suffix: ', golden hour sunlight, warm glow' },
    { id: 'chiaroscuro', label: isAr ? 'تدرج درامي حاد' : 'Dramatic Chiaroscuro', suffix: ', dramatic high-contrast chiaroscuro lighting, deep shadows' },
    { id: 'studio', label: isAr ? 'استوديو ناعم' : 'Studio Softbox', suffix: ', professional studio softbox lighting, clean reflections' },
    { id: 'neon', label: isAr ? 'نيون ليلي ملون' : 'Neon Noir', suffix: ', vibrant dual neon colored rim lighting' },
    { id: 'volumetric', label: isAr ? 'أشعة ضبابية' : 'Volumetric Rays', suffix: ', god rays, volumetric fog lighting' },
  ];

  const cameraPresets = [
    { id: '85mm_bokeh', label: isAr ? 'بورتريه 85مم بوكيه' : '85mm f/1.4 Bokeh', suffix: ', shot on 85mm f/1.4 lens, creamy bokeh, shallow depth of field' },
    { id: 'wide_angle', label: isAr ? 'زاوية واسعة سينمائية' : 'Wide Cinematic 24mm', suffix: ', wide angle 24mm cinematic landscape lens, expansive view' },
    { id: 'macro', label: isAr ? 'ماكرو مقرب جداً' : 'Extreme Macro', suffix: ', extreme macro lens close-up, microscopic crisp texture' },
    { id: 'drone', label: isAr ? 'لقطة درون جوية' : 'Drone Aerial 4K', suffix: ', breathtaking drone aerial top-down perspective' },
  ];

  const examplePrompts = [
    isAr
      ? 'رائد فضاء ينظر إلى كوكب نيون أرجواني من خلال نافذة محطة فضائية مستقبلية، تفاصيل زجاجية متناهية'
      : 'Astronaut gazing at a surreal purple neon exoplanet through a futuristic space station window, ultra-detailed reflections',
    isAr
      ? 'نمر عربي مهيب في قمة جبلية صخرية مع ضباب كثيف وقت شروق الشمس الذهبية، تصوير وثائقي طبيعي'
      : 'Majestic Arabian leopard perched on a misty rocky cliff at golden sunrise, National Geographic documentary style, sharp fur detail',
    isAr
      ? 'مدينة ساحلية عائمة بتقنية السايبربانك مع قوارب مضيئة وانعكاسات ضوئية على سطح الماء في ليلة ممطرة'
      : 'Floating cyberpunk coastal metropolis with luminous neon boats and vibrant water reflections during a light rain shower',
  ];

  // Fast Prompt Supercharge using gemini-3.1-flash-lite
  const handleFastSupercharge = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await apiFetch('/api/low-latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: 'enhance',
          currentLanguage: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enhance prompt');

      if (data.data?.enhancedPrompt) {
        setPrompt(isAr && data.data.enhancedPromptArabic ? data.data.enhancedPromptArabic : data.data.enhancedPrompt);
        if (data.data.negativePrompt) {
          setNegativePrompt(data.data.negativePrompt);
        }
      } else if (data.text) {
        setPrompt(data.text.trim());
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Could not supercharge prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError(isAr ? 'يرجى كتابة وصف للصورة أولاً.' : 'Please enter an image prompt first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Build synthesized prompt with style modifiers
    let finalPrompt = prompt.trim();
    const styleObj = stylePresets.find((s) => s.id === selectedStyle);
    if (styleObj) finalPrompt += styleObj.promptSuffix;

    if (showProSettings) {
      const lightObj = lightingPresets.find((l) => l.id === selectedLighting);
      if (lightObj) finalPrompt += lightObj.suffix;
      const camObj = cameraPresets.find((c) => c.id === selectedCamera);
      if (camObj) finalPrompt += camObj.suffix;
    }

    if (negativePrompt.trim()) {
      finalPrompt += `, avoid: ${negativePrompt.trim()}`;
    }

    try {
      const response = await apiFetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          size,
          aspectRatio,
          base64Image: referenceImage || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate image');
      }

      const newItem: GeneratedItem = {
        id: 'img_' + Date.now(),
        type: 'image',
        url: data.image,
        prompt: prompt.trim(),
        aspectRatio,
        sizeOrResolution: size,
        model: data.modelUsed || DEFAULT_IMAGE_MODEL,
        createdAt: Date.now(),
        notes: data.notes,
      };

      setCurrentResult(newItem);
      onSaveGeneration(newItem);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err?.message || 'Error generating image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left / Control Panel */}
      <div className="lg:col-span-7 space-y-6">
        {/* Main Prompt Card */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {isAr ? 'وصف المشهد الإبداعي' : 'Creative Prompt'}
              </h2>
            </div>

            {/* Fast Supercharge with Flash-Lite */}
            <button
              onClick={handleFastSupercharge}
              disabled={isEnhancing || isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
              title={isAr ? 'تحسين البرومبت فورياً بنموذج Flash-Lite' : 'Instant Flash-Lite Supercharge'}
            >
              {isEnhancing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{isAr ? 'تحسين فائق (Flash-Lite)' : 'Supercharge (Flash-Lite)'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب ما تتخيله بدقة... (مثال: قلعة كريستالية مضيئة بين السحب عند الغسق مع شلالات ضوء منسابة)'
                  : 'Describe your vision in rich detail... (e.g., A luminous crystal citadel floating between dusk clouds with cascading waterfalls of light)'
              }
              rows={4}
              className="w-full p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-neutral-500 text-sm outline-none resize-none transition"
            />
            {prompt && (
              <div className="absolute bottom-3 end-3 flex items-center gap-2">
                <button
                  onClick={copyPrompt}
                  className="p-1.5 rounded-md bg-neutral-800/80 text-neutral-400 hover:text-white transition"
                  title="Copy Prompt"
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

          {/* Prompt Ideas Pills */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-neutral-400">
            <span className="shrink-0 text-[11px] font-semibold text-neutral-500">
              {isAr ? 'أفكار ملهمة:' : 'Inspirations:'}
            </span>
            {examplePrompts.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(ex)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/50 text-[11px] truncate max-w-[200px] transition cursor-pointer"
                title={ex}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution & Aspect Ratio Selectors (Key requirement: gemini-3-pro-image-preview 1K, 2K, 4K) */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-6">
          {/* Resolution Selector: 1K, 2K, 4K */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-neutral-200">
                  {isAr ? 'دقة الصورة المخرجة' : 'Output Resolution'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                gemini-3-pro-image-preview
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['1K', '2K', '4K'] as ImageSize[]).map((res) => {
                const isSelected = size === res;
                const desc =
                  res === '1K'
                    ? (isAr ? '1024px سريع ومتوازن' : '1024px Standard')
                    : res === '2K'
                    ? (isAr ? '2048px عالي الوضوح HD' : '2048px High Res')
                    : (isAr ? '4096px فائق الدقة Ultra HD' : '4096px Ultra HD');
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setSize(res)}
                    className={`relative p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                        : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {res === '4K' && (
                      <span className="absolute -top-2 end-2 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow">
                        Pro 4K
                      </span>
                    )}
                    <div className="text-base font-extrabold tracking-tight">{res}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div>
            <span className="block text-xs font-bold text-neutral-200 mb-3">
              {isAr ? 'نسبة الأبعاد' : 'Aspect Ratio'}
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(
                [
                  { val: '1:1', label: '1:1', sub: isAr ? 'مربع' : 'Square' },
                  { val: '16:9', label: '16:9', sub: isAr ? 'سينمائي' : 'Cinema' },
                  { val: '9:16', label: '9:16', sub: isAr ? 'ستوري' : 'Story' },
                  { val: '4:3', label: '4:3', sub: isAr ? 'كلاسيك' : 'Classic' },
                  { val: '3:4', label: '3:4', sub: isAr ? 'بورتريه' : 'Portrait' },
                  { val: '2:3', label: '2:3', sub: isAr ? 'ملصق' : 'Poster' },
                ] as { val: AspectRatio; label: string; sub: string }[]
              ).map((ar) => (
                <button
                  key={ar.val}
                  type="button"
                  onClick={() => setAspectRatio(ar.val)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    aspectRatio === ar.val
                      ? 'bg-purple-600/20 border-purple-500 text-white ring-1 ring-purple-500'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="text-xs font-bold">{ar.label}</div>
                  <div className="text-[9px] text-neutral-500">{ar.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Presets */}
          <div>
            <span className="block text-xs font-bold text-neutral-200 mb-3">
              {isAr ? 'النمط الفني والجمالي' : 'Artistic Style'}
            </span>
            <div className="flex flex-wrap gap-2">
              {stylePresets.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                    selectedStyle === st.id
                      ? 'bg-neutral-100 text-neutral-900 border-white font-bold'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pro Settings Toggle (Camera, Lighting, Negative Prompts, Reference Image) */}
          <div className="pt-2 border-t border-neutral-800">
            <button
              onClick={() => setShowProSettings(!showProSettings)}
              className="flex items-center justify-between w-full text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {isAr
                    ? 'إعدادات متقدمة (الكاميرا، الإضاءة، صورة مرجعية، كلمات مستبعدة)'
                    : 'Pro Settings (Camera, Lighting, Image-to-Image, Negative Prompt)'}
                </span>
              </div>
              <span className="text-[10px] text-indigo-400 font-bold">
                {showProSettings ? (isAr ? 'إخفاء ▲' : 'Hide ▲') : (isAr ? 'عرض ▼' : 'Show ▼')}
              </span>
            </button>

            {showProSettings && (
              <div className="mt-4 space-y-4 pt-3 border-t border-neutral-800/60">
                {/* Lighting & Camera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-1.5">
                      <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'الإضاءة والمزاج' : 'Lighting & Mood'}</span>
                    </label>
                    <select
                      value={selectedLighting}
                      onChange={(e) => setSelectedLighting(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {lightingPresets.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? 'العدسة وزاوية الكاميرا' : 'Camera Lens & Angle'}</span>
                    </label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                    >
                      {cameraPresets.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Negative Prompt */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>{isAr ? 'عناصر مستبعدة (Negative Prompt)' : 'Negative Prompt'}</span>
                  </label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder={
                      isAr
                        ? 'تجنب: تشوه، ضبابية، نص غير مرغوب، تشويش...'
                        : 'e.g., blurry, watermark, distorted, low quality, oversaturated'
                    }
                    className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Image-to-Image / Reference Image */}
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 mb-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {isAr
                        ? 'صورة مرجعية للتعديل (Image-to-Image)'
                        : 'Reference Image (Image-to-Image / Edit)'}
                    </span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {referenceImage ? (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="w-14 h-14 object-cover rounded-lg border border-neutral-700"
                      />
                      <div className="flex-1 text-xs">
                        <span className="text-white font-medium block">
                          {isAr ? 'تم تحميل الصورة المرجعية' : 'Reference Image Attached'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {isAr
                            ? 'سيستخدم النموذج صورتك كقاعدة مع النص المكتوب'
                            : 'The model will edit or build upon this image'}
                        </span>
                      </div>
                      <button
                        onClick={() => setReferenceImage(null)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 rounded-md transition"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 border border-dashed border-neutral-700 hover:border-indigo-500 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs flex items-center justify-center gap-2 transition cursor-pointer bg-neutral-950/40"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {isAr
                          ? 'انقر لرفع صورة للتعديل أو الإلهام (PNG / JPG)'
                          : 'Click to upload starting/reference image'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{isAr ? 'حدث خطأ في التوليد' : 'Generation Error'}</p>
                <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <CostBadge lang={lang} units={imageCost(size)} />

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {isAr
                    ? `جاري التوليد بدقة ${size} عبر Gemini 3 Pro...`
                    : `Generating in ${size} with Gemini 3 Pro...`}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {isAr
                    ? `توليد الصورة الآن (${size} • ${aspectRatio})`
                    : `Generate Image (${size} • ${aspectRatio})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right / Showcase & Results Canvas */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl backdrop-blur-sm min-h-[480px] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isAr ? 'شاشة العرض والمخرجات' : 'Output Canvas'}
              </h3>
            </div>
            {currentResult && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {currentResult.sizeOrResolution} • {currentResult.aspectRatio}
              </span>
            )}
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex flex-col items-center justify-center relative rounded-xl bg-neutral-950 border border-neutral-800/80 overflow-hidden min-h-[380px]">
            {isGenerating ? (
              <div className="text-center p-8 space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
                  <div className="w-full h-full rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-pink-500 border-l-transparent animate-spin" />
                  <Sparkles className="w-8 h-8 text-indigo-400 absolute inset-0 m-auto" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isAr ? 'يتم رسم المشهد الآن بدقة فائقة...' : 'Synthesizing Latent Visuals...'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                    {isAr
                      ? `جاري معالجة الإضاءة والعمق والدقة (${size}) عبر نموذج gemini-3-pro-image-preview`
                      : `Processing cinematic lighting and 4K latent details with gemini-3-pro-image-preview`}
                  </p>
                </div>
              </div>
            ) : currentResult ? (
              <div className="w-full h-full flex flex-col group relative">
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                  <img
                    src={currentResult.url}
                    alt={currentResult.prompt}
                    className="max-h-[460px] w-full object-contain cursor-pointer transition hover:scale-[1.01]"
                    onClick={() => setZoomModal(currentResult.url)}
                  />

                  {/* Overlay Action Buttons */}
                  <div className="absolute top-3 end-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={() => setZoomModal(currentResult.url)}
                      className="p-2 rounded-lg bg-neutral-900/80 backdrop-blur-md text-white hover:bg-neutral-800 transition"
                      title={isAr ? 'تكبير كامل للشاشة' : 'Full Preview'}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <a
                      href={currentResult.url}
                      download={`aether-image-${currentResult.id}.png`}
                      className="p-2 rounded-lg bg-indigo-600/90 backdrop-blur-md text-white hover:bg-indigo-500 transition"
                      title={isAr ? 'تحميل الصورة' : 'Download Image'}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Bottom Details & Cross-studio tools */}
                <div className="p-4 bg-neutral-900 border-t border-neutral-800 space-y-3">
                  <p className="text-xs text-neutral-300 line-clamp-2" title={currentResult.prompt}>
                    "{currentResult.prompt}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60">
                    <div className="text-[10px] text-neutral-400 font-mono">
                      <span>Model: {currentResult.model}</span>
                    </div>

                    {/* Send to Video Studio Button */}
                    {onSendToVideo && (
                      <button
                        onClick={() => onSendToVideo(currentResult.url, currentResult.prompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition cursor-pointer"
                        title={isAr ? 'استخدام كإطار بداية في استوديو الفيديو' : 'Animate as Starting Frame in Video Studio'}
                      >
                        <Video className="w-3.5 h-3.5 text-purple-400" />
                        <span>{isAr ? 'تحريك في استوديو الفيديو 🎬' : 'Send to Video Studio 🎬'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-600">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-300">
                    {isAr ? 'لا توجد صورة مولدة حالياً' : 'No Image Generated Yet'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-xs mx-auto">
                    {isAr
                      ? 'حدد الدقة (1K/2K/4K) واكتب فكرتك واضغط "توليد الصورة" لبدء الإبداع.'
                      : 'Choose your resolution (1K/2K/4K), enter a prompt, and click Generate.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Modal */}
      {zoomModal && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setZoomModal(null)}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 end-2 flex items-center gap-2 z-10">
              <a
                href={zoomModal}
                download="aether-full-image.png"
                className="p-2 rounded-xl bg-neutral-900/90 text-white hover:bg-neutral-800 transition"
              >
                <Download className="w-5 h-5" />
              </a>
              <button
                onClick={() => setZoomModal(null)}
                className="p-2 rounded-xl bg-neutral-900/90 text-white hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={zoomModal}
              alt="Zoomed"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-neutral-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
