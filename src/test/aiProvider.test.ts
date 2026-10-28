import { describe, it, expect } from "vitest";
import {
  maskKey,
  getMaskedConfig,
  updateAIConfig,
  getModelList,
} from "../server/aiProviderService";

describe("AI Provider Service", () => {
  it("correctly masks API keys without exposing secrets", () => {
    expect(maskKey("")).toBe("");
    expect(maskKey("123456")).toBe("••••••••");
    expect(maskKey("AIzaSyDk7394testKey999")).toBe("AIza••••••••y999");
    expect(maskKey("sk-proj-1234567890abcdef")).toBe("sk-p••••••••cdef");
  });

  it("returns masked configuration object", () => {
    const config = getMaskedConfig();
    expect(config).toBeDefined();
    expect(config.supportedProviders.length).toBe(2);
    expect(["gemini", "openai"]).toContain(config.provider);
  });

  it("updates AI configuration safely", () => {
    const updated = updateAIConfig({
      provider: "openai",
      model: "gpt-4o-mini",
      baseURL: "https://api.openai.com/v1",
      apiKey: "sk-test-custom-key-12345678",
    });

    expect(updated.provider).toBe("openai");
    expect(updated.model).toBe("gpt-4o-mini");
    expect(updated.isKeyConfigured).toBe(true);
    expect(updated.maskedKey).toContain("••••");
  });

  it("provides available models for active provider", async () => {
    const models = await getModelList();
    expect(models.models.length).toBeGreaterThan(0);
    expect(models.provider).toBeDefined();
  });
});
