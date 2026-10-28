import fs from "fs";
import path from "path";
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
  storageType: "persistent_file" | "environment_variable" | "unconfigured";
  supportedProviders: Array<{ id: AIProviderType; name: string; defaultModel: string; defaultEndpoint?: string }>;
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

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, ".ai_config.json");

// Ensure data directory exists
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn("[AI Provider] Could not ensure data directory:", err.message);
  }
}

// In-memory active configuration
let activeConfig: AIProviderConfig = {
  provider: "gemini",
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gemini-3.8-flash",
};

let hasLoadedFromDisk = false;

// Load persisted configuration from server disk or environment variables
export function initAIConfig(): void {
  ensureDataDir();

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      const saved = JSON.parse(raw);
      activeConfig = {
        provider: saved.provider || "gemini",
        apiKey: saved.apiKey || "",
        baseURL: saved.baseURL || "https://api.openai.com/v1",
        model: saved.model || (saved.provider === "openai" ? "gpt-4o-mini" : "gemini-3.8-flash"),
      };
      hasLoadedFromDisk = true;
      console.log(`[AI Provider] Loaded persisted AI configuration for '${activeConfig.provider}' from disk.`);
      return;
    } catch (err: any) {
      console.warn("[AI Provider] Failed to parse saved .ai_config.json, falling back to environment:", err.message);
    }
  }

  // Fallback to environment variables
  if (process.env.GEMINI_API_KEY) {
    activeConfig.provider = "gemini";
    activeConfig.apiKey = process.env.GEMINI_API_KEY.trim();
    activeConfig.model = process.env.LLM_MODEL || "gemini-3.8-flash";
  } else if (process.env.OPENAI_API_KEY) {
    activeConfig.provider = "openai";
    activeConfig.apiKey = process.env.OPENAI_API_KEY.trim();
    activeConfig.model = process.env.LLM_MODEL || "gpt-4o-mini";
  }
}

// Auto-initialize on module import
initAIConfig();

function persistConfigToDisk(): void {
  ensureDataDir();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(activeConfig, null, 2), {
      encoding: "utf-8",
      mode: 0o600, // secure read/write owner only
    });
    hasLoadedFromDisk = true;
  } catch (err: any) {
    console.error("[AI Provider] Failed to write config to disk:", err.message);
  }
}

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

  let storageType: MaskedAIConfig["storageType"] = "unconfigured";
  if (activeConfig.apiKey) {
    storageType = hasLoadedFromDisk ? "persistent_file" : isEnv ? "environment_variable" : "persistent_file";
  }

  return {
    provider: activeConfig.provider,
    model: activeConfig.model,
    baseURL: activeConfig.baseURL,
    isKeyConfigured: !!activeConfig.apiKey,
    maskedKey: maskKey(activeConfig.apiKey),
    isEnvDefault: isEnv && !!activeConfig.apiKey,
    storageType,
    supportedProviders: [
      {
        id: "gemini",
        name: "Google Gemini (Official GenAI SDK)",
        defaultModel: "gemini-3.8-flash",
      },
      {
        id: "openai",
        name: "OpenAI / Compatible Endpoint (Groq, DeepSeek, Ollama, vLLM)",
        defaultModel: "gpt-4o-mini",
        defaultEndpoint: "https://api.openai.com/v1",
      },
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
  // Only update apiKey if explicitly provided with non-empty content
  if (typeof updates.apiKey === "string" && updates.apiKey.trim().length > 0) {
    activeConfig.apiKey = updates.apiKey.trim();
  }
  if (updates.baseURL) {
    activeConfig.baseURL = updates.baseURL.trim();
  }
  if (updates.model) {
    activeConfig.model = updates.model.trim();
  }

  persistConfigToDisk();
  return getMaskedConfig();
}

/**
 * Replaces the active API key securely
 */
export function replaceAIKey(newKey: string): MaskedAIConfig {
  if (!newKey || typeof newKey !== "string" || newKey.trim().length === 0) {
    throw new Error("New API key cannot be empty.");
  }
  activeConfig.apiKey = newKey.trim();
  persistConfigToDisk();
  return getMaskedConfig();
}

/**
 * Removes saved credentials and returns unconfigured state
 */
export function removeAIConfig(): MaskedAIConfig {
  activeConfig.apiKey = "";
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      fs.unlinkSync(CONFIG_FILE);
    } catch {
      // Ignored
    }
  }
  hasLoadedFromDisk = false;
  return getMaskedConfig();
}

