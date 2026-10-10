export type AppMode = 'image' | 'video' | 'chat' | 'fast' | 'gallery' | 'mobile';

export type ImageSize = '1K' | '2K' | '4K';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';

export type VideoResolution = '720p' | '1080p';

export type VideoAspectRatio = '16:9' | '9:16';

export type ChatRole = 'director' | 'prompt_engineer' | 'storyboard_artist' | 'stylist';

export type ChatModel =
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.5-flash'
  | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  modelUsed?: string;
}

export interface GeneratedItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  /** Videos only: the raw data, persisted in IndexedDB (blob: URLs do not survive reloads). */
  blob?: Blob;
  prompt: string;
  aspectRatio: string;
  sizeOrResolution: string;
  model: string;
  createdAt: number;
  notes?: string;
}

export interface FastEnhanceResult {
  enhancedPrompt: string;
  enhancedPromptArabic?: string;
  camera?: string;
  lighting?: string;
  negativePrompt?: string;
}
