import { GoogleGenAI } from "@google/genai";

export type AIProviderType = "gemini" | "openai";

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface MaskedAIConfig {
  provider: AIProviderType;
  model: string;
  baseURL: string;
  isKeyConfigured: boolean;
  maskedKey: string;
  isEnvDefault: boolean;
  supportedProviders: Array<{ id: AIProviderType; name: string; defaultModel: string }>;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  provider: AIProviderType;
  model: string;
  message: string;
  sampleOutput?: string;
}

export interface StructuredGenerationOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
}

// In-memory server-side state for active AI configuration
const activeConfig: AIProviderConfig = {
  provider: process.env.OPENAI_API_KEY ? "openai" : "gemini",
  apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "",
  baseURL: "https://api.openai.com/v1",
  model: process.env.OPENAI_API_KEY ? "gpt-4o-mini" : "gemini-3.8-flash",
};

// Mask API key for secure UI presentation (never leak full key to browser)
export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}••••••••${end}`;
}

export function getMaskedConfig(): MaskedAIConfig {
  const isEnv =
    (activeConfig.provider === "gemini" && activeConfig.apiKey === (process.env.GEMINI_API_KEY || "")) ||
    (activeConfig.provider === "openai" && activeConfig.apiKey === (process.env.OPENAI_API_KEY || ""));

  return {
    provider: activeConfig.provider,
    model: activeConfig.model,
    baseURL: activeConfig.baseURL,
    isKeyConfigured: !!activeConfig.apiKey,
    maskedKey: maskKey(activeConfig.apiKey),
    isEnvDefault: isEnv && !!activeConfig.apiKey,
    supportedProviders: [
      { id: "gemini", name: "Google Gemini (Official GenAI SDK)", defaultModel: "gemini-3.8-flash" },
      { id: "openai", name: "OpenAI / Compatible Endpoint", defaultModel: "gpt-4o-mini" },
    ],
  };
}

export function updateAIConfig(updates: Partial<AIProviderConfig>): MaskedAIConfig {
  if (updates.provider) {
    activeConfig.provider = updates.provider;
    if (!updates.model) {
      activeConfig.model = updates.provider === "gemini" ? "gemini-3.8-flash" : "gpt-4o-mini";
    }
  }
  if (typeof updates.apiKey === "string" && updates.apiKey.trim().length > 0) {
    activeConfig.apiKey = updates.apiKey.trim();
  }
  if (updates.baseURL) {
    activeConfig.baseURL = updates.baseURL.trim();
  }
  if (updates.model) {
    activeConfig.model = updates.model.trim();
  }

  return getMaskedConfig();
}

/**
 * Returns available model options based on provider
 */
export async function getModelList(): Promise<{ models: string[]; provider: AIProviderType }> {
  if (activeConfig.provider === "gemini") {
    // Official recommended Google GenAI models
    return {
      provider: "gemini",
      models: [
        "gemini-3.8-flash",
        "gemini-4-argon",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
      ],
    };
  }

  // OpenAI or OpenAI-compatible endpoint
  if (activeConfig.apiKey) {
    try {
      const url = `${activeConfig.baseURL.replace(/\/+$/, "")}/models`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${activeConfig.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = (await response.json()) as { data?: Array<{ id: string }> };
        if (Array.isArray(data.data) && data.data.length > 0) {
          const ids = data.data
            .map((m) => m.id)
            .filter((id) => id.includes("gpt") || id.includes("chat") || id.includes("llama") || id.includes("deepseek") || id.includes("claude"))
            .slice(0, 20);
          if (ids.length > 0) {
            return { provider: "openai", models: ids };
          }
        }
      }
    } catch {
      // Fallback to standard OpenAI model catalog
    }
  }

  return {
    provider: "openai",
    models: [
      "gpt-4o-mini",
      "gpt-4o",
      "o3-mini",
      "gpt-4-turbo",
      "gpt-3.5-turbo",
    ],
  };
}

/**
 * Executes a real connection test to verify provider and key validity
 */
export async function testAIConnection(): Promise<TestConnectionResult> {
  if (!activeConfig.apiKey) {
    throw new Error(
      `No API key configured for ${activeConfig.provider.toUpperCase()}. Please configure an API key in AI Settings.`
    );
  }

  const startTime = Date.now();
  const testPrompt = "State 'JSS Placement Intelligence System Operational' in exactly one short line.";

  if (activeConfig.provider === "gemini") {
    try {
      const ai = new GoogleGenAI({ apiKey: activeConfig.apiKey });
      const response = await ai.models.generateContent({
        model: activeConfig.model,
        contents: testPrompt,
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || "Operational";

      return {
        success: true,
        latencyMs,
        provider: "gemini",
        model: activeConfig.model,
        message: "Successfully verified Google Gemini connection",
        sampleOutput: text.trim(),
      };
    } catch (err: any) {
      throw new Error(`Gemini connection failed: ${err.message || String(err)}`);
    }
  } else {
    // OpenAI Compatible
    try {
      const url = `${activeConfig.baseURL.replace(/\/+$/, "")}/chat/completions`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: activeConfig.model,
          messages: [
            { role: "system", content: "You are a health check system. Reply briefly." },
            { role: "user", content: testPrompt },
          ],
          max_tokens: 30,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI HTTP ${response.status}: ${errorBody.slice(0, 300)}`);
      }

      const data = (await response.json()) as any;
      const sampleOutput = data.choices?.[0]?.message?.content?.trim() || "Operational";

      return {
        success: true,
        latencyMs,
        provider: "openai",
        model: activeConfig.model,
        message: "Successfully verified OpenAI-compatible endpoint",
        sampleOutput,
      };
    } catch (err: any) {
      throw new Error(`OpenAI endpoint connection failed: ${err.message || String(err)}`);
    }
  }
}

/**
 * Universal text generation using active provider with JSON extraction support
 */
export async function executeAIGeneration(options: StructuredGenerationOptions): Promise<string> {
  if (!activeConfig.apiKey) {
    throw new Error(
      "No active LLM API key configured. Please visit AI Settings to enter a valid API key."
    );
  }

  if (activeConfig.provider === "gemini") {
    const ai = new GoogleGenAI({ apiKey: activeConfig.apiKey });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini request timed out after 10000ms")), 10000)
    );

    const callPromise = ai.models.generateContent({
      model: activeConfig.model,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.3,
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return text;
  } else {
    // OpenAI Compatible
    const url = `${activeConfig.baseURL.replace(/\/+$/, "")}/chat/completions`;
    const messages = [];
    if (options.systemInstruction) {
      messages.push({ role: "system", content: options.systemInstruction });
    }
    messages.push({ role: "user", content: options.prompt });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: activeConfig.model,
        messages,
        temperature: options.temperature ?? 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Provider HTTP ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned empty content.");
    }
    return content;
  }
}
