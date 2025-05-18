"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader, type FileWithPreview } from "@/components/document/file-uploader";
import { DocumentProcessor } from "@/components/document/document-processor";
import { DocumentManager } from "@/components/document/document-manager";
import { DocumentAnalysis } from "@/components/document/document-analysis";
import { UrlImporter } from "@/components/document/url-importer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { ProcessedDocument } from "@/lib/document-processing/document-utils";
import { useLastDocument } from "@/lib/document-processing/use-last-document";
import { deleteDocument } from "@/lib/document-processing/document-storage";
import { useWebLLM } from "@/lib/llm/use-web-llm";
import { ChatWindow } from "@/components/chat/chat-window";
import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { WebLLMService } from "@/lib/llm/web-llm-service";

export default function ChatPageClient() {
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<ProcessedDocument | null>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [uploadMethodTab, setUploadMethodTab] = useState<string>("file");
  const [documentListKey, setDocumentListKey] = useState<number>(0);
  const { document: lastDocument, isLoading: isLoadingLastDocument, resetDocument } = useLastDocument();

  // WebLLM hook
  const {
    messages,
    isModelLoading,
    modelLoadingProgress,
    modelLoadingError,
    isGenerating,
    sendMessage,
    setDocument: setLLMDocument,
    service: llmService,
    apiSettings,
  } = useWebLLM();

  // Load the last document
  useEffect(() => {
    if (lastDocument && !processedDocument && !selectedFile) {
      setProcessedDocument(lastDocument);
      // Set document for LLM
      setLLMDocument(lastDocument);
      console.log("lastDocument", lastDocument);

      // Loaded document notification
      toast.info(`"${lastDocument.name}" document loaded from previous session.`, {
        description: "You can select another document from the 'Documents' tab if needed.",
        duration: 5000,
      });
    }
  }, [lastDocument, processedDocument, selectedFile, setLLMDocument]);

  const handleFileSelect = (file: FileWithPreview | null) => {
    setSelectedFile(file);
    setProcessedDocument(null);
    setIsProcessing(false);
  };

  const handleProcessDocument = () => {
    if (!selectedFile) {
      toast.error("Please upload a file");
      return;
    }

    setIsProcessing(true);
  };

  const handleProcessComplete = (document: ProcessedDocument) => {
    setProcessedDocument(document);
    setIsProcessing(false);
    // Set document for LLM
    setLLMDocument(document);
    // Update key to refresh document list
    setDocumentListKey(prev => prev + 1);
    toast.success("Document processed successfully");
    // Go to chat tab when processing is complete
    setActiveTab("chat");
  };

  const handleProcessError = (error: string) => {
    setIsProcessing(false);
    toast.error(`Error: ${error}`);
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);

      // If the deleted document is the current document, clear the state
      if (processedDocument && processedDocument.id === documentId) {
        setProcessedDocument(null);
        setSelectedFile(null);
        resetDocument();
      }

      // Update key to refresh document list
      setDocumentListKey(prev => prev + 1);
      toast.success("Document deleted");
    } catch {
      toast.error("Error deleting document");
    }
  };

  const handleSelectDocument = (document: ProcessedDocument) => {
    setProcessedDocument(document);
    setSelectedFile(null);
    setLLMDocument(document);
    toast.success(`"${document.name}" document selected`);
    // Go to chat tab when document is selected
    setActiveTab("chat");
  };

  const handleAddNewDocument = () => {
    setProcessedDocument(null);
    setSelectedFile(null);
    setActiveTab("upload");
  };

  // If content is loading
  if (isLoadingLastDocument) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-8 max-w-5xl mx-auto">
          <Card className="w-full">
            <CardContent className="py-10">
              <div className="flex flex-col items-center justify-center space-y-4">
                <p>Checking previous documents...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const showUploadUI = !processedDocument && activeTab === "upload";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center">
          Chat with Your Docs
          <Link href="/settings" className="inline-block ml-2">
            <Button variant="ghost" size="icon" title="Settings">
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </Link>
        </h1>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="chat" disabled={!processedDocument}>
              Chat
            </TabsTrigger>
            <TabsTrigger value="analysis" disabled={!processedDocument}>
              Analysis
            </TabsTrigger>
            <TabsTrigger value="upload">
              {processedDocument ? "Documents" : "Upload"}
            </TabsTrigger>
          </TabsList>

          {/* Chat tab */}
          <TabsContent value="chat" className="mt-4">
            {processedDocument ? (
              <div className="grid grid-cols-1 gap-4">
                <Card className="w-full col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">
                      {processedDocument.name}
                    </CardTitle>
                    <CardDescription>
                      Ask questions about the document
                      {processedDocument.source && (
                        <span className="block text-xs mt-1">
                          Source: <a href={processedDocument.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{processedDocument.source}</a>
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col h-[500px]">
                      <ChatWindow
                        messages={messages}
                        onSendMessage={sendMessage}
                        isLoading={isGenerating}
                        isModelLoading={isModelLoading}
                        loadingProgress={modelLoadingProgress}
                        loadingError={modelLoadingError}
                      />
                    </div>

                    <div className="p-4">
                      <div className="bg-muted p-3 rounded-md text-xs">
                        <p>File: {processedDocument.name}</p>
                        <p>Size: {processedDocument.content.length} characters</p>
                        <p>Chunks: {processedDocument.chunks.length}</p>
                        <p>Created: {new Date(processedDocument.createdAt).toLocaleString()}</p>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
                          <p>
                            Model: {
                              llmService && llmService instanceof WebLLMService
                                ? "Local (WebLLM)"
                                : `OpenAI API (${apiSettings?.model || "Unknown"})`
                            }
                          </p>
                          <Link href="/settings">
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              AI Settings
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p>Please upload or select a document first.</p>
                <Button
                  variant="default"
                  className="mt-4"
                  onClick={() => setActiveTab("upload")}
                >
                  Upload Document
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Analysis tab */}
          <TabsContent value="analysis" className="mt-4">
            {processedDocument && llmService ? (
              <DocumentAnalysis
                document={processedDocument}
                llmService={llmService}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <p>Please upload or select a document first.</p>
                <Button
                  variant="default"
                  className="mt-4"
                  onClick={() => setActiveTab("upload")}
                >
                  Upload Document
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Document upload tab */}
          <TabsContent value="upload" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-2">
                {showUploadUI ? (
                  <Card className="w-full h-full">
                    <CardHeader>
                      <CardTitle>
                        Upload Files
                      </CardTitle>
                      <CardDescription>
                        Upload files or import web page content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <Tabs value={uploadMethodTab} onValueChange={setUploadMethodTab} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full">
                          <TabsTrigger value="file">Upload File</TabsTrigger>
                          <TabsTrigger value="url">Import from URL</TabsTrigger>
                        </TabsList>

                        <TabsContent value="file" className="mt-4">
                          {!isProcessing ? (
                            <>
                              <FileUploader onFileSelect={handleFileSelect} />

                              {selectedFile && (
                                <div className="flex justify-center">
                                  <Button
                                    onClick={handleProcessDocument}
                                    disabled={isProcessing}
                                    className="w-full max-w-xs"
                                  >
                                    Process Document
                                  </Button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="py-4">
                              {selectedFile && (
                                <DocumentProcessor
                                  file={selectedFile}
                                  onComplete={handleProcessComplete}
                                  onError={handleProcessError}
                                />
                              )}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="url" className="mt-4">
                          <UrlImporter
                            onComplete={handleProcessComplete}
                            onError={handleProcessError}
                          />
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="w-full h-full">
                    <CardHeader>
                      <CardTitle>
                        Active Document: {processedDocument?.name}
                      </CardTitle>
                      <CardDescription>
                        Switch to chat tab to ask questions about this document
                        {processedDocument?.source && (
                          <span className="block text-xs mt-1">
                            Source: <a href={processedDocument.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">{processedDocument.source}</a>
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="font-medium mb-2">Document Information</h3>
                        <div className="text-sm space-y-1">
                          <p>File Type: {processedDocument?.extension.toUpperCase()}</p>
                          <p>Content Length: {processedDocument?.content.length} characters</p>
                          <p>Number of Chunks: {processedDocument?.chunks.length}</p>
                          <p>Created: {new Date(processedDocument?.createdAt || Date.now()).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProcessedDocument(null);
                            setSelectedFile(null);
                          }}
                        >
                          Upload New Document
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("chat")}
                        >
                          Return to Chat
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("analysis")}
                        >
                          Analyze Document
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => processedDocument && handleDeleteDocument(processedDocument.id)}
                        >
                          Delete Document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="col-span-1">
                <DocumentManager
                  key={documentListKey}
                  currentDocument={processedDocument}
                  onSelectDocument={handleSelectDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onAddNewDocument={handleAddNewDocument}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <p className="text-sm text-muted-foreground text-center">
          All processing happens in your browser. Your documents are never uploaded to any server.
        </p>
      </div>
    </div>
  );
} 