"use client";

import { useRef, useEffect } from "react";
import { Message } from "./message";
import { ChatInput } from "./chat-input";
import { type Message as MessageType } from "@/lib/llm/use-web-llm";

interface ChatWindowProps {
  messages: MessageType[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  isModelLoading?: boolean;
  loadingProgress?: number;
  loadingError?: string | null;
}

export function ChatWindow({
  messages,
  onSendMessage,
  isLoading = false,
  isModelLoading = false,
  loadingProgress = 0,
  loadingError = null,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages are updated
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Get loading stage messages
  const getLoadingMessage = (progress: number) => {
    if (progress === 0) return "Model files are being downloaded and cached...";
    if (progress < 30) return "Setting up WebGPU...";
    if (progress < 60) return "Loading model weights...";
    if (progress < 90) return "Starting model...";
    return "Almost ready...";
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {isModelLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4 text-lg font-medium">
              Loading model... ({loadingProgress}%)
            </div>
            <div className="w-full max-w-md h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.max(2, loadingProgress)}%` }}
              ></div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {getLoadingMessage(loadingProgress)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              This process may take several minutes depending on your computer.
              <br />
              Model files are being downloaded and cached. First loading takes longer.
            </p>
          </div>
        ) : loadingError ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4 text-lg font-medium text-destructive">
              An error occurred while loading the model
            </div>
            <p className="text-sm text-muted-foreground mb-4">{loadingError}</p>
            <p className="text-xs text-muted-foreground">
              Make sure your browser supports WebGPU.
              <br />
              We recommend using the latest versions of Chrome or Edge browsers.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-lg">
              Start by asking a question about your document.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Example: "What are the main features of the API described in this document?"
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <ChatInput
        onSubmit={onSendMessage}
        isDisabled={isModelLoading || !!loadingError}
        isLoading={isLoading}
      />
    </div>
  );
} 