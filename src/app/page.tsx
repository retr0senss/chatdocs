import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Chat with Your Docs
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Drag and drop your documents into your browser and chat with AI.
          All processing happens on your device - your data is never sent to a server.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button size="lg" asChild>
            <Link href="/chat">
              Get Started
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Completely Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <p>All AI processing happens in your browser, with your data never leaving your device.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Secure and Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Analyze sensitive documents with peace of mind. Your data is always under your control.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fast & Easy to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Drag your document, upload it, and start chatting with AI immediately.</p>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-12 text-sm text-muted-foreground">
          <p>Powered by WebLLM and Next.js - Your data never gets sent to a server.</p>
        </footer>
      </div>
    </div>
  );
}
