"use client";

import { ProcessedDocument } from "../document-processing/document-utils";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private document: ProcessedDocument | null = null;
  private chatHistory: Array<ChatMessage> = [];

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-3.5-turbo";
    this.temperature = config.temperature || 0.7;
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
    if (!this.document) {
      throw new Error(
        "Document not set. Please call setDocument() first."
      );
    }

    try {
      const userQuestion = messages[messages.length - 1].content;

      const relevantChunks = this.findRelevantChunks(userQuestion, 3);
      const context = relevantChunks.join("\n\n");

      const systemPrompt = this.createSystemPrompt();

      const systemMessage = {
        role: "system" as const,
        content: systemPrompt,
      };

      const userContextMessage = {
        role: "user" as const,
        content: `Document content:\n${context}\n\nQuestion: ${userQuestion}`,
      };

      const apiMessages = [systemMessage];

      if (this.chatHistory.length > 0) {
        const recentHistory = this.chatHistory.slice(-6);
        apiMessages.push(...recentHistory);
      }

      apiMessages.push(userContextMessage);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: apiMessages,
            temperature: this.temperature,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API response not received");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";

      if (!reader) {
        throw new Error("Stream not read");
      }

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split("\n")
          .filter(
            (line) => line.trim() !== "" && line.trim() !== "data: [DONE]"
          );

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || "";
              if (content) {
                fullResponse += content;
                onUpdate(content);
              }
            } catch (e) {
              console.error("JSON parse error:", e);
            }
          }
        }
      }

      this.chatHistory.push(
        { role: "user", content: userQuestion },
        { role: "assistant", content: fullResponse }
      );

      if (this.chatHistory.length > 10) {
        this.chatHistory = this.chatHistory.slice(-10);
      }

      return fullResponse;
    } catch (error) {
      console.error("OpenAI response creation error:", error);
      throw error;
    }
  }

  async summarizeDocument(): Promise<string> {
    if (!this.document) {
      throw new Error(
        "Document not set. Please call setDocument() first."
      );
    }

    try {
      const maxContentLength = 12000;
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

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content:
                  "You are a professional text analyst and summary writer.",
              },
              {
                role: "user",
                content: summarizePrompt,
              },
            ],
            temperature: 0.3,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API response not received");
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || "";

      return summary;
    } catch (error) {
      console.error("Summary creation error:", error);
      throw error;
    }
  }

  async extractKeyTopics(): Promise<string[]> {
    if (!this.document) {
      throw new Error(
        "Document not set. Please call setDocument() first."
      );
    }

    try {
      const maxContentLength = 10000;
      let content = this.document.content;

      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength);
      }

      const topicsPrompt = `Analyze the following document content and identify the 5-7 most important topics or concepts in the document.
      
Document: "${this.document.name}"

Document Content:
${content}

Format your response as a list of only the topics or concepts, with each topic being no more than 3-4 words. List each topic on a new line.`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: "system",
                content: "You are a content analyst and topic expert.",
              },
              {
                role: "user",
                content: topicsPrompt,
              },
            ],
            temperature: 0.2,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API response not received");
      }

      const data = await response.json();
      const topicsText = data.choices[0]?.message?.content || "";

      return topicsText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) =>
          line && !line.startsWith("-") ? line.replace(/^-\s*/, "") : line
        );
    } catch (error) {
      console.error("Key topic extraction error:", error);
      throw error;
    }
  }
}
