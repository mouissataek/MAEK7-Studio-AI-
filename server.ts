// Must be first so env vars are loaded before guard.ts reads them.
import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import { GoogleGenAI, GenerateVideosOperation, ThinkingLevel } from '@google/genai';
import {
  authRequired,
  requireAccess,
  rateLimit,
  reserveBudget,
  refundBudget,
  budgetStatus,
  BUDGET_ERROR,
} from './guard.ts';
import {
  DEFAULT_IMAGE_MODEL,
  DEFAULT_VIDEO_MODEL,
  VIDEO_MODELS,
  IMAGE_SIZE_UNITS,
  VIDEO_RES_UNITS,
  VIDEO_FULL_MODEL_MULTIPLIER,
  imageCost,
  videoCost,
} from './src/utils/cost.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000', 10);
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not defined in the environment.');
}

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Image models the client may use. Override with IMAGE_MODELS="modelA,modelB"
// (first = default). Keep this list short: every entry is a model users can bill you for.
const IMAGE_MODELS = (process.env.IMAGE_MODELS || DEFAULT_IMAGE_MODEL)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const CHAT_MODELS = ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];

const isQuotaOrAuthError = (err: any) =>
  err?.status === 429 ||
  err?.status === 401 ||
  err?.status === 403 ||
  /quota|RESOURCE_EXHAUSTED|authentication credentials|API key/i.test(err?.message || '');

