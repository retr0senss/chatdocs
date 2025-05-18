"use client";

import { useState, FormEvent } from "react";
import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  isDisabled = false,
  isLoading = false,
  placeholder = "Ask me anything about your document...",
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isDisabled || isLoading) return;

    onSubmit(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full gap-2 border-t bg-background p-4 items-center"
    >
      <Textarea
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[60px] w-full resize-none rounded-md border p-3"
        disabled={isDisabled || isLoading}
      />
      <Button
        type="submit"
        size="icon"
        disabled={isDisabled || isLoading || !input.trim()}
      >
        <SendIcon className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
} 