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
  Trash2,
  Lock,
  XCircle,
  HelpCircle,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAIConfig,
  saveAIConfig,
  replaceAIKey,
  removeAIConfig,
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
  const [replacing, setReplacing] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);

  // Form states
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "openai">("gemini");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [baseURLInput, setBaseURLInput] = useState<string>("https://api.openai.com/v1");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.8-flash");
  const [customModelInput, setCustomModelInput] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);

  // Replace key modal state
  const [showReplaceModal, setShowReplaceModal] = useState<boolean>(false);
  const [newKeyInput, setNewKeyInput] = useState<string>("");

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
      await fetchModelsForProvider(data.provider);
    } catch (err: any) {
      toast.error(err.message || "Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchModelsForProvider = async (provider: "gemini" | "openai") => {
    try {
      setLoadingModels(true);
      const res = await getAvailableModels();
      setAvailableModels(res.models || []);
    } catch {
      // Fallback defaults
      setAvailableModels(
        provider === "gemini"
          ? ["gemini-3.8-flash", "gemini-4-argon", "gemini-2.5-flash", "gemini-2.5-pro"]
          : ["gpt-4o-mini", "gpt-4o", "o3-mini", "deepseek-chat", "llama-3.3-70b-versatile"]
      );
    } finally {
      setLoadingModels(false);
    }
  };

  const handleProviderChange = (prov: "gemini" | "openai") => {
    setSelectedProvider(prov);
    if (prov === "gemini") {
      setSelectedModel("gemini-3.8-flash");
    } else {
      setSelectedModel("gpt-4o-mini");
      if (!baseURLInput) setBaseURLInput("https://api.openai.com/v1");
    }
    fetchModelsForProvider(prov);
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
      toast.success("AI Configuration saved and persisted to server!");
      // Automatically test connection after saving
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
      const msg = err.message || "Connection failed";
      setTestResult({
        success: false,
        latencyMs: 0,
        provider: selectedProvider,
        model: selectedModel,
        message: msg,
        error: msg,
      });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const handleReplaceKey = async () => {
    if (!newKeyInput.trim()) {
      toast.error("Please enter a non-empty API key");
      return;
    }
    try {
      setReplacing(true);
      const res = await replaceAIKey(newKeyInput.trim());
      setConfig(res.config);
      setNewKeyInput("");
      setShowReplaceModal(false);
      toast.success("API key replaced and persisted successfully!");
      await handleTest();
    } catch (err: any) {
      toast.error(err.message || "Failed to replace API key");
    } finally {
      setReplacing(false);
    }
  };

  const handleRemoveConfig = async () => {
    if (!window.confirm("Are you sure you want to clear your saved LLM configuration and credentials?")) {
      return;
    }
    try {
      setRemoving(true);
      const res = await removeAIConfig();
      setConfig(res.config);
      setTestResult(null);
      toast.info("AI credentials and persistent storage cleared.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove AI configuration");
    } finally {
      setRemoving(false);
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

        <div className="flex items-center gap-2">
          {testResult && (
            <button
              onClick={() => setTestResult(null)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg bg-white transition-colors"
            >
              Clear Test Status
            </button>
          )}

          <button
            onClick={handleTest}
            disabled={testing || !config?.isKeyConfigured}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Test Connection Now
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>
            <strong className="text-slate-800">Zero Client-Side Secret Exposure:</strong> API keys are safely held on the server and persisted in server-side storage (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">data/.ai_config.json</code>). Keys are never delivered to frontend bundles or client network traces.
          </div>
          <div className="text-[11px] text-slate-500">
            Persistence Status:{" "}
            <span className="font-semibold text-slate-700">
              {config?.storageType === "persistent_file"
                ? "Saved to Persistent Server File (survives restarts)"
                : config?.storageType === "environment_variable"
                ? "Environment Variable (Default Deployment Key)"
                : "Unconfigured (Enter Key Below)"}
            </span>
          </div>
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
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Key Status
            </span>
            {config?.isKeyConfigured && (
              <button
                onClick={() => setShowReplaceModal(true)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
              >
                Replace Key
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-semibold font-mono text-slate-700">
              {config?.isKeyConfigured ? config.maskedKey : "Not Configured"}
            </span>
            {config?.isKeyConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <AlertTriangle className="w-3.5 h-3.5" />
                Missing Key
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Model
          </span>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-slate-800 truncate max-w-[180px]">
              {config?.model || "None"}
            </span>
            {config?.isKeyConfigured && (
              <button
                onClick={handleRemoveConfig}
                disabled={removing}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                title="Remove saved configuration"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Test Connection Result Card */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border transition-all ${
            testResult.success
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
              : "bg-red-50/70 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold">
                  {testResult.success ? "Connection Verified & Live" : "Connection Test Failed"}
                </h4>
                <p className="text-xs mt-0.5 opacity-90">{testResult.message}</p>
                {testResult.sampleOutput && (
                  <div className="mt-2 p-2 rounded bg-white/80 border border-emerald-200 text-[11px] font-mono text-slate-700">
                    Sample Response: "{testResult.sampleOutput}"
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono font-bold">
                {testResult.success ? `${testResult.latencyMs} ms` : "Error"}
              </span>
              <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-bold">
                {testResult.provider} ({testResult.model})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">LLM Provider Configuration</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select your preferred engine and supply an API key. You can also connect OpenAI-compatible gateways like Groq, DeepSeek, or local Ollama.
          </p>
        </div>

        {/* Provider Switcher */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Select Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleProviderChange("gemini")}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedProvider === "gemini"
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">Google Gemini</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Official @google/genai SDK. Recommended for high accuracy and large token context.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleProviderChange("openai")}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                selectedProvider === "openai"
                  ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <Server className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">OpenAI / Compatible API</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Standard chat-completions endpoint. Compatible with OpenAI, Groq, DeepSeek, and Ollama.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* OpenAI Endpoint Base URL (Only if OpenAI selected) */}
        {selectedProvider === "openai" && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>API Endpoint Base URL</span>
              <span className="text-[10px] font-normal text-slate-400">(without /chat/completions)</span>
            </label>
            <input
              type="text"
              value={baseURLInput}
              onChange={(e) => setBaseURLInput(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Examples: <code className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">https://api.groq.com/openai/v1</code>,{" "}
              <code className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">https://api.deepseek.com/v1</code>,{" "}
              <code className="bg-slate-100 px-1 py-0.2 rounded text-slate-600">http://localhost:11434/v1</code>
            </p>
          </div>
        )}

        {/* API Key Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedProvider === "gemini" ? "Google Gemini API Key" : "Provider API Key"}</span>
            </label>
            {config?.isKeyConfigured && (
              <span className="text-[11px] text-slate-500">
                Current: <span className="font-mono">{config.maskedKey}</span>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={config?.isKeyConfigured ? "Leave blank to keep current key, or type new key" : "Paste your API key here..."}
              className="w-full pl-3.5 pr-10 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Your key will be securely saved in the persistent server configuration file and will survive restarts.
          </p>
        </div>

        {/* Model Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Model Identifier</label>
              <button
                type="button"
                onClick={() => fetchModelsForProvider(selectedProvider)}
                disabled={loadingModels}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${loadingModels ? "animate-spin" : ""}`} />
                Refresh Models
              </button>
            </div>

            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setCustomModelInput("");
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Or Manual Custom Model ID</label>
            <input
              type="text"
              value={customModelInput}
              onChange={(e) => setCustomModelInput(e.target.value)}
              placeholder="e.g. deepseek-reasoner, llama-3.3-70b"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Settings automatically persist to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">data/.ai_config.json</code></span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Save & Test Configuration
          </button>
        </div>
      </form>

      {/* Replace Key Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Replace LLM API Key</h3>
              </div>
              <button
                onClick={() => setShowReplaceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your replacement API key. The previous key will be immediately overwritten in persistent storage without exposing its contents.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">New API Key</label>
              <input
                type="password"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                placeholder="Paste new API key here..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReplaceModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReplaceKey}
                disabled={replacing || !newKeyInput.trim()}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {replacing ? "Replacing..." : "Confirm & Replace Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
