import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Video,
  Loader2,
  Cpu,
  Zap,
  Flame,
  Brain,
  Wand2,
} from 'lucide-react';
import { ChatMessage, ChatRole, ChatModel } from '../types';
import { apiFetch } from '../utils/api';

interface ChatDirectorProps {
  lang: 'ar' | 'en';
  onUseForImage: (prompt: string) => void;
  onUseForVideo: (prompt: string) => void;
}

export const ChatDirector: React.FC<ChatDirectorProps> = ({
  lang,
  onUseForImage,
  onUseForVideo,
}) => {
  const isAr = lang === 'ar';

  const [role, setRole] = useState<ChatRole>('director');
  const [model, setModel] = useState<ChatModel>('gemini-3.5-flash');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const initialWelcomeText = isAr
    ? 'مرحباً بك! أنا مخرجك الفني الذكي في MAEK7-Studio AI. كيف يمكنني مساعدتك اليوم؟ يمكنني اقتراح سيناريوهات بصرية، تفصيل إضاءات سينمائية، ضبط حركة الكاميرا، أو صياغة برومبت صور وفيديو متفوق بدقة تصل إلى 4K.'
    : 'Welcome! I am your AI Creative Director at MAEK7-Studio AI. How can I assist your vision today? I can script cinematic scenes, refine camera optics, orchestrate Veo video timing, or engineer hyper-detailed prompts up to 4K.';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_init',
      role: 'assistant',
      text: initialWelcomeText,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const roles = [
    {
      id: 'director' as ChatRole,
      title: isAr ? 'مخرج فني وسينمائي' : 'Creative Art Director',
      badge: isAr ? 'إخراج وإضاءة' : 'Lighting & Direction',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      desc: isAr
        ? 'خبير في تكوين المشاهد، الإضاءة الهوليوودية، وتوجيه العدسات'
        : 'Expert in visual composition, cinematic lighting, and lens styling',
    },
    {
      id: 'prompt_engineer' as ChatRole,
      title: isAr ? 'مهندس برومبت محترف' : 'Master Prompt Engineer',
      badge: isAr ? 'دقة وتفاصيل' : 'Prompt Precision',
      icon: <Wand2 className="w-4 h-4 text-indigo-400" />,
      desc: isAr
        ? 'يصيغ برومبتات احترافية متكاملة للصور والفيديوهات'
        : 'Crafts high-yield prompts with negative cues and technical terms',
    },
    {
      id: 'storyboard_artist' as ChatRole,
      title: isAr ? 'مخرج مشاهد وفيديو' : 'Storyboard Director',
      badge: isAr ? 'حركة Veo' : 'Veo Dynamics',
      icon: <Video className="w-4 h-4 text-pink-400" />,
      desc: isAr
        ? 'متخصص في تخطيط المشاهد الحركية وسيناريوهات Veo 3.1'
        : 'Specializes in scene pacing, camera movements, and video scripts',
    },
    {
      id: 'stylist' as ChatRole,
      title: isAr ? 'مصمم الهوية والشخصيات' : 'Character & Style Stylist',
      badge: isAr ? 'اتساق الشخصيات' : 'Consistent Styles',
      icon: <Bot className="w-4 h-4 text-cyan-400" />,
      desc: isAr
        ? 'يبتكر ملامح شخصيات متناسقة وأساليب فنية مخصصة'
        : 'Designs unique characters, costumes, and uniform artistic identities',
    },
  ];

  const modelOptions: {
    id: ChatModel;
    label: string;
    useCase: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'gemini-3.1-pro-preview',
      label: 'Gemini 3.1 Pro',
      useCase: isAr ? 'للمهام المعقدة والتفكير العميق' : 'Complex & Deep Reasoning',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
      color: 'border-purple-500/40 text-purple-300',
    },
    {
      id: 'gemini-3.5-flash',
      label: 'Gemini 3.5 Flash',
      useCase: isAr ? 'للمهام العامة والمتوازنة' : 'General & Balanced Tasks',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/40 text-amber-300',
    },
    {
      id: 'gemini-3.1-flash-lite',
      label: 'Gemini 3.1 Flash Lite',
      useCase: isAr ? 'للمهام السريعة جداً بأقل زمن' : 'Ultra-Fast & Low Latency',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/40 text-cyan-300',
    },
  ];

  const suggestedQuestions = [
    isAr
      ? 'اقترح لي مشهداً سينمائياً خيالياً لمدينة تحت الماء مع إضاءة حيوية'
      : 'Suggest an epic underwater bioluminescent city scene with cinematic lighting',
    isAr
      ? 'صمم برومبت صورة 4K لسيارة مستقبلية مع زاوية تصوير 24mm'
      : 'Write a 4K photorealistic prompt for a futuristic supercar at dusk',
    isAr
      ? 'كيف أصيغ حركة كاميرا انسيابية لنموذج Veo 3.1 لتتبع شخص يركض في غابة؟'
      : 'How to describe a continuous dynamic camera tracking shot for Veo 3.1?',
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsSending(true);

    try {
      const response = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          model,
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get chat response');
      }

      const assistantMsg: ChatMessage = {
        id: 'msg_res_' + Date.now(),
        role: 'assistant',
        text: data.reply || '',
        timestamp: Date.now(),
        modelUsed: data.modelUsed || model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        text: isAr
          ? `عذراً، حدث خطأ أثناء التواصل مع النموذج: ${err.message}`
          : `Sorry, an error occurred: ${err.message}`,
        timestamp: Date.now(),
        modelUsed: model,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        text: initialWelcomeText,
        timestamp: Date.now(),
        modelUsed: model,
      },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[760px] max-h-[85vh]">
      {/* Sidebar: Role & Model Selector */}
      <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
        {/* Model Switcher (Requirement: gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite) */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {isAr ? 'اختيار نموذج Gemini' : 'Gemini Model Switcher'}
            </h3>
          </div>

          <div className="space-y-2">
            {modelOptions.map((opt) => {
              const isSelected = model === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setModel(opt.id)}
                  className={`w-full p-3 rounded-xl border text-start transition cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-neutral-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{opt.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{opt.label}</span>
                      {isSelected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
                          {isAr ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{opt.useCase}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Roles Selection (Requirement: specific roles) */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-lg flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isAr ? 'دور المساعد الإبداعي' : 'Creative Roles'}
              </h3>
            </div>
            <button
              onClick={clearChat}
              className="text-[11px] text-neutral-500 hover:text-red-400 flex items-center gap-1 transition cursor-pointer"
              title="Clear Conversation"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isAr ? 'مسح المحادثة' : 'Clear'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`w-full p-3 rounded-xl border text-start transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/15 border-purple-500 text-white ring-1 ring-purple-500'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {r.icon}
                    <span className="text-xs font-bold text-white">{r.title}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-2">{r.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Chat Header Bar */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-white">
                {roles.find((r) => r.id === role)?.title}
              </span>
              <span className="text-[10px] text-neutral-400 block font-mono">
                Model: {model}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                    isUser
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-neutral-950 border border-neutral-800/80 text-neutral-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Actions for Assistant Message */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {msg.modelUsed || model}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="px-2 py-1 rounded-md bg-neutral-900 text-neutral-400 hover:text-white transition flex items-center gap-1 text-[10px]"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{isAr ? 'نسخ' : 'Copy'}</span>
                        </button>

                        {/* Direct use as Image Prompt */}
                        <button
                          onClick={() => onUseForImage(msg.text)}
                          className="px-2 py-1 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 transition flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                          title="Use as Image Prompt"
                        >
                          <ImageIcon className="w-3 h-3 text-indigo-400" />
                          <span>{isAr ? 'كبرومبت صورة 🎨' : 'To Image 🎨'}</span>
                        </button>

                        {/* Direct use as Video Prompt */}
                        <button
                          onClick={() => onUseForVideo(msg.text)}
                          className="px-2 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                          title="Use as Video Prompt"
                        >
                          <Video className="w-3 h-3 text-purple-400" />
                          <span>{isAr ? 'كبرومبت فيديو 🎬' : 'To Video 🎬'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 items-center text-xs text-neutral-400">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <span>
                {isAr
                  ? `يقوم ${roles.find((r) => r.id === role)?.title} بالصياغة عبر ${model}...`
                  : `Thinking with ${model}...`}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Starters */}
        <div className="px-5 py-2 bg-neutral-950/40 border-t border-neutral-800/60 flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 text-[10px] text-neutral-500 font-semibold">
            {isAr ? 'اقتراحات سريعة:' : 'Quick Starters:'}
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[10px] border border-neutral-800 truncate max-w-[220px] transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isAr
                ? 'اسأل المخرج الفني عن أي فكرة، زاوية كاميرا، أو اطلب برومبت متكامل...'
                : 'Ask the director for visual advice, lighting formulas, or prompts...'
            }
            className="flex-1 px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-indigo-500 transition"
          />

          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition cursor-pointer"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isAr ? 'إرسال' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
