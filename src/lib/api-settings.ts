import { ApiSettings } from "@/components/settings/api-settings";

const API_SETTINGS_KEY = "chatdocs_api_settings";

export const DEFAULT_API_SETTINGS: ApiSettings = {
  provider: "local",
  apiKey: "",
  model: "Llama-3-8B-Instruct-q4f32_1-MLC",
  temperature: 0.7,
};

export function loadApiSettings(): ApiSettings {
  if (typeof window === "undefined") {
    return DEFAULT_API_SETTINGS;
  }

  try {
    const settingsJson = localStorage.getItem(API_SETTINGS_KEY);
    if (!settingsJson) {
      return DEFAULT_API_SETTINGS;
    }

    const settings = JSON.parse(settingsJson) as ApiSettings;
    return {
      ...DEFAULT_API_SETTINGS,
      ...settings,
    };
  } catch (error) {
    console.error("API settings loading error:", error);
    return DEFAULT_API_SETTINGS;
  }
}

export function saveApiSettings(settings: ApiSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("API settings saving error:", error);
  }
}

export async function testApiSettings(settings: ApiSettings): Promise<boolean> {
  if (settings.provider === "local") {
    return true;
  }

  if (settings.provider === "openai") {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("OpenAI API test error:", error);
      return false;
    }
  }

  return false;
}
