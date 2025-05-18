"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { KeyIcon, ServerIcon, CloudIcon, LaptopIcon } from "lucide-react";

// Supported models
const OPENAI_MODELS = [
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
];

// Web-LLM models 
const LOCAL_MODELS = [
  { id: "Llama-3-8B-Instruct-q4f32_1-MLC", name: "Llama 3 8B (Local)" },
];

// API settings type
export interface ApiSettings {
  provider: "openai" | "local";
  apiKey: string;
  model: string;
  temperature: number;
}

interface ApiSettingsProps {
  settings: ApiSettings;
  onUpdateSettings: (settings: ApiSettings) => void;
  onTestConnection?: () => Promise<boolean>;
}

export function ApiSettings({
  settings,
  onUpdateSettings,
  onTestConnection
}: ApiSettingsProps) {
  const [provider, setProvider] = useState<"openai" | "local">(settings.provider);
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [model, setModel] = useState(settings.model);
  const [temperature, setTemperature] = useState(settings.temperature);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (provider === "openai" && !OPENAI_MODELS.some(m => m.id === model)) {
      setModel(OPENAI_MODELS[0].id);
    } else if (provider === "local" && !LOCAL_MODELS.some(m => m.id === model)) {
      setModel(LOCAL_MODELS[0].id);
    }
  }, [provider, model]);

  const handleProviderChange = (value: string) => {
    const newProvider = value as "openai" | "local";
    setProvider(newProvider);

    if (newProvider === "openai") {
      setModel(OPENAI_MODELS[0].id);
    } else {
      setModel(LOCAL_MODELS[0].id);
    }
  };

  const handleModelChange = (value: string) => {
    setModel(value);
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setTemperature(value);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleSaveSettings = () => {
    if (provider === "openai" && !apiKey) {
      toast.error("API key is required for OpenAI usage");
      return;
    }

    if (!model) {
      toast.error("Please select a model");
      return;
    }

    const newSettings: ApiSettings = {
      provider,
      apiKey,
      model,
      temperature,
    };

    onUpdateSettings(newSettings);
    toast.success("AI settings updated");
  };

  const handleTestConnection = async () => {
    if (!onTestConnection) return;

    if (provider === "openai" && !apiKey) {
      toast.error("API key is required for testing");
      return;
    }

    setIsTesting(true);
    try {
      const success = await onTestConnection();
      if (success) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed. Check your settings.");
      }
    } catch (error) {
      toast.error("An error occurred during the connection test");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <ServerIcon className="h-5 w-5 mr-2" />
          AI Model Settings
        </CardTitle>
        <CardDescription>
          Configure the AI model used for document analysis and chat
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AI Provider</Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">
                <div className="flex items-center">
                  <LaptopIcon className="h-4 w-4 mr-2" />
                  <span>Local (WebLLM)</span>
                </div>
              </SelectItem>
              <SelectItem value="openai">
                <div className="flex items-center">
                  <CloudIcon className="h-4 w-4 mr-2" />
                  <span>OpenAI API</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            {provider === "local"
              ? "Local processing - your data is never sent to any server"
              : "OpenAI API - your data is sent to the cloud for processing"}
          </p>
        </div>

        {provider === "openai" && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <div className="relative">
              <KeyIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="sk-..."
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is stored securely in your browser and is never sent to any server.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Model</Label>
          <Select value={model} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {provider === "openai" ? (
                OPENAI_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))
              ) : (
                LOCAL_MODELS.map(model => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Creativity (Temperature): {temperature.toFixed(1)}</Label>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Precise (0.0)</span>
            <span>Balanced (0.5)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
          {isTesting ? "Testing..." : "Test Connection"}
        </Button>
        <Button onClick={handleSaveSettings}>Save Settings</Button>
      </CardFooter>
    </Card>
  );
} 