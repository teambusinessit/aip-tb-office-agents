import { saveConfig } from "@office-agents/sdk";
import { Check, Eye, EyeOff } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { useChat } from "./chat-context";

export interface TBEndpoint {
  name: string;
  url: string;
  model: string;
}

export function createTBSettingsPanel(endpoints: TBEndpoint[]): ComponentType {
  return function TBSettingsPanel() {
    const { state, setProviderConfig } = useChat();
    const current = state.providerConfig;

    const selectedIndex = endpoints.findIndex((e) => e.url === current?.customBaseUrl);

    const [endpointIndex, setEndpointIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);
    const [apiKey, setApiKey] = useState(current?.apiKey ?? "");
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);

    const selectedEndpoint = endpoints[endpointIndex];

    const buildConfig = (idx: number, key: string) => ({
      provider: "custom",
      apiKey: key,
      model: endpoints[idx]?.model ?? "",
      useProxy: false,
      proxyUrl: "",
      thinking: "none" as const,
      followMode: current?.followMode ?? true,
      expandToolCalls: current?.expandToolCalls ?? false,
      apiType: "openai-completions",
      customBaseUrl: endpoints[idx]?.url ?? "",
      authMethod: "apikey" as const,
    });

    const handleEndpointChange = (idx: number) => {
      setEndpointIndex(idx);
      const config = buildConfig(idx, apiKey);
      saveConfig(config);
      setProviderConfig(config);
    };

    const handleSave = () => {
      const config = buildConfig(endpointIndex, apiKey);
      saveConfig(config);
      setProviderConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };

    const isConfigured = !!(selectedEndpoint?.url && selectedEndpoint?.model && apiKey);
    const missingEnv = endpoints.some((e) => !e.url || !e.model);

    return (
      <div
        className="p-4 overflow-y-auto flex flex-col gap-6"
        style={{ fontFamily: "var(--chat-font-mono)" }}
      >
        <div>
          <h2 className="text-xs uppercase tracking-wider text-(--chat-text-primary) font-semibold">
            TB Settings
          </h2>
          <p className="text-[11px] text-(--chat-text-muted) mt-1">
            Wähle einen Endpunkt und gib deinen API Key ein.
          </p>
        </div>

        {missingEnv && (
          <div className="px-3 py-2 text-[11px] border border-yellow-500/40 rounded bg-yellow-500/10 text-yellow-500">
            Hinweis: Einige Endpunkte sind nicht konfiguriert (VITE_TB_*-Variablen fehlen).
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-(--chat-text-muted)">
            Endpunkt
          </span>
          <div className="flex gap-2">
            {endpoints.map((endpoint, idx) => {
              const disabled = !endpoint.url || !endpoint.model;
              const active = endpointIndex === idx;
              return (
                <button
                  key={endpoint.name}
                  type="button"
                  onClick={() => !disabled && handleEndpointChange(idx)}
                  disabled={disabled}
                  className={`
                    flex-1 px-3 py-2.5 text-xs border rounded transition-colors
                    ${active
                      ? "border-(--chat-accent) text-(--chat-accent) bg-(--chat-bg-secondary)"
                      : "border-(--chat-border) text-(--chat-text-muted) hover:text-(--chat-text-primary) hover:border-(--chat-text-secondary)"
                    }
                    ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {endpoint.name}
                </button>
              );
            })}
          </div>
          {selectedEndpoint?.model && (
            <p className="text-[10px] text-(--chat-text-muted)">
              Modell:{" "}
              <span className="text-(--chat-text-secondary)">{selectedEndpoint.model}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-wider text-(--chat-text-muted)">
            API Key
          </label>
          <div className="flex items-center gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 text-xs bg-(--chat-bg-secondary) border border-(--chat-border) rounded text-(--chat-text-primary) focus:outline-none focus:border-(--chat-accent)"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="p-2 text-(--chat-text-muted) hover:text-(--chat-text-primary) transition-colors"
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!isConfigured}
          className={`
            flex items-center justify-center gap-2 px-4 py-2 text-xs rounded transition-colors
            ${isConfigured
              ? "bg-(--chat-accent) text-white hover:opacity-90 cursor-pointer"
              : "bg-(--chat-bg-secondary) text-(--chat-text-muted) cursor-not-allowed"
            }
          `}
        >
          {saved && <Check size={12} />}
          {saved ? "Gespeichert!" : "Speichern"}
        </button>

        <div className="flex items-center gap-1.5 text-[10px] text-(--chat-text-muted)">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isConfigured ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          {isConfigured ? `Verbunden mit ${selectedEndpoint?.name}` : "API Key fehlt"}
        </div>
      </div>
    );
  };
}
