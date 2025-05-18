"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon, SearchIcon, ZapIcon, BookOpenIcon, ListIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WebLLMService } from "@/lib/llm/web-llm-service";
import { OpenAIService } from "@/lib/llm/openai-service";
import { ProcessedDocument } from "@/lib/document-processing/document-utils";
import { toast } from "sonner";

interface DocumentAnalysisProps {
  document: ProcessedDocument;
  llmService: WebLLMService | OpenAIService;
}

export function DocumentAnalysis({ document, llmService }: DocumentAnalysisProps) {
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [keyTopics, setKeyTopics] = useState<string[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ index: number, text: string, matchCount: number }[]>([]);
  const [activeTab, setActiveTab] = useState("summary");

  // Generate document summary
  const generateSummary = async () => {
    if (isGeneratingSummary) return;

    setIsGeneratingSummary(true);
    try {
      const result = await llmService.summarizeDocument();
      setSummary(result);
    } catch (error) {
      console.error("Summary generation error:", error);
      toast.error("An error occurred while generating the document summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Extract key topics
  const generateKeyTopics = async () => {
    if (isGeneratingTopics) return;

    setIsGeneratingTopics(true);
    try {
      const topics = await llmService.extractKeyTopics();
      setKeyTopics(topics);
    } catch (error) {
      console.error("Key topic extraction error:", error);
      toast.error("An error occurred while extracting key topics");
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  // Search within document
  const searchInDocument = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: { index: number, text: string, matchCount: number }[] = [];

    // Search in document chunks
    document.chunks.forEach((chunk, index) => {
      const lowerChunk = chunk.toLowerCase();
      const matchCount = (lowerChunk.match(new RegExp(query, 'g')) || []).length;

      if (matchCount > 0) {
        // Extract relevant text and highlight search term
        const chunkLines = chunk.split('\n');
        let matchedText = '';

        // Find matching lines
        for (const line of chunkLines) {
          if (line.toLowerCase().includes(query)) {
            matchedText += line + '\n';
          }
        }

        // If no lines found, show part of the content
        if (!matchedText && chunk.length > 0) {
          const startIndex = Math.max(0, lowerChunk.indexOf(query) - 50);
          const endIndex = Math.min(chunk.length, lowerChunk.indexOf(query) + query.length + 100);
          matchedText = '...' + chunk.substring(startIndex, endIndex) + '...';
        }

        results.push({
          index,
          text: matchedText || chunk.substring(0, 150) + '...',
          matchCount
        });
      }
    });

    // Sort results by match count
    results.sort((a, b) => b.matchCount - a.matchCount);
    setSearchResults(results);
  };

  // When search input changes
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery) {
        searchInDocument();
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  // Automatic processing when tab changes
  useEffect(() => {
    // When switching to summary tab, generate summary if not already generated
    if (activeTab === "summary" && !summary && !isGeneratingSummary) {
      generateSummary();
    }

    // When switching to topics tab, generate topics if not already generated
    if (activeTab === "topics" && keyTopics.length === 0 && !isGeneratingTopics) {
      generateKeyTopics();
    }
  }, [activeTab]);

  // Clear cache when document changes
  useEffect(() => {
    setSummary("");
    setKeyTopics([]);
    setSearchQuery("");
    setSearchResults([]);
  }, [document.id]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <ZapIcon className="h-5 w-5 mr-2" />
          Document Analysis
        </CardTitle>
        <CardDescription>
          Document summary, key topics, and content search
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 px-4">
            <TabsTrigger value="summary" className="text-xs sm:text-sm">
              <BookOpenIcon className="h-3 w-3 mr-1" /> Summary
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-xs sm:text-sm">
              <ListIcon className="h-3 w-3 mr-1" /> Topics
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs sm:text-sm">
              <SearchIcon className="h-3 w-3 mr-1" /> Search
            </TabsTrigger>
          </TabsList>

          {/* Summary tab */}
          <TabsContent value="summary" className="px-4 pb-4">
            {isGeneratingSummary ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2Icon className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating document summary...
                </p>
              </div>
            ) : summary ? (
              <div className="mt-2">
                <ScrollArea className="h-[350px] pr-3">
                  <div className="prose prose-sm dark:prose-invert">
                    {summary.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSummary}
                    className="w-full"
                  >
                    Regenerate Summary
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Button
                  onClick={generateSummary}
                  disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Summary
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Key topics tab */}
          <TabsContent value="topics" className="px-4 pb-4">
            {isGeneratingTopics ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2Icon className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Extracting key topics...
                </p>
              </div>
            ) : keyTopics.length > 0 ? (
              <div className="mt-2">
                <ScrollArea className="h-[350px] pr-3">
                  <div className="flex flex-wrap gap-2 py-2">
                    {keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Topic Descriptions</h4>
                    <div className="space-y-3">
                      {keyTopics.slice(0, 5).map((topic, index) => (
                        <div key={index} className="bg-muted p-3 rounded-md">
                          <h5 className="font-medium text-sm mb-1">{topic}</h5>
                          <p className="text-xs text-muted-foreground">
                            There are {document.chunks.filter(chunk =>
                              chunk.toLowerCase().includes(topic.toLowerCase())
                            ).length} sections in the document related to this topic.
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateKeyTopics}
                    className="w-full"
                  >
                    Extract Topics Again
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Button
                  onClick={generateKeyTopics}
                  disabled={isGeneratingTopics}
                >
                  {isGeneratingTopics && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Extract Key Topics
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Search tab */}
          <TabsContent value="search" className="px-4 pb-4">
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search within the document..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-3">
                <ScrollArea className="h-[350px] pr-3">
                  {searchQuery ? (
                    searchResults.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          {searchResults.length} results found for "{searchQuery}"
                        </p>
                        {searchResults.map((result, index) => (
                          <div key={index} className="bg-muted p-3 rounded-md">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium">Section {result.index + 1}</span>
                              <Badge variant="outline" className="text-xs">
                                {result.matchCount} matches
                              </Badge>
                            </div>
                            <p className="text-sm whitespace-pre-line">
                              {result.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">
                          No results found for "{searchQuery}"
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Enter a word or phrase to search within the document
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 