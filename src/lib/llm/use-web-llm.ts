"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { WebLLMService } from "./web-llm-service";
import { OpenAIService, OpenAIConfig } from "./openai-service";
import type { ProcessedDocument } from "../document-processing/document-utils";
import { loadApiSettings, DEFAULT_API_SETTINGS } from "../api-settings";
import type { ApiSettings } from "@/components/settings/api-settings";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  createdAt: Date;
}

interface UseWebLLMReturn {
  messages: Message[];
  isModelLoading: boolean;
  modelLoadingProgress: number;
  modelLoadingError: string | null;
  isGenerating: boolean;
  sendMessage: (content: string) => Promise<void>;
  setDocument: (document: ProcessedDocument) => void;
  service: WebLLMService | OpenAIService | null; 
  apiSettings: ApiSettings;
  updateApiSettings: (settings: ApiSettings) => void;
}

export function useWebLLM(): UseWebLLMReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiSettings, setApiSettings] =
    useState<ApiSettings>(DEFAULT_API_SETTINGS);

  const webllmServiceRef = useRef<WebLLMService | null>(null);
  const openaiServiceRef = useRef<OpenAIService | null>(null);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  };

  useEffect(() => {
    const settings = loadApiSettings();
    setApiSettings(settings);
  }, []);

  const updateApiSettings = useCallback((settings: ApiSettings) => {
    setApiSettings(settings);
  }, []);

  const getActiveService = useCallback(() => {
    if (apiSettings.provider === "local") {
      return webllmServiceRef.current;
    } else {
      return openaiServiceRef.current;
    }
  }, [apiSettings.provider]);

  const initWebLLM = useCallback(async () => {
    if (!webllmServiceRef.current) {
      webllmServiceRef.current = new WebLLMService();
    }

    if (webllmServiceRef.current.isModelLoaded()) {
      return;
    }

    try {
      setIsModelLoading(true);
      setModelLoadingError(null);

      await webllmServiceRef.current.init(
        (progress) => {
          setModelLoadingProgress(progress);
        },
        (error) => {
          setModelLoadingError(error);
        }
      );

      setIsModelLoading(false);
    } catch (error) {
      setIsModelLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setModelLoadingError(errorMessage);
    }
  }, []);

  const initOpenAI = useCallback(() => {
    if (
      openaiServiceRef.current &&
      openaiServiceRef.current.apiKey === apiSettings.apiKey &&
      openaiServiceRef.current.model === apiSettings.model
    ) {
      return;
    }

    const config: OpenAIConfig = {
      apiKey: apiSettings.apiKey,
      model: apiSettings.model,
      temperature: apiSettings.temperature,
    };

    openaiServiceRef.current = new OpenAIService(config);
  }, [apiSettings]);

  useEffect(() => {
    if (apiSettings.provider === "local") {
      initWebLLM();
    } else {
      initOpenAI();
    }
  }, [apiSettings, initWebLLM, initOpenAI]);

  const setDocument = useCallback(
    (document: ProcessedDocument) => {
      const service = getActiveService();
      if (service) {
        service.setDocument(document);
      }

      setMessages([]);
    },
    [getActiveService]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const service = getActiveService();
      if (!service) {
        const errorMsg =
          apiSettings.provider === "local"
            ? "Model not loaded. Please try again."
            : "API service not started. Check your API key.";

        setModelLoadingError(errorMsg);
        return;
      }

      const userMessage: Message = {
        id: generateId(),
        content,
        role: "user",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsGenerating(true);

      try {
        await service.generateResponse([...messages, userMessage], (chunk) => {
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const assistantMessageIndex = updatedMessages.findIndex(
              (msg) => msg.id === assistantMessageId
            );

            if (assistantMessageIndex !== -1) {
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: updatedMessages[assistantMessageIndex].content + chunk,
              };
            }

            return updatedMessages;
          });
        });
      } catch (error) {
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const assistantMessageIndex = updatedMessages.findIndex(
            (msg) => msg.id === assistantMessageId
          );

          if (assistantMessageIndex !== -1) {
            updatedMessages[assistantMessageIndex] = {
              ...updatedMessages[assistantMessageIndex],
              content: "Sorry, an error occurred. Please try again.",
            };
          }

          return updatedMessages;
        });

        console.error("Message sending error:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [messages, apiSettings.provider, getActiveService]
  );

  return {
    messages,
    isModelLoading,
    modelLoadingProgress,
    modelLoadingError,
    isGenerating,
    sendMessage,
    setDocument,
    service: getActiveService(),
    apiSettings,
    updateApiSettings,
  };
}
