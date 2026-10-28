import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  maskKey,
  getMaskedConfig,
  updateAIConfig,
  replaceAIKey,
  removeAIConfig,
  getModelList,
  testAIConnection,
  initAIConfig,
} from "../server/aiProviderService";

describe("AI Provider Configuration & Key Management", () => {
  const configPath = path.resolve(process.cwd(), "data/.ai_config.json");

  it("safely masks API keys for client rendering", () => {
    expect(maskKey("")).toBe("");
    expect(maskKey("short")).toBe("••••••••");
    expect(maskKey("AIzaSyDk7394testKey999")).toBe("AIza••••••••y999");
    expect(maskKey("sk-proj-abcdef1234567890xyz")).toBe("sk-p••••••••0xyz");
  });

  it("persists configuration to server disk and reloads on startup", () => {
    const updated = updateAIConfig({
      provider: "openai",
      baseURL: "https://api.deepseek.com/v1",
      model: "deepseek-chat",
      apiKey: "sk-deepseek-test-key-99999",
    });

    expect(updated.provider).toBe("openai");
    expect(updated.model).toBe("deepseek-chat");
    expect(updated.baseURL).toBe("https://api.deepseek.com/v1");
    expect(updated.isKeyConfigured).toBe(true);

    // Verify written to disk file
    expect(fs.existsSync(configPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(content.provider).toBe("openai");
    expect(content.apiKey).toBe("sk-deepseek-test-key-99999");

    // Simulate server restart
    initAIConfig();
    const loaded = getMaskedConfig();
    expect(loaded.provider).toBe("openai");
    expect(loaded.model).toBe("deepseek-chat");
    expect(loaded.isKeyConfigured).toBe(true);
  });

  it("replaces key securely without exposing old key contents", () => {
    const replaced = replaceAIKey("sk-new-replacement-key-88888");
    expect(replaced.isKeyConfigured).toBe(true);
    expect(replaced.maskedKey).toContain("••••");
    expect(replaced.maskedKey).not.toBe("sk-new-replacement-key-88888");

    const content = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    expect(content.apiKey).toBe("sk-new-replacement-key-88888");
  });

  it("rejects empty replacement keys", () => {
    expect(() => replaceAIKey("")).toThrow(/cannot be empty/i);
    expect(() => replaceAIKey("   ")).toThrow(/cannot be empty/i);
  });

  it("removes configuration and clears persistent credentials from disk", () => {
    const cleared = removeAIConfig();
    expect(cleared.isKeyConfigured).toBe(false);
    expect(cleared.maskedKey).toBe("");
  });

  it("fails test connection when API key is not configured", async () => {
    removeAIConfig();
    await expect(testAIConnection()).rejects.toThrow(/no api key configured/i);
  });

  it("provides available models for active provider", async () => {
    updateAIConfig({ provider: "gemini", model: "gemini-3.8-flash" });
    const models = await getModelList();
    expect(models.provider).toBe("gemini");
    expect(models.models).toContain("gemini-3.8-flash");
  });
});
