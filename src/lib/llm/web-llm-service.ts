"use client";

import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { ProcessedDocument } from "../document-processing/document-utils";

const MODEL_NAME = "Llama-3-8B-Instruct-q4f32_1-MLC";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export class WebLLMService {
  private engine: MLCEngine | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private initProgress: (progress: number) => void = () => {};
  private initError: (error: string) => void = () => {};
  private document: ProcessedDocument | null = null;
  private chatHistory: Array<ChatMessage> = [];

  constructor() {
    // Remove the ChatModule instantiation as it's not available
  }

  async init(
    onProgress: (progress: number) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initProgress = onProgress;
    this.initError = onError;

    this.initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        const initProgressCallback = (report: { progress: number }) => {
          const progressValue = Math.floor(report.progress * 100);
          onProgress(progressValue);
        };

        this.engine = await CreateMLCEngine(MODEL_NAME, {
          initProgressCallback,
        });

        this.isInitialized = true;
        resolve();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        onError(errorMessage);
        reject(error);
      }
    });

    return this.initPromise;
  }

  setDocument(document: ProcessedDocument) {
    this.document = document;
    this.chatHistory = [];
  }

  private createSystemPrompt(): string {
    if (!this.document) {
      return "Help the user with their questions.";
    }

    const basePrompt = `You are a document assistant. Based on the following document, answer the user's questions:
    
Document: "${this.document.name}"

Follow these rules in your answers:
1. If the answer to the question is not in the document, honestly say you don't know and don't make up information outside the document.
2. Only answer based on the information in the document.
3. In your answers, refer to the information in the document.
4. If needed, make clear explanations and summaries.
5. If you can't help with a topic that is not in the document, say so.`;

    return basePrompt;
  }

  private findRelevantChunks(query: string, maxChunks: number = 3): string[] {
    if (!this.document || this.document.chunks.length === 0) {
      return [];
    }

    const keywords = this.extractKeywords(query);
    if (keywords.length === 0) {
      return this.document.chunks.slice(0, maxChunks);
    }

    const scoredChunks = this.document.chunks.map((chunk, index) => {
      const score = keywords.reduce((acc, keyword) => {
        return (
          acc + (chunk.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0)
        );
      }, 0);

      return { chunk, score, index };
    });

    return scoredChunks
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      })
      .slice(0, maxChunks)
      .map((item) => item.chunk);
  }

  private extractKeywords(text: string): string[] {
    const stopwords = [
      "bir",
      "ve",
      "veya",
      "da",
      "de",
      "bu",
      "şu",
      "o",
      "için",
      "ile",
      "gibi",
      "kadar",
      "mi",
      "mı",
      "mu",
      "mü",
      "ne",
      "nasıl",
      "neden",
      "hangi",
      "kim",
      "kime",
      "nerede",
      "ne zaman",
      "acaba",
      "belki",
      "evet",
      "hayır",
      "tamam",
      "değil",
      "var",
      "yok",
    ];

    const words = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/);

    return words.filter((word) => word.length > 3 && !stopwords.includes(word));
  }

  async generateResponse(
    messages: ChatMessage[],
    onUpdate: (text: string) => void
  ): Promise<string> {
    if (!this.isInitialized || !this.engine) {
      throw new Error(
        "Model henüz yüklenmedi. Lütfen önce init() fonksiyonunu çağırın."
      );
    }

    if (!this.document) {
      throw new Error(
        "Belge ayarlanmadı. Lütfen önce setDocument() fonksiyonunu çağırın."
      );
    }

    try {
      const userQuestion = messages[messages.length - 1].content;

      const relevantChunks = this.findRelevantChunks(userQuestion, 3);
      const context = relevantChunks.join("\n\n");

      const systemPrompt = this.createSystemPrompt();

      const baseMessages = [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content: `Belge içeriği:\n${context}\n\nSorum: ${userQuestion}`,
        },
      ];

      const augmentedMessages: Array<ChatMessage> = [...baseMessages];

      if (this.chatHistory.length > 0) {
        const recentHistory = this.chatHistory.slice(-6);

        augmentedMessages.push(...recentHistory);
      }

      let response = "";
      const stream = await this.engine.chat.completions.create({
        messages: augmentedMessages,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta.content || "";
        response += content;
        onUpdate(content);
      }

      this.chatHistory.push(
        { role: "user", content: userQuestion },
        { role: "assistant", content: response }
      );

      if (this.chatHistory.length > 10) {
        this.chatHistory = this.chatHistory.slice(-10);
      }

      return response;
    } catch (error) {
      console.error("Yanıt oluşturma hatası:", error);
      throw new Error("Yanıt oluşturulurken bir hata oluştu.");
    }
  }

  isModelLoaded(): boolean {
    return this.isInitialized;
  }

  async dispose(): Promise<void> {
    if (this.engine) {
      this.engine = null;
      this.isInitialized = false;
      this.initPromise = null;
      this.chatHistory = [];
    }
  }

  async summarizeDocument(): Promise<string> {
    if (!this.isInitialized || !this.engine) {
      throw new Error(
        "Model henüz yüklenmedi. Lütfen önce init() fonksiyonunu çağırın."
      );
    }

    if (!this.document) {
      throw new Error(
        "Belge ayarlanmadı. Lütfen önce setDocument() fonksiyonunu çağırın."
      );
    }

    try {
      const maxContentLength = 8000;
      let content = this.document.content;

      if (content.length > maxContentLength) {
        const firstPart = content.substring(0, maxContentLength / 2);
        const lastPart = content.substring(
          content.length - maxContentLength / 2
        );
        content = firstPart + "\n...\n" + lastPart;
      }

      const summarizePrompt = `Summarize the following document in a short and concise manner.
      
Document: "${this.document.name}"

Document Content:
${content}

Pay attention to the following in the summary:
1. The summary should be 3-5 paragraphs long
2. Important topics and information should be included
3. Highlight the overall purpose of the document and important points
4. Use a clear and understandable language while keeping technical terms
5. Reflect the structure of the document (introduction, development, conclusion, etc.)
`;

      let summary = "";
      const stream = await this.engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional text analyst and summary writer.",
          },
          { role: "user", content: summarizePrompt },
        ],
        temperature: 0.3,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta.content || "";
        summary += content;
      }

      return summary;
    } catch (error) {
      console.error("Summary creation error:", error);
      throw new Error("Error creating summary.");
    }
  }

  async extractKeyTopics(): Promise<string[]> {
    if (!this.isInitialized || !this.engine) {
      throw new Error("Model not loaded. Please call init() first.");
    }

    if (!this.document) {
      throw new Error("Document not set. Please call setDocument() first.");
    }

    try {
      const maxContentLength = 6000;
      let content = this.document.content;

      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength);
      }

      const topicsPrompt = `Analyze the following document content and identify the 5-7 most important topics or concepts in the document.
      
Document: "${this.document.name}"

Document Content:
${content}

Format your response as a list of only the topics or concepts, with each topic being no more than 3-4 words. List each topic on a new line.`;

      const response = await this.engine.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a content analyst and topic expert.",
          },
          { role: "user", content: topicsPrompt },
        ],
        temperature: 0.2,
        stream: false,
      });

      const topicsText = response.choices[0]?.message.content || "";

      return topicsText
        .split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) =>
          line && !line.startsWith("-") ? line.replace(/^-\s*/, "") : line
        );
    } catch (error) {
      console.error("Key topic extraction error:", error);
      throw new Error("Error extracting key topics.");
    }
  }
}