/**
 * Returns available model options based on provider and discovery
 */
export async function getModelList(): Promise<{ models: string[]; provider: AIProviderType }> {
  if (activeConfig.provider === "gemini") {
    const defaultGeminiModels = [
      "gemini-3.8-flash",
      "gemini-4-argon",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ];

    if (activeConfig.apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeConfig.apiKey });
        // Attempt dynamic discovery if supported
        const pager = await ai.models.list();
        const discovered: string[] = [];
        for await (const m of pager) {
          if (m.name && (m.name.includes("gemini") || m.name.includes("flash") || m.name.includes("pro"))) {
            discovered.push(m.name.replace(/^models\//, ""));
          }
        }
        if (discovered.length > 0) {
          return { provider: "gemini", models: Array.from(new Set([...discovered, ...defaultGeminiModels])) };
        }
      } catch {
        // Fall back to catalog
      }
    }

    return { provider: "gemini", models: defaultGeminiModels };
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
            .filter((id) =>
              id.includes("gpt") ||
              id.includes("chat") ||
              id.includes("llama") ||
              id.includes("deepseek") ||
              id.includes("claude") ||
              id.includes("mistral") ||
              id.includes("qwen")
            )
            .slice(0, 30);
          if (ids.length > 0) {
            return { provider: "openai", models: ids };
          }
        }
      }
    } catch {
      // Fallback
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
      "deepseek-chat",
      "llama-3.3-70b-versatile",
    ],
  };
}

/**
 * Executes a real connection test to verify provider and key validity
 */
export async function testAIConnection(): Promise<TestConnectionResult> {
  if (!activeConfig.apiKey) {
    throw new Error(
      `No API key configured for ${activeConfig.provider.toUpperCase()}. Please enter a valid API key in AI Settings.`
    );
  }

  const startTime = Date.now();
  const testPrompt = "Return exactly: 'RADIX AI Gateway Operational'";

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
        message: `Successfully verified Google Gemini connection with model '${activeConfig.model}'.`,
        sampleOutput: text.trim(),
      };
    } catch (err: any) {
      const msg = err.message || String(err);
      if (msg.includes("API_KEY_INVALID") || msg.includes("401") || msg.includes("Forbidden")) {
        throw new Error(`Google Gemini rejected API Key: Invalid or unauthorized key. (${msg})`);
      }
      if (msg.includes("404") || msg.includes("not found")) {
        throw new Error(`Model '${activeConfig.model}' was not found on Google Gemini. Please check model name.`);
      }
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error(`Gemini rate limit or quota exceeded. Please check your project billing or rate limits.`);
      }
      throw new Error(`Gemini connection failed: ${msg}`);
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
            { role: "system", content: "You are a health check probe. Reply briefly." },
            { role: "user", content: testPrompt },
          ],
          max_tokens: 30,
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        if (response.status === 401) {
          throw new Error(`OpenAI endpoint rejected API Key (HTTP 401 Unauthorized): ${errorBody.slice(0, 150)}`);
        }
        if (response.status === 404) {
          throw new Error(`Model '${activeConfig.model}' not found on endpoint '${activeConfig.baseURL}'.`);
        }
        if (response.status === 429) {
          throw new Error(`OpenAI endpoint rate limit / quota exceeded (HTTP 429).`);
        }
        throw new Error(`OpenAI HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
      }

      const data = (await response.json()) as any;
      const sampleOutput = data.choices?.[0]?.message?.content?.trim() || "Operational";

      return {
        success: true,
        latencyMs,
        provider: "openai",
        model: activeConfig.model,
        message: `Successfully verified OpenAI-compatible endpoint at '${activeConfig.baseURL}'.`,
        sampleOutput,
      };
    } catch (err: any) {
      throw new Error(`OpenAI endpoint connection failed: ${err.message || String(err)}`);
    }
  }
}

/**
 * Universal text generation using active configured provider
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
      setTimeout(() => reject(new Error("Gemini request timed out after 20000ms")), 20000)
    );

    const callPromise = ai.models.generateContent({
      model: activeConfig.model,
      contents: options.prompt,
      config: {
        systemInstruction: options.systemInstruction,
        temperature: options.temperature ?? 0.2,
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    const text = response.text;
    if (!text || text.trim().length === 0) {
      throw new Error("Gemini model returned an empty response.");
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
        temperature: options.temperature ?? 0.2,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Provider HTTP ${response.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      throw new Error("AI provider returned empty content.");
    }
    return content;
  }
}
