import React, { useState, useEffect } from "react";
import {
  Cpu,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Server,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAIConfig,
  saveAIConfig,
  testAIConnection,
  getAvailableModels,
  MaskedAIConfig,
  TestConnectionResponse,
} from "../lib/placementAiApi";

export const AiSettingsPage: React.FC = () => {
  const [config, setConfig] = useState<MaskedAIConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "openai">("gemini");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [baseURLInput, setBaseURLInput] = useState<string>("https://api.openai.com/v1");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.8-flash");
  const [customModelInput, setCustomModelInput] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  // Test connection feedback
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getAIConfig();
      setConfig(data);
      setSelectedProvider(data.provider);
      setSelectedModel(data.model);
      setBaseURLInput(data.baseURL || "https://api.openai.com/v1");
      await fetchModels();
    } catch (err: any) {
      toast.error(err.message || "Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      setLoadingModels(true);
      const res = await getAvailableModels();
      setAvailableModels(res.models || []);
    } catch {
      // Fallback
      setAvailableModels(
        selectedProvider === "gemini"
          ? ["gemini-3.8-flash", "gemini-4-argon", "gemini-2.5-flash"]
          : ["gpt-4o-mini", "gpt-4o", "o3-mini"]
      );
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const finalModel = customModelInput.trim() || selectedModel;
      const res = await saveAIConfig({
        provider: selectedProvider,
        apiKey: apiKeyInput.trim() || undefined,
        baseURL: selectedProvider === "openai" ? baseURLInput.trim() : undefined,
        model: finalModel,
      });

      setConfig(res.config);
      setApiKeyInput("");
      setCustomModelInput("");
      toast.success("AI Configuration saved successfully!");
      // Auto test
      await handleTest();
    } catch (err: any) {
      toast.error(err.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await testAIConnection();
      setTestResult(result);
      toast.success(`Connected! Latency: ${result.latencyMs}ms`);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        provider: selectedProvider,
        model: selectedModel,
        message: err.message || "Connection failed",
      });
      toast.error(err.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          Loading AI engine settings...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Configuration & LLM Provider Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure server-side LLM credentials, dynamic model selection, and test provider latency.
          </p>
        </div>

        <button
          onClick={handleTest}
          disabled={testing || (!config?.isKeyConfigured && !apiKeyInput)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Test Connection Now
        </button>
      </div>

      {/* Security Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Zero Client-Side Secret Exposure:</strong> API keys are safely held in server-side memory and never delivered to frontend bundles or client network traces. All AI requests execute via server proxy routes.
        </div>
      </div>

      {/* Active Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Provider
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-base font-bold text-slate-800">
              {config?.provider === "gemini" ? "Google Gemini" : "OpenAI Compatible"}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">
              {config?.provider}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Key Status
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-semibold font-mono text-slate-700">
              {config?.isKeyConfigured ? config.maskedKey : "Not Configured"}
            </span>
            {config?.isKeyConfigured ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3.5 h-3.5" /> Unset
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Model
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-slate-800 truncate max-w-[170px]">
              {config?.model}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Production
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
        {/* Provider Choice */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Select AI Provider
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedProvider("gemini");
                setSelectedModel("gemini-3.8-flash");
              }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                selectedProvider === "gemini"
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Google Gemini (GenAI SDK)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Google GenAI SDK. Fast inference using gemini-3.8-flash or gemini-4-argon.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedProvider("openai");
                setSelectedModel("gpt-4o-mini");
              }}
              className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                selectedProvider === "openai"
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">OpenAI / Compatible Endpoint</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standard chat completions API. Compatible with OpenAI, OpenRouter, Ollama, and vLLM.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            2. {selectedProvider === "gemini" ? "Google Gemini API Key" : "OpenAI / Provider API Key"}
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Leave blank if you wish to keep the existing saved key (
            <span className="font-mono text-slate-700">{config?.maskedKey || "None"}</span>).
          </p>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste new API key to update..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono text-slate-800 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* OpenAI Endpoint Base URL (if OpenAI selected) */}
        {selectedProvider === "openai" && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Custom Endpoint Base URL (Optional)
            </label>
            <input
              type="text"
              value={baseURLInput}
              onChange={(e) => setBaseURLInput(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-mono text-slate-800"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              For local Ollama or vLLM proxy, e.g. <span className="font-mono">http://localhost:11434/v1</span>
            </p>
          </div>
        )}

        {/* Model Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Target Model Selection
            </label>
            <button
              type="button"
              onClick={fetchModels}
              disabled={loadingModels}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`} />
              Refresh Catalog
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Select Standard Model:
              </span>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setCustomModelInput("");
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Or Specify Custom Model ID:
              </span>
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="e.g. gpt-4o-2024-08-06 or llama-3.3-70b"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Save & Apply Configuration
          </button>
        </div>
      </form>

      {/* Connection Test Diagnostics Result Banner */}
      {testResult && (
        <div
          className={`p-5 rounded-2xl border ${
            testResult.success
              ? "bg-emerald-50/50 border-emerald-200"
              : "bg-red-50/50 border-red-200"
          } space-y-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <h3 className="text-sm font-bold text-slate-900">
                {testResult.success ? "Live Connection Verified" : "Connection Test Failed"}
              </h3>
            </div>
            {testResult.success && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {testResult.latencyMs} ms
              </span>
            )}
          </div>

          <p className="text-xs text-slate-700">{testResult.message}</p>

          {testResult.sampleOutput && (
            <div className="p-3 bg-white/80 rounded-lg border border-emerald-200 text-xs font-mono text-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Sample Model Echo:
              </span>
              "{testResult.sampleOutput}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
