import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  FileCode,
  Share2,
  Check,
  Copy,
  Layers,
  Sparkles,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Flame,
  ArrowDownToLine,
} from 'lucide-react';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';

interface MobileGeneratorProps {
  lang: 'ar' | 'en';
}

export const MobileGenerator: React.FC<MobileGeneratorProps> = ({ lang }) => {
  const isAr = lang === 'ar';

  const [copiedPwa, setCopiedPwa] = useState(false);
  const [copiedCapacitor, setCopiedCapacitor] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Download Standalone Single-File HTML
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MAEK7-Studio-AI-Standalone.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const pwaManifestCode = JSON.stringify(
    {
      name: 'MAEK7-Studio AI',
      short_name: 'MAEK7 Studio',
      description: 'استوديو توليد الصور والفيديوهات الاحترافي بالذكاء الاصطناعي',
      start_url: '/',
      display: 'standalone',
      background_color: '#09090b',
      theme_color: '#09090b',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    null,
    2
  );

  const capacitorConfigCode = `// capacitor.config.json
{
  "appId": "com.maek7.studio.ai",
  "appName": "MAEK7-Studio AI",
  "webDir": "dist",
  "bundledWebRuntime": false
}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner: Standalone Download & Mobile App Generation */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950/40 border border-neutral-800 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isAr ? 'توليد تطبيق الموبايل وملف HTML المستقل' : 'Mobile App & Standalone HTML'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isAr
              ? 'حمّل التطبيق كملف HTML مستقل أو ثبّته كتطبيق موبايل أصلي'
              : 'Download Standalone HTML App or Install as Mobile PWA'}
          </h2>

          <p className="text-sm text-neutral-300 leading-relaxed">
            {isAr
              ? 'يمكنك الآن تنزيل تطبيق MAEK7-Studio AI كملف واحد مستقل (Single-File HTML) يعمل في أي متصفح على الحاسوب أو الهاتف دون الحاجة لأي خادم أو تثبيت، أو تثبيته مباشرة كتطبيق موبايل عبر شاشة الهاتف الرئيسية.'
              : 'Export the complete application as a self-contained Single-File HTML app to run offline or in any browser, or install it as a Progressive Web App (PWA) on your phone.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {/* Primary Download HTML Button */}
            <button
              onClick={handleDownloadStandaloneHtml}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              <span>
                {isAr
                  ? 'تحميل تطبيق HTML المستقل (Single-File App) 📥'
                  : 'Download Standalone HTML App 📥'}
              </span>
            </button>

            {/* Share / PWA Install */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'MAEK7-Studio AI',
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert(isAr ? 'تم نسخ رابط التطبيق للمشاركة!' : 'App URL copied!');
                }
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 font-bold text-xs transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'مشاركة رابط التطبيق' : 'Share App URL'}</span>
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>
                {isAr
                  ? 'تم تحميل ملف MAEK7-Studio-AI-Standalone.html بنجاح! يمكنك فتحه الآن في أي متصفح بالنقر المزدوج.'
                  : 'MAEK7-Studio-AI-Standalone.html downloaded! You can double-click and open it in any browser.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Mobile Simulator & Installation Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Live Mobile Simulator Frame */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-center mb-4 space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>{isAr ? 'معاينة حية لتطبيق الموبايل' : 'Live Smartphone Simulator'}</span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              {isAr ? 'جرّب الواجهة كما تظهر على شاشة الهاتف الذكي' : 'Experience the native mobile layout'}
            </p>
          </div>

          {/* Smartphone Mockup */}
          <div className="relative w-[320px] sm:w-[350px] h-[660px] bg-neutral-950 rounded-[48px] border-[10px] border-neutral-800 shadow-2xl overflow-hidden ring-1 ring-neutral-700/50 flex flex-col">
            {/* Top Speaker / Dynamic Island */}
            <div className="w-full h-8 bg-neutral-950 flex items-center justify-between px-6 pt-2 shrink-0 z-20">
              <span className="text-[10px] font-bold text-neutral-400 font-mono">9:41</span>
              <div className="w-20 h-4 bg-neutral-900 rounded-full border border-neutral-800 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-neutral-700 me-2" />
                <div className="w-2 h-2 rounded-full bg-indigo-500/40" />
              </div>
              <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-mono">
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Inner Mobile App Preview */}
            <div className="flex-1 bg-neutral-950 overflow-y-auto p-3.5 space-y-3.5 text-start font-sans">
              {/* Mobile Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-xs">
                    ✨
                  </div>
                  <div>
                    <span className="font-extrabold text-xs text-white block">MAEK7-Studio AI</span>
                    <span className="text-[9px] text-neutral-400">Mobile Edition</span>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Online
                </span>
              </div>

              {/* Mobile Tool Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300">مولد الصور (1K-4K)</span>
                  <span className="text-[9px] font-mono text-neutral-400">Gemini 3 Pro</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400">
                  قلعة عائمة في الفضاء مع أضواء نيون وبوكيه...
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1 text-[9px]">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold">1K</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">2K</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">4K</span>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold">
                    توليد 🎨
                  </button>
                </div>
              </div>

              {/* Mobile Video Card */}
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300">استوديو الفيديو (Veo 3.1)</span>
                  <span className="text-[9px] font-mono text-neutral-400">1080p FHD</span>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400">
                  لقطة سينمائية بطيئة لنسر يحلق فوق وديان جليدية...
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-neutral-400">Aspect: 16:9 Cinema</span>
                  <button className="px-3 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-bold">
                    تحريك 🎬
                  </button>
                </div>
              </div>

              {/* Mobile Director Pill */}
              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-[10px] text-indigo-300 flex items-center justify-between">
                <span>💬 المخرج الذكي: جاهز لصياغة أفكارك</span>
                <span className="text-[9px] font-bold">فتح ➜</span>
              </div>
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="w-full h-5 bg-neutral-950 flex items-center justify-center shrink-0">
              <div className="w-32 h-1 bg-neutral-600 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right / Guides & Configurations */}
        <div className="lg:col-span-7 space-y-6">
          {/* Guide 1: How to install as Mobile PWA */}
          <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'كيفية تثبيت التطبيق على هاتفك (PWA)' : 'How to Install on Phone (PWA)'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Android */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>هواتف أندرويد (Google Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                  <li>افتح رابط التطبيق في متصفح Chrome.</li>
                  <li>اضغط على قائمة الخيارات (الثلاث نقاط ⋮).</li>
                  <li>اختر <b>"التثبيت على الهاتف"</b> أو <b>"إضافة إلى الشاشة الرئيسية"</b>.</li>
                  <li>سيظهر التطبيق كأيقونة أصلية في هاتفك!</li>
                </ol>
              </div>

              {/* iOS */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <span>🍏</span>
                  <span>هواتف آيفون (Apple Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                  <li>افتح رابط التطبيق في متصفح Safari.</li>
                  <li>اضغط على زر المشاركة (مربع مع سهم للأعلى).</li>
                  <li>مرر للأسفل واختر <b>"إضافة إلى الصفحة الرئيسية (Add to Home Screen)"</b>.</li>
                  <li>يعمل التطبيق بشاشة كاملة كأي تطبيق iOS!</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Guide 2: PWA Manifest & Capacitor Android Build */}
          <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'إعدادات PWA Manifest & Capacitor APK' : 'PWA Manifest & Capacitor Export'}
                </h3>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pwaManifestCode);
                  setCopiedPwa(true);
                  setTimeout(() => setCopiedPwa(false), 2000);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-[11px] flex items-center gap-1 transition"
              >
                {copiedPwa ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isAr ? 'نسخ manifest.json' : 'Copy Manifest'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 font-mono overflow-x-auto max-h-44">
              {pwaManifestCode}
            </pre>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-mono">
                أوامر بناء APK مباشر عبر Capacitor:
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('npm i -g @capacitor/cli @capacitor/core && npx cap init && npx cap add android');
                  setCopiedCapacitor(true);
                  setTimeout(() => setCopiedCapacitor(false), 2000);
                }}
                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                {copiedCapacitor ? 'تم النسخ!' : 'نسخ أوامر التوليد CLI'}
              </button>
            </div>
          </div>

          {/* Standalone File Features Callout */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'ميزات ملف HTML المستقل الذي تم توليده:' : 'Standalone HTML File Features:'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ملف واحد فقط (Single-File) لا يحتاج أي تثبيت.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>يعمل محلياً أو دون خادم على أي جهاز.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>يحتوي جميع النماذج: 3 Pro Image (1K-4K), Veo 3.1, Flash Lite.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>حفظ محلي فوري للأعمال ومعرض مدمج.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
