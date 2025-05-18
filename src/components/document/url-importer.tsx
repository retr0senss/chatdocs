"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LinkIcon, LoaderIcon } from "lucide-react";
import { extractContentFromUrl } from "@/lib/document-processing/document-utils";
import { toast } from "sonner";
import type { ProcessedDocument } from "@/lib/document-processing/document-utils";

interface UrlImporterProps {
  onComplete: (document: ProcessedDocument) => void;
  onError: (error: string) => void;
}

export function UrlImporter({ onComplete, onError }: UrlImporterProps) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      setIsLoading(true);
      setProgress(10);
      setStatusText("Establishing URL connection...");

      // Artificial progress animation
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      setProgress(30);
      setStatusText("Extracting content...");

      // Extract content from URL
      const result = await extractContentFromUrl(url, name);

      clearInterval(interval);

      if (result.success && result.document) {
        setProgress(100);
        setStatusText("Completed!");
        onComplete(result.document);
        toast.success("Web page content successfully retrieved");
      } else {
        throw new Error(result.error || "Could not extract content");
      }
    } catch (error) {
      setStatusText("Process failed!");
      const errorMessage = error instanceof Error ? error.message : "An error occurred while processing the web page";
      onError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <LinkIcon className="h-5 w-5 mr-2" />
          Import Web Page
        </CardTitle>
        <CardDescription>
          Enter a web page URL to process its content as a document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium">
              Web Page URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/page"
              value={url}
              onChange={handleUrlChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Document Name (Optional)
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Name to use if page title cannot be retrieved"
              value={name}
              onChange={handleNameChange}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              If left blank, the page title will be used
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <Button type="submit" className="w-full">
              Fetch Content
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 