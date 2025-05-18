"use client";

import { cn } from "@/lib/utils";
import { UserIcon, BotIcon } from "lucide-react";
import { type Message as MessageType } from "@/lib/llm/use-web-llm";

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-start gap-4 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow bg-primary text-primary-foreground">
          <BotIcon className="h-4 w-4" />
        </div>
      )}

      <div className={cn(
        "flex-1 space-y-2 max-w-[80%]",
        isUser ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "prose prose-sm dark:prose-invert break-words inline-block rounded-lg px-4 py-2",
          isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
        )}>
          {message.content || (
            <div className="h-5 w-12 animate-pulse rounded-md bg-muted"></div>
          )}
        </div>
        <div className={cn(
          "flex items-center text-xs text-muted-foreground",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span>
            {isUser ? "Siz" : "AI"}{" "}
            {message.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow bg-background">
          <UserIcon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
} 