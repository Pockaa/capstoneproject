/**
 * OpenRouter API Service
 * 
 * Provides AI capabilities via OpenRouter (OpenAI-compatible API).
 * Supports multiple models including free options for development
 * and GPT-4o-mini for production.
 * 
 * Usage: Set EXPO_PUBLIC_OPENROUTER_API_KEY in your .env file.
 */

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Models available via OpenRouter
export const AI_MODELS = {
  // Free models (no credits needed)
  FREE_LLAMA_70B: 'meta-llama/llama-3.3-70b-instruct:free',
  FREE_GEMMA_27B: 'google/gemma-3-27b-it:free',
  FREE_HERMES_405B: 'nousresearch/hermes-3-llama-3.1-405b:free',
  FREE_QWEN_PLUS: 'qwen/qwen3.6-plus:free',
  FREE_GPT_OSS: 'openai/gpt-oss-120b:free',
  // Paid but very cheap (for defense demo)
  GPT4O_MINI: 'openai/gpt-4o-mini',
  GPT4O: 'openai/gpt-4o',
  CLAUDE_HAIKU: 'anthropic/claude-3.5-haiku',
} as const;

// Default: use FREE Gemma 3 27B (reliable, less congested)
// Switch to GPT4O_MINI for your capstone defense if you want premium quality
const DEFAULT_MODEL = AI_MODELS.FREE_GEMMA_27B;
const FALLBACK_MODELS = [
  AI_MODELS.FREE_LLAMA_70B,
  AI_MODELS.FREE_QWEN_PLUS,
  AI_MODELS.FREE_GPT_OSS,
  AI_MODELS.FREE_HERMES_405B,
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: ChatMessage[];
}

interface ChatCompletionResponse {
  success: boolean;
  content: string;
  model: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Simple in-memory cache to avoid duplicate API calls
const responseCache = new Map<string, { response: ChatCompletionResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(messages: ChatMessage[], model: string): string {
  // Create a deterministic key from messages
  const msgKey = messages.map(m => `${m.role}:${m.content}`).join('|');
  return `${model}:${msgKey}`;
}

/**
 * Get the API key from environment variables.
 */
function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
  return key && key.trim() !== '' ? key.trim() : null;
}

/**
 * Check if the AI service is configured and ready.
 */
export function isAIConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * Send a chat completion request to OpenRouter.
 */
export async function chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      content: '',
      model: 'none',
      error: 'OpenRouter API key not configured. Add EXPO_PUBLIC_OPENROUTER_API_KEY to your .env file.',
    };
  }

  const model = options.model || DEFAULT_MODEL;

  // Check cache first
  const cacheKey = getCacheKey(options.messages, model);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://sitetrack.app',
        'X-Title': 'SiteTrack AI',
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If rate limited (429) or model error, try next fallback model
      const fallbackIndex = FALLBACK_MODELS.indexOf(model as any);
      const nextFallback = fallbackIndex === -1 
        ? FALLBACK_MODELS[0] 
        : FALLBACK_MODELS[fallbackIndex + 1];
      
      if (nextFallback && model !== nextFallback) {
        console.warn(`Model ${model} returned ${response.status}, trying ${nextFallback}...`);
        // Small delay before retry to avoid hitting rate limits
        await new Promise(r => setTimeout(r, 1000));
        return chatCompletion({
          ...options,
          model: nextFallback,
        });
      }

      return {
        success: false,
        content: '',
        model,
        error: `API error ${response.status}: ${(errorData as any)?.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const result: ChatCompletionResponse = {
      success: true,
      content,
      model: data.model || model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      } : undefined,
    };

    // Cache the result
    responseCache.set(cacheKey, { response: result, timestamp: Date.now() });

    return result;
  } catch (err: any) {
    // If primary model fails with network error, try next fallback
    const fallbackIndex = FALLBACK_MODELS.indexOf(model as any);
    const nextFallback = fallbackIndex === -1 
      ? FALLBACK_MODELS[0] 
      : FALLBACK_MODELS[fallbackIndex + 1];
    
    if (nextFallback && model !== nextFallback) {
      console.warn(`Model ${model} network error, trying ${nextFallback}...`);
      return chatCompletion({
        ...options,
        model: nextFallback,
      });
    }

    return {
      success: false,
      content: '',
      model,
      error: `Network error: ${err?.message || 'Unable to reach OpenRouter API'}`,
    };
  }
}

/**
 * Clear the response cache (useful after changing API key).
 */
export function clearAICache(): void {
  responseCache.clear();
}

/**
 * Simple helper for one-shot prompts.
 */
export async function askAI(
  prompt: string,
  systemPrompt?: string,
  model?: string,
): Promise<ChatCompletionResponse> {
  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  return chatCompletion({ messages, model });
}
