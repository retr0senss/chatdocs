"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamically import the chat page component with no SSR
const ChatPageClient = dynamic(
  () => import("@/components/chat/chat-page-client"),
  { ssr: false }
);

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
      <ChatPageClient />
    </Suspense>
  );
} 