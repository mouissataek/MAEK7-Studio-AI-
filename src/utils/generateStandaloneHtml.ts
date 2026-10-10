/**
 * Generates a self-contained, standalone single-file HTML application
 * for MAEK7-Studio AI that can be opened directly in any browser (file:// or http://)
 * without needing Node.js or any external build step.
 */
export function generateStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MAEK7-Studio AI - النسخة المستقلة للمتصفح والموبايل</title>
  <meta name="description" content="تطبيق MAEK7-Studio AI المستقل لتوليد الصور والفيديوهات بالذكاء الاصطناعي">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Cairo -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Cairo', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #09090b;
      color: #f4f4f5;
      font-family: 'Cairo', sans-serif;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #09090b; }
    ::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 9999px; }
  </style>
</head>
<body class="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-indigo-500 selection:text-white">

  <!-- Top App Header -->
  <header class="sticky top-0 z-40 backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-800">
    <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <div class="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center font-bold text-lg text-indigo-400">
            ✨
          </div>
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-extrabold text-base tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-400">
              MAEK7-Studio AI
            </span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Standalone Single-File
            </span>
          </div>
          <p class="text-[11px] text-neutral-400">تطبيق الويب والموبايل المستقل (يعمل في أي متصفح)</p>
        </div>
      </div>

      <!-- API Key Trigger -->
      <button onclick="toggleKeyModal()" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-300 transition">
        <span>🔑</span>
        <span id="keyStatusText">ضبط مفتاح Gemini API</span>
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="max-w-7xl mx-auto px-4 flex items-center gap-1 pb-2 overflow-x-auto">
      <button onclick="switchTab('image')" id="tab-image" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md">
        🎨 مولد الصور (1K-4K)
      </button>
      <button onclick="switchTab('video')" id="tab-video" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900/60">
        🎬 استوديو الفيديو (Veo 3.1)
      </button>
      <button onclick="switchTab('chat')" id="tab-chat" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900/60">
        💬 المخرج الذكي (Gemini 3)
      </button>
      <button onclick="switchTab('fast')" id="tab-fast" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900/60">
        ⚡ السحر السريع (Flash-Lite)
      </button>
      <button onclick="switchTab('gallery')" id="tab-gallery" class="tab-btn px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900/60">
        🖼️ المعرض (<span id="galleryCount">0</span>)
      </button>
    </div>
  </header>

  <!-- Main Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
    
    <!-- API Key Notice Banner if not set -->
    <div id="keyNotice" class="hidden mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-base">⚠️</span>
        <span>يرجى إدخال مفتاح Gemini API Key الخاص بك لتوليد الصور والفيديوهات مباشرة من متصفحك.</span>
      </div>
      <button onclick="toggleKeyModal()" class="px-3 py-1 rounded-lg bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition">
        إدخال المفتاح
      </button>
    </div>

    <!-- 1. IMAGE STUDIO -->
    <section id="view-image" class="view-panel block space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 space-y-4 p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <span>✨</span>
              <span>وصف الصورة (gemini-3-pro-image-preview)</span>
            </h2>
            <button onclick="fastSuperchargePrompt()" class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30">
              ⚡ تحسين فوري بـ Flash-Lite
            </button>
          </div>
          <textarea id="imagePrompt" rows="4" placeholder="اكتب وصفاً إبداعياً... (مثال: نمر عربي مهيب في قمة جبلية صخرية مع شروق الشمس الذهبية، 8K، إضاءة سينمائية)" class="w-full p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-indigo-500"></textarea>
          
          <!-- Image Size Affordance: 1K, 2K, 4K -->
          <div>
            <label class="text-xs font-bold text-neutral-300 block mb-2">الدقة المطلوبة (Image Size):</label>
            <div class="grid grid-cols-3 gap-3">
              <button onclick="setImageSize('1K')" id="size-1K" class="size-btn p-3 rounded-xl border border-neutral-800 bg-neutral-950 text-xs font-bold hover:border-neutral-700">1K (1024px)</button>
              <button onclick="setImageSize('2K')" id="size-2K" class="size-btn p-3 rounded-xl border border-indigo-500 bg-indigo-600/20 text-white text-xs font-bold shadow">2K (2048px HD)</button>
              <button onclick="setImageSize('4K')" id="size-4K" class="size-btn p-3 rounded-xl border border-neutral-800 bg-neutral-950 text-xs font-bold hover:border-neutral-700">4K (4096px Ultra)</button>
            </div>
          </div>

          <!-- Aspect Ratio -->
          <div>
            <label class="text-xs font-bold text-neutral-300 block mb-2">نسبة الأبعاد (Aspect Ratio):</label>
            <div class="grid grid-cols-4 gap-2">
              <button onclick="setAspectRatio('1:1')" id="ar-1:1" class="ar-btn p-2 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-bold">1:1 (مربع)</button>
              <button onclick="setAspectRatio('16:9')" id="ar-16:9" class="ar-btn p-2 rounded-lg border border-purple-500 bg-purple-600/20 text-white text-xs font-bold">16:9 (عريض)</button>
              <button onclick="setAspectRatio('9:16')" id="ar-9:16" class="ar-btn p-2 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-bold">9:16 (طولي)</button>
              <button onclick="setAspectRatio('4:3')" id="ar-4:3" class="ar-btn p-2 rounded-lg border border-neutral-800 bg-neutral-950 text-xs font-bold">4:3 (كلاسيك)</button>
            </div>
          </div>

          <button onclick="generateImageAction()" id="btnGenerateImage" class="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 hover:opacity-95 transition">
            🎨 توليد الصورة الآن
          </button>
        </div>

        <div class="lg:col-span-5 p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-center items-center min-h-[420px] relative">
          <div id="imageLoader" class="hidden text-center space-y-3">
            <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-neutral-300">جاري التوليد بدقة فائقة عبر gemini-3-pro-image-preview...</p>
          </div>
          <div id="imageResultContainer" class="w-full text-center">
            <div id="imagePlaceholder" class="text-neutral-500 text-xs space-y-2">
              <div class="text-3xl">🖼️</div>
              <p>ستظهر الصورة المولدة هنا بجودتها الكاملة.</p>
            </div>
            <img id="imageResultImg" class="hidden max-h-[400px] w-full object-contain rounded-xl shadow-2xl mx-auto" alt="Result">
            <div id="imageResultActions" class="hidden mt-4 flex items-center justify-center gap-2">
              <a id="btnDownloadImage" download="maek7-image.png" class="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition">📥 تحميل PNG</a>
              <button onclick="sendToVideoFromImage()" class="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition">🎬 تحريك في الفيديو</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. VIDEO STUDIO -->
    <section id="view-video" class="view-panel hidden space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 space-y-4 p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🎬</span>
            <span>استوديو الفيديو (Veo 3.1)</span>
          </h2>
          <textarea id="videoPrompt" rows="4" placeholder="صف حركة الكاميرا والعناصر بدقة... (مثال: لقطة سينمائية بطيئة لنسر يحلق فوق وديان جليدية مع ضوء شمس شتوي دافئ)" class="w-full p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white outline-none focus:border-purple-500"></textarea>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-neutral-300 block mb-1">دقة الفيديو:</label>
              <select id="videoRes" class="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white">
                <option value="720p">720p HD (سريع)</option>
                <option value="1080p">1080p FHD (فائق الجودة)</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-neutral-300 block mb-1">نسبة الأبعاد:</label>
              <select id="videoAspect" class="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white">
                <option value="16:9">16:9 (عريض سينمائي)</option>
                <option value="9:16">9:16 (طولي تيك توك وريلز)</option>
              </select>
            </div>
          </div>

          <button onclick="generateVideoAction()" id="btnGenerateVideo" class="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:opacity-95 transition">
            🎬 توليد الفيديو عبر Veo 3.1
          </button>
        </div>

        <div class="lg:col-span-5 p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-center items-center min-h-[420px]">
          <div id="videoLoader" class="hidden text-center space-y-3">
            <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p id="videoStatusText" class="text-xs text-purple-300">جاري تهيئة فضاء الحركة عبر Veo 3.1...</p>
          </div>
          <div id="videoResultContainer" class="w-full text-center">
            <div id="videoPlaceholder" class="text-neutral-500 text-xs space-y-2">
              <div class="text-3xl">🎥</div>
              <p>ستظهر معاينة الفيديو هنا بمجرد التوليد.</p>
            </div>
            <video id="videoResultPlayer" controls loop class="hidden max-h-[400px] w-full rounded-xl shadow-2xl mx-auto"></video>
            <div id="videoResultActions" class="hidden mt-4 flex items-center justify-center gap-2">
              <a id="btnDownloadVideo" download="maek7-video.mp4" class="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition">📥 تحميل MP4</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. AI CHAT DIRECTOR -->
    <section id="view-chat" class="view-panel hidden space-y-4">
      <div class="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col h-[650px]">
        <div class="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div class="flex items-center gap-2">
            <span class="text-lg">💬</span>
            <span class="text-sm font-bold text-white">المخرج الذكي متعدد الأدوار (Multi-Role Chat)</span>
          </div>
          <select id="chatModel" class="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white">
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (مهام عميقة ومعقدة)</option>
            <option value="gemini-3.5-flash" selected>Gemini 3.5 Flash (مهام عامة ومتوازنة)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (سرعة فائقة)</option>
          </select>
        </div>

        <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-3">
          <div class="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300 max-w-[85%]">
            مرحباً بك! أنا مخرجك الفني الذكي في MAEK7-Studio AI. يمكنني مساعدتك في صياغة برومبتات استثنائية، ضبط زوايا الكاميرا، أو ابتكار سيناريوهات سينمائية.
          </div>
        </div>

        <form onsubmit="handleSendChat(event)" class="pt-3 border-t border-neutral-800 flex gap-2">
          <input id="chatInput" type="text" placeholder="اسأل المخرج الفني عن أي فكرة أو اطلب برومبت..." class="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500">
          <button type="submit" class="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition">إرسال</button>
        </form>
      </div>
    </section>

    <!-- 4. FAST MAGIC (FLASH-LITE) -->
    <section id="view-fast" class="view-panel hidden space-y-6">
      <div class="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
        <h2 class="text-sm font-bold text-white flex items-center gap-2">
          <span>⚡</span>
          <span>محرك السحر فائق السرعة (Low-Latency Flash-Lite)</span>
        </h2>
        <div class="flex gap-2">
          <input id="fastInput" type="text" placeholder="أدخل فكرة سريعة... (مثال: محارب في عاصفة ثلجية يابانية)" class="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-amber-500">
          <button onclick="executeFastMagic()" class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition">تنفيذ فوري ⚡</button>
        </div>
        <div id="fastResult" class="hidden p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 whitespace-pre-wrap"></div>
      </div>
    </section>

    <!-- 5. GALLERY -->
    <section id="view-gallery" class="view-panel hidden space-y-6">
      <div class="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
        <h2 class="text-sm font-bold text-white">🖼️ معرض الإبداعات المحفوظة محلياً</h2>
        <button onclick="clearGallery()" class="text-xs text-red-400 hover:underline">مسح المعرض</button>
      </div>
      <div id="galleryGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"></div>
    </section>

  </main>

  <!-- API KEY MODAL -->
  <div id="keyModal" class="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div class="max-w-md w-full p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-white flex items-center gap-2">
          <span>🔑</span>
          <span>إعداد مفتاح Gemini API Key</span>
        </h3>
        <button onclick="toggleKeyModal()" class="text-neutral-400 hover:text-white">✕</button>
      </div>
      <p class="text-xs text-neutral-400 leading-relaxed">
        لأن هذا التطبيق يعمل كملف مستقل (Standalone HTML) في متصفحك أو على هاتفك، يتم إرسال طلبات الذكاء الاصطناعي مباشرة إلى Google GenAI API.
      </p>
      <input id="inputApiKey" type="password" placeholder="AIzaSy..." class="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500 font-mono">
      <div class="flex justify-end gap-2 pt-2">
        <button onclick="toggleKeyModal()" class="px-4 py-2 rounded-xl text-neutral-400 text-xs">إلغاء</button>
        <button onclick="saveApiKey()" class="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500">حفظ المفتاح</button>
      </div>
    </div>
  </div>

  <!-- SCRIPT LOGIC -->
  <script>
    let currentApiKey = localStorage.getItem('MAEK7_GEMINI_KEY') || '';
    let selectedImageSize = '2K';
    let selectedAspectRatio = '16:9';
    let galleryItems = JSON.parse(localStorage.getItem('MAEK7_GALLERY') || '[]');

    function updateKeyStatus() {
      const el = document.getElementById('keyStatusText');
      const notice = document.getElementById('keyNotice');
      if (currentApiKey) {
        el.innerText = '🔑 المفتاح محفوظ (' + currentApiKey.slice(0, 6) + '...)';
        notice.classList.add('hidden');
      } else {
        el.innerText = '⚠️ إدخال مفتاح Gemini API';
        notice.classList.remove('hidden');
      }
    }

    function toggleKeyModal() {
      const modal = document.getElementById('keyModal');
      modal.classList.toggle('hidden');
      if (!modal.classList.contains('hidden') && currentApiKey) {
        document.getElementById('inputApiKey').value = currentApiKey;
      }
    }

    function saveApiKey() {
      const val = document.getElementById('inputApiKey').value.trim();
      currentApiKey = val;
      localStorage.setItem('MAEK7_GEMINI_KEY', val);
      updateKeyStatus();
      toggleKeyModal();
    }

    function switchTab(tab) {
      document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        b.classList.add('text-neutral-400', 'bg-neutral-900/60');
      });
      document.getElementById('view-' + tab).classList.remove('hidden');
      const btn = document.getElementById('tab-' + tab);
      btn.classList.remove('text-neutral-400', 'bg-neutral-900/60');
      btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
      if (tab === 'gallery') renderGallery();
    }

    function setImageSize(sz) {
      selectedImageSize = sz;
      document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('border-indigo-500', 'bg-indigo-600/20', 'text-white', 'shadow');
        b.classList.add('border-neutral-800', 'bg-neutral-950');
      });
      document.getElementById('size-' + sz).classList.add('border-indigo-500', 'bg-indigo-600/20', 'text-white', 'shadow');
    }

    function setAspectRatio(ar) {
      selectedAspectRatio = ar;
      document.querySelectorAll('.ar-btn').forEach(b => {
        b.classList.remove('border-purple-500', 'bg-purple-600/20', 'text-white');
        b.classList.add('border-neutral-800', 'bg-neutral-950');
      });
      document.getElementById('ar-' + ar).classList.add('border-purple-500', 'bg-purple-600/20', 'text-white');
    }

    // Direct Google GenAI API Call for Image Generation (gemini-3-pro-image-preview)
    async function generateImageAction() {
      const prompt = document.getElementById('imagePrompt').value.trim();
      if (!prompt) { alert('يرجى كتابة وصف للصورة أولاً.'); return; }
      if (!currentApiKey) { toggleKeyModal(); return; }

      document.getElementById('imagePlaceholder').classList.add('hidden');
      document.getElementById('imageResultImg').classList.add('hidden');
      document.getElementById('imageResultActions').classList.add('hidden');
      document.getElementById('imageLoader').classList.remove('hidden');

      try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=' + encodeURIComponent(currentApiKey);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': currentApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              imageConfig: {
                aspectRatio: selectedAspectRatio,
                imageSize: selectedImageSize
              }
            }
          })
        });

        const data = await res.json();
        if (data.error) {
          if (data.error.code === 401 || data.error.message?.includes('authentication credentials')) {
            throw new Error('مفتاح API غير صالح أو غير مكتمل الصلاحيات. تأكد من نسخ مفتاح صحيح من Google AI Studio (يبدأ بـ AIzaSy...).');
          } else if (data.error.code === 429 || data.error.message?.includes('quota')) {
            throw new Error('نموذج الصور gemini-3-pro-image يتطلب تفعيل الفوترة (Paid Tier) في Google AI Studio.');
          }
          throw new Error(data.error.message || 'Error from Gemini API');
        }

        let base64 = null;
        let mime = 'image/png';
        if (data.candidates && data.candidates[0]?.content?.parts) {
          for (const p of data.candidates[0].content.parts) {
            if (p.inlineData?.data) {
              base64 = p.inlineData.data;
              mime = p.inlineData.mimeType || 'image/png';
              break;
            }
          }
        }

        if (!base64) throw new Error('لم يتم استخراج صورة صالحة من الرد.');

        const imgSrc = 'data:' + mime + ';base64,' + base64;
        const imgEl = document.getElementById('imageResultImg');
        imgEl.src = imgSrc;
        imgEl.classList.remove('hidden');
        document.getElementById('btnDownloadImage').href = imgSrc;
        document.getElementById('imageResultActions').classList.remove('hidden');

        // Save to gallery
        saveToGallery({
          id: 'img_' + Date.now(),
          type: 'image',
          url: imgSrc,
          prompt,
          sizeOrResolution: selectedImageSize,
          aspectRatio: selectedAspectRatio,
          createdAt: Date.now()
        });

      } catch (err) {
        alert('حدث خطأ: ' + err.message);
        document.getElementById('imagePlaceholder').classList.remove('hidden');
      } finally {
        document.getElementById('imageLoader').classList.add('hidden');
      }
    }

    // Fast Supercharge with Flash-Lite
    async function fastSuperchargePrompt() {
      const prompt = document.getElementById('imagePrompt').value.trim();
      if (!prompt) return;
      if (!currentApiKey) { toggleKeyModal(); return; }

      try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + currentApiKey;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Enhance this image prompt for 4K cinematic photorealism: ' + prompt }] }]
          })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          document.getElementById('imagePrompt').value = text.trim();
        }
      } catch (e) {
        console.warn('Supercharge error:', e);
      }
    }

    // Direct Chatbot with History
    let chatHistory = [];
    async function handleSendChat(e) {
      e.preventDefault();
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      if (!currentApiKey) { toggleKeyModal(); return; }

      const messagesContainer = document.getElementById('chatMessages');
      // Append user bubble
      const userDiv = document.createElement('div');
      userDiv.className = 'bg-indigo-600 text-white p-3 rounded-xl text-xs max-w-[85%] mr-auto';
      userDiv.innerText = text;
      messagesContainer.appendChild(userDiv);

      chatHistory.push({ role: 'user', parts: [{ text }] });
      input.value = '';

      const model = document.getElementById('chatModel').value;
      const loaderDiv = document.createElement('div');
      loaderDiv.className = 'text-xs text-neutral-500';
      loaderDiv.innerText = 'جاري التفكير...';
      messagesContainer.appendChild(loaderDiv);

      try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + currentApiKey;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: chatHistory })
        });
        const data = await res.json();
        loaderDiv.remove();

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لم يتم استلام رد.';
        chatHistory.push({ role: 'model', parts: [{ text: reply }] });

        const botDiv = document.createElement('div');
        botDiv.className = 'bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-200 max-w-[85%] leading-relaxed whitespace-pre-wrap';
        botDiv.innerText = reply;
        messagesContainer.appendChild(botDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } catch (err) {
        loaderDiv.innerText = 'خطأ: ' + err.message;
      }
    }

    // Fast Magic Execution
    async function executeFastMagic() {
      const input = document.getElementById('fastInput').value.trim();
      if (!input) return;
      if (!currentApiKey) { toggleKeyModal(); return; }

      const out = document.getElementById('fastResult');
      out.classList.remove('hidden');
      out.innerText = 'جاري المعالجة السريعة عبر Flash-Lite...';

      try {
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + currentApiKey;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Provide a rapid cinematic visual prompt and lighting formula for: ' + input }] }]
          })
        });
        const data = await res.json();
        out.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'لا توجد نتيجة.';
      } catch (err) {
        out.innerText = 'خطأ: ' + err.message;
      }
    }

    // Video Action
    async function generateVideoAction() {
      alert('لتوليد الفيديوهات عبر Veo 3.1، استخدم الخادم المحلي المشغل لـ Express أو تطبيق PWA المدمج لمعالجة سير العمل متعدد المراحل.');
    }

    function sendToVideoFromImage() {
      const prompt = document.getElementById('imagePrompt').value;
      document.getElementById('videoPrompt').value = prompt;
      switchTab('video');
    }

    function saveToGallery(item) {
      galleryItems.unshift(item);
      localStorage.setItem('MAEK7_GALLERY', JSON.stringify(galleryItems.slice(0, 50)));
      document.getElementById('galleryCount').innerText = galleryItems.length;
    }

    function renderGallery() {
      const grid = document.getElementById('galleryGrid');
      grid.innerHTML = '';
      if (galleryItems.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs text-neutral-500">لا توجد عناصر محفوظة حتى الآن.</div>';
        return;
      }
      galleryItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden';
        card.innerHTML = '<img src="' + item.url + '" class="w-full aspect-video object-cover"><div class="p-3 text-xs text-neutral-300 truncate">' + item.prompt + '</div>';
        grid.appendChild(card);
      });
    }

    function clearGallery() {
      if (confirm('هل أنت متأكد من مسح جميع عناصر المعرض؟')) {
        galleryItems = [];
        localStorage.removeItem('MAEK7_GALLERY');
        document.getElementById('galleryCount').innerText = '0';
        renderGallery();
      }
    }

    // Init on load
    updateKeyStatus();
    document.getElementById('galleryCount').innerText = galleryItems.length;
  </script>
</body>
</html>`;
}