async function startServer() {
  const app = express();

  // Needed for correct req.ip (rate limit / budget) behind Cloud Run, nginx, etc.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

  // Limits per IP per minute
  const genLimiter = rateLimit('gen', 6);
  const textLimiter = rateLimit('text', 30);
  const pollLimiter = rateLimit('poll', 60);

  // Increase payload limit to support image uploads for image-to-image & image-to-video
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Public config: allowed models, relative cost table and the caller's remaining budget.
  app.get('/api/config', (req, res) => {
    res.json({
      authRequired,
      imageModels: IMAGE_MODELS,
      videoModels: VIDEO_MODELS,
      defaults: { imageModel: IMAGE_MODELS[0], videoModel: DEFAULT_VIDEO_MODEL },
      cost: {
        imageSizeUnits: IMAGE_SIZE_UNITS,
        videoResolutionUnits: VIDEO_RES_UNITS,
        videoFullModelMultiplier: VIDEO_FULL_MODEL_MULTIPLIER,
      },
      budget: budgetStatus(req.ip || 'unknown'),
    });
  });

  // Download Standalone HTML Single-File app directly
  app.get('/api/download-standalone-html', async (_req, res) => {
    try {
      const { generateStandaloneHtml } = await import('./src/utils/generateStandaloneHtml.ts');
      const html = generateStandaloneHtml();
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="MAEK7-Studio-AI-Standalone.html"');
      res.send(html);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate standalone HTML file.' });
    }
  });

  /**
   * 1. High-Quality Image Generation & Editing
   * Uses gemini-3-pro-image-preview (with fallback to gemini-3-pro-image or gemini-nano-banana-2.1)
   * Supports image sizes: 1K, 2K, 4K
   * Supports aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4
   */
  app.post('/api/generate-image', requireAccess, genLimiter, async (req, res) => {
    let reserved = 0;
    const ip = req.ip || 'unknown';
    try {
      const {
        prompt,
        size = '1K',
        aspectRatio = '1:1',
        base64Image,
        mimeType = 'image/png',
        modelChoice,
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required and must be a string.' });
      }

      // Valid sizes: 1K, 2K, 4K
      const validSizes = ['1K', '2K', '4K'] as const;
      const targetSize = (validSizes as readonly string[]).includes(size) ? (size as '1K' | '2K' | '4K') : '1K';

      if (base64Image && typeof base64Image === 'string' && base64Image.length > 14_000_000) {
        return res.status(413).json({ error: 'الصورة المرجعية كبيرة جداً (الحد ~10MB).' });
      }

      // Supported aspect ratios
      const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2'];
      const targetAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '1:1';

      // Only whitelisted models are allowed; the requested one goes first, the rest are fallbacks.
      const requested = IMAGE_MODELS.includes(modelChoice) ? modelChoice : IMAGE_MODELS[0];
      const candidateModels = [requested, ...IMAGE_MODELS.filter((m) => m !== requested)];

      // Reserve budget up front (refunded below if generation fails).
      const units = imageCost(targetSize);
      if (!reserveBudget(ip, units)) {
        return res.status(429).json(BUDGET_ERROR);
      }
      reserved = units;

      // Build content parts
      const parts: any[] = [];
      if (base64Image) {
        const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: prompt });

      let lastError: any = null;
      let generatedImageBase64: string | null = null;
      let generatedMimeType = 'image/png';
      let textFeedback = '';

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: targetAspect as any,
                imageSize: targetSize as any,
              },
            },
          });

          const candidates = response.candidates;
          if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
            for (const part of candidates[0].content.parts) {
              if (part.inlineData?.data) {
                generatedImageBase64 = part.inlineData.data;
                generatedMimeType = part.inlineData.mimeType || 'image/png';
              } else if (part.text) {
                textFeedback += part.text + '\n';
              }
            }
          }

          if (generatedImageBase64) {
            return res.json({
              success: true,
              image: `data:${generatedMimeType};base64,${generatedImageBase64}`,
              prompt,
              size: targetSize,
              aspectRatio: targetAspect,
              modelUsed: model,
              notes: textFeedback.trim(),
            });
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${model} failed. Error:`, err?.message || err);
          // Quota/auth errors won't be fixed by another model: stop instead of paying for retries.
          if (isQuotaOrAuthError(err)) break;
        }
      }

      // Nothing was generated: give the reserved units back.
      refundBudget(ip, reserved);
      reserved = 0;

      console.error('All image generation models failed:', lastError);
      const isQuotaOrAuth = isQuotaOrAuthError(lastError);

      const userFriendlyError = isQuotaOrAuth
        ? 'يتطلب نموذج توليد الصور فائق الدقة (gemini-3-pro-image-preview) ونموذج Veo مفتاح API مفعّل به الفوترة (Paid Billing Enabled) في Google AI Studio. يرجى اختيار مفتاح مفعل الفوترة من لوحة Settings > Secrets.'
        : (lastError?.message || 'فشل توليد الصورة. يرجى التحقق من مفتاح API والصلاحيات.');

      return res.status(500).json({
        error: userFriendlyError,
        details: lastError?.toString?.() || '',
        isQuotaExceeded: isQuotaOrAuth,
      });
    } catch (err: any) {
      if (reserved) refundBudget(ip, reserved);
      console.error('Error in /api/generate-image:', err);
      return res.status(500).json({
        error: err?.message || 'Internal server error while generating image.',
      });
    }
  });

  /**
   * 2. Low-Latency Responses
   * Uses gemini-3.1-flash-lite for ultra-fast response times
   * Enhances prompts, suggests visual ideas, styles, lighting, and negative prompts in milliseconds
   */
  app.post('/api/low-latency', requireAccess, textLimiter, async (req, res) => {
    try {
      const { prompt, type = 'enhance', currentLanguage = 'ar' } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const isArabic = currentLanguage === 'ar';

      let systemInstruction = '';
      if (type === 'enhance') {
        systemInstruction = isArabic
          ? `أنت خبير فائق السرعة في هندسة البرومبت للصور والفيديوهات. حول الفكرة البسيطة إلى وصف بصري إبداعي غني بالتفاصيل (الإضاءة، زاوية الكاميرا، النمط، العمق، التفاصيل السينمائية). قدم أيضاً نصائح للكاميرا ونقاط سلبية مقترحة. أجب بصيغة JSON نظيفة تحتوي: { "enhancedPrompt": "الوصف المعزز بالإنجليزية", "enhancedPromptArabic": "الوصف المعزز بالعربية", "camera": "زاوية الكاميرا ونوع العدسة", "lighting": "الإضاءة والألوان", "negativePrompt": "الكلمات السلبية المقترحة" }.`
          : `You are an ultra-fast expert prompt engineer for AI images and videos. Convert this user idea into a cinematic, highly-detailed prompt. Respond with clean JSON containing: { "enhancedPrompt": "Enhanced detailed English prompt", "camera": "Camera shot and lens", "lighting": "Lighting and mood", "negativePrompt": "Negative prompt suggestions" }.`;
      } else if (type === 'critique') {
        systemInstruction = isArabic
          ? `أنت ناقد فني بصري سريع. قدم تقييماً موجزاً ودقيقاً في 3 نقاط محددة لتحسين جودة وتكوين هذا المشهد بالذكاء الاصطناعي.`
          : `You are a rapid visual director. Provide a concise, 3-bullet assessment to maximize the visual impact and quality of this scene.`;
      } else {
        systemInstruction = `You are a low-latency creative AI assistant. Provide a quick, concise, high-impact suggestion.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL,
          },
        },
      });

      const responseText = response.text || '';
      let parsedJson: any = null;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedJson = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Not strict JSON, fallback to raw text
      }

      return res.json({
        success: true,
        model: 'gemini-3.1-flash-lite',
        text: responseText,
        data: parsedJson,
      });
    } catch (err: any) {
      console.error('Error in /api/low-latency:', err);
      return res.status(500).json({
        error: err?.message || 'Error executing low-latency request.',
      });
    }
  });

  /**
   * 3. Multi-turn Chatbot with Role Selection and Model Switcher
   * Complex tasks: gemini-3.1-pro-preview
   * General tasks: gemini-3.5-flash
   * Fast tasks: gemini-3.1-flash-lite
   * Maintains conversation history and role system instructions
   */
  app.post('/api/chat', requireAccess, textLimiter, async (req, res) => {
    try {
      const {
        messages = [],
        model = 'gemini-3.5-flash',
        role = 'director',
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
      }

      // Allowed models
      const selectedModel = CHAT_MODELS.includes(model) ? model : 'gemini-3.5-flash';

      // Bound the history so a long chat can't turn into a huge (expensive) request.
      if (messages.length > 40) messages.splice(0, messages.length - 40);

      // Define role-specific system instructions
      const roleInstructions: Record<string, string> = {
        director: `أنت المخرج الفني والسينمائي الإبداعي (Creative Art Director) لاستوديو MAEK7-Studio AI.
مهمتك إرشاد المستخدم في تأليف وتصميم صور ومشاهد فيديو استثنائية وعالية الجودة.
أنت خبير في:
- الإضاءة السينمائية (Cinematic Lighting, Volumetric rays, Chiaroscuro, Neon Noir)
- زوايا الكاميرا وحركتها (Dolly zoom, Pan, Drone wide shot, Macro lens 85mm f/1.4)
- أساليب الفن (Photorealism, Unreal Engine 5, Anime Makoto Shinkai, Cyberpunk, Oil painting)
- صياغة نصوص التوليد بدقة، وتقديم اقتراحات عملية يمكن نسخها مباشرة لتوليد الصور أو الفيديوهات.
كن ملهماً ومحترفاً ولطيفاً وتحدث باللغة العربية (مع تزويد مصطلحات البرومبت الدقيقة بالإنجليزية).`,

        prompt_engineer: `You are an elite Prompt Engineer for Image & Video Generation models (Gemini Image, Veo 3.1, Midjourney style).
Whenever the user asks for an idea or scene, provide:
1. Complete Master Prompt (in English, formatted for maximum image quality)
2. Recommended Aspect Ratio (1:1, 16:9, 9:16)
3. Recommended Resolution (1K, 2K, 4K for images, or 720p/1080p for Veo video)
4. Recommended Negative Prompts
Explain your choices briefly in Arabic or English according to user input.`,

        storyboard_artist: `أنت فنان لوحات المشاهد والمؤثرات البصرية (Storyboard & Motion Video Director).
متخصص في تحويل الأفكار إلى سيناريوهات فيديو حركية ونصوص Veo 3.1 احترافية.
تصف بدقة:
- المشهد الافتتاحي والحركة الأساسية (Camera Movement & Subject Dynamics)
- التوقيت والسرعة والإيقاع
- التحولات البصرية والانتقالات
- كيفية تحقيق أفضل نتيجة باستخدام نموذج Veo مع إرفاق برومبت فيديو جاهز تماماً.`,

        stylist: `أنت مصمم الهوية البصرية والشخصيات (Character Stylist & Aesthetics Designer).
تساعد المستخدم في ابتكار شخصيات فريدة ومتناسقة، وتحديد أزياء مفصلة، وتنسيق الألوان، وحفظ السمات المميزة عبر صور متعددة.`
      };

      const systemInstruction =
        roleInstructions[role] || roleInstructions.director;

      // Format messages for ai.models.generateContent
      // Convert history to contents format: role: 'user' | 'model', parts: [{ text }]
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text || m.content || '' }],
      }));

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
        },
      });

      const replyText = response.text || '';

      return res.json({
        success: true,
        reply: replyText,
        modelUsed: selectedModel,
        roleUsed: role,
      });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      return res.status(500).json({
        error: err?.message || 'Error occurred during chat interaction.',
      });
    }
  });

  /**
   * 4. Video Generation (Veo 3.1)
   * Follows the 3-step POST pattern from SKILL.md:
   * Step 1: POST /api/generate-video -> returns { operationName }
   * Step 2: POST /api/video-status -> returns { done, error }
   * Step 3: POST /api/video-download -> streams video binary back to client
   */
  app.post('/api/generate-video', requireAccess, genLimiter, async (req, res) => {
    let reserved = 0;
    const ip = req.ip || 'unknown';
    try {
      const {
        prompt,
        resolution = '720p',
        aspectRatio = '16:9',
        base64Image,
        mimeType = 'image/png',
        model: requestedModel,
      } = req.body;
      const model: string = VIDEO_MODELS.includes(requestedModel) ? requestedModel : DEFAULT_VIDEO_MODEL;

      if (!prompt && !base64Image) {
        return res.status(400).json({ error: 'Either prompt or starting image is required.' });
      }

      const validAspectRatios = ['16:9', '9:16'];
      const targetAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const validResolutions = ['720p', '1080p'];
      const targetResolution = validResolutions.includes(resolution) ? resolution : '720p';

      const videoConfig: any = {
        numberOfVideos: 1,
        resolution: targetResolution,
        aspectRatio: targetAspect,
      };

      if (base64Image && typeof base64Image === 'string' && base64Image.length > 14_000_000) {
        return res.status(413).json({ error: 'الصورة كبيرة جداً (الحد ~10MB).' });
      }

      const units = videoCost(targetResolution as '720p' | '1080p', model);
      if (!reserveBudget(ip, units)) {
        return res.status(429).json(BUDGET_ERROR);
      }
      reserved = units;

      const requestPayload: any = {
        model,
        config: videoConfig,
      };

      if (prompt) {
        requestPayload.prompt = prompt;
      }

      if (base64Image) {
        const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, '');
        requestPayload.image = {
          imageBytes: cleanBase64,
          mimeType: mimeType || 'image/png',
        };
      }

      console.log('Starting Veo video generation with model:', requestPayload.model);
      const operation = await ai.models.generateVideos(requestPayload);

      if (!operation || !operation.name) {
        throw new Error('Failed to start video operation. No operation name returned.');
      }

      return res.json({
        success: true,
        operationName: operation.name,
        resolution: targetResolution,
        aspectRatio: targetAspect,
        prompt,
      });
    } catch (err: any) {
      if (reserved) refundBudget(ip, reserved);
      console.error('Error starting video generation:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to initiate video generation.',
        details: err?.toString?.() || '',
      });
    }
  });

  app.post('/api/video-status', requireAccess, pollLimiter, async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: 'operationName is required.' });
      }

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      return res.json({
        done: Boolean(updated.done),
        error: updated.error || null,
      });
    } catch (err: any) {
      console.error('Error checking video status:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to poll video status.',
      });
    }
  });

  app.post('/api/video-download', requireAccess, pollLimiter, async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: 'operationName is required.' });
      }

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: 'Generated video URI not found in operation response.' });
      }

      console.log('Downloading video from URI:', uri);
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey || '' },
      });

      if (!videoRes.ok) {
        throw new Error(`Failed to fetch video stream from Google storage. Status: ${videoRes.status}`);
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline; filename="generated-video.mp4"');

      if (videoRes.body) {
        // Pipe with backpressure instead of buffering chunks manually.
        const nodeStream = Readable.fromWeb(videoRes.body as any);
        nodeStream.on('error', (e) => {
          console.error('Video stream error:', e);
          res.destroy(e);
        });
        res.on('close', () => nodeStream.destroy());
        nodeStream.pipe(res);
      } else {
        const arrayBuf = await videoRes.arrayBuffer();
        res.send(Buffer.from(arrayBuf));
      }
    } catch (err: any) {
      console.error('Error downloading video:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to stream video file.',
      });
    }
  });

  // Serve static files or Vite middlewares
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    const indexFile = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexFile)) {
      console.error(`❌ ${indexFile} not found. Run "npm run build" before starting in production.`);
    }
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      // A missing file (e.g. /assets/x.js) must be a real 404, not index.html:
      // browsers refuse to run HTML served as a JS module and the app never starts.
      if (path.extname(req.path)) return res.status(404).send('Not found');
      if (!fs.existsSync(indexFile)) {
        return res.status(500).send('Build output missing: run "npm run build" first.');
      }
      res.sendFile(indexFile);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MAEK7-Studio AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
