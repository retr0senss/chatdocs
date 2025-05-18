import type { FileWithPreview } from "@/components/document/file-uploader";
import * as pdfjsLib from "pdfjs-dist";
import { marked } from "marked";
import { saveDocument, saveLastProcessedDocumentId } from "./document-storage";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export interface ProcessedDocument {
  id: string;
  name: string;
  content: string;
  extension: string;
  chunks: string[];
  summary?: string;
  createdAt: Date;
  source?: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  document?: ProcessedDocument;
  error?: string;
}

export async function extractDocumentContent(
  file: FileWithPreview
): Promise<DocumentProcessingResult> {
  try {
    let content = "";

    switch (file.extension.toLowerCase()) {
      case "pdf":
        content = await extractPdfContent(file);
        break;
      case "txt":
        content = await extractTextContent(file);
        break;
      case "md":
        content = await extractMarkdownContent(file);
        break;
      default:
        throw new Error(`Unsupported file format: ${file.extension}`);
    }

    if (!content || content.trim() === "") {
      throw new Error("Content could not be extracted from the document.");
    }

    const chunks = chunkDocument(content);

    const document: ProcessedDocument = {
      id: generateDocumentId(),
      name: file.name,
      content,
      extension: file.extension,
      chunks,
      createdAt: new Date(),
    };

    await saveDocument(document);
    saveLastProcessedDocumentId(document.id);

    return {
      success: true,
      document,
    };
  } catch (error) {
    console.error("Document processing error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error extracting document content.",
    };
  }
}

/**
 * Function to extract document content from a URL
 * @param url The URL of the web page to fetch
 * @param name The name to display for the document
 */
export async function extractContentFromUrl(
  url: string,
  name: string = ""
): Promise<DocumentProcessingResult> {
  try {
    // Check if the URL is valid
    try {
      new URL(url);
    } catch (e) {
      throw new Error("Invalid URL format");
    }

    const response = await fetch("/api/fetch-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "URL içeriği çekilemedi");
    }

    const data = await response.json();
    const { content, title } = data;

    if (!content || content.trim() === "") {
      throw new Error("Content could not be extracted from the URL.");
    } 

    const chunks = chunkDocument(content);

    const document: ProcessedDocument = {
      id: generateDocumentId(),
      name: name || title || url.split("/").pop() || "Web Page",
      content,
      extension: "html",
      chunks,
      createdAt: new Date(),
      source: url,
    };

    await saveDocument(document);
    saveLastProcessedDocumentId(document.id);

    return {
      success: true,
      document,
    };
  } catch (error) {
    console.error("URL processing error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error extracting content from URL.",
    };
  }
}

async function extractPdfContent(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise;
    const numPages = pdfDoc.numPages;

    let fullText = "";

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        // @ts-expect-error: PDF.js types are complex, this works in practice
        .map((item) => item.str || "")
        .join(" ");

      fullText += pageText + "\n\n";
    }
    return fullText.trim();
  } catch (error) {
    console.error("PDF reading error:", error);
    throw new Error("PDF file could not be read.");
  }
}

async function extractTextContent(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error("Text file could not be read."));
      }
    };
    reader.onerror = () => reject(new Error("Text file reading error."));
    reader.readAsText(file);
  });
}


async function extractMarkdownContent(file: File): Promise<string> {
  try {
    const mdText = await extractTextContent(file);

    const html = marked.parse(mdText);

    if (typeof window !== "undefined") {
      const tempElement = document.createElement("div");
      tempElement.innerHTML = html as string;
      return tempElement.textContent || tempElement.innerText || "";
    }

    return html
      .toString()
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (error) {
    console.error("Markdown reading error:", error);
    throw new Error("Markdown file could not be processed.");
  }
}


export function chunkDocument(
  content: string,
  chunkSize: number = 1000
): string[] {
  if (content.length < chunkSize) {
    return [content];
  }

  const chunks: string[] = [];

  const paragraphs = content.split(/\n\s*\n/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > chunkSize) {
      const words = paragraph.split(/\s+/);
      for (const word of words) {
        if ((currentChunk + " " + word).length <= chunkSize) {
          currentChunk += (currentChunk ? " " : "") + word;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
          }
          currentChunk = word;
        }
      }
    } else if ((currentChunk + "\n\n" + paragraph).length <= chunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}


function generateDocumentId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}
