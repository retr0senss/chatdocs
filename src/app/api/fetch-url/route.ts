import { NextResponse } from "next/server";

/**
 * URL içeriğini çeken API endpoint
 */
export async function POST(request: Request) {
  try {
    // Request body'den URL'i al
    const data = await request.json();
    const { url } = data;

    if (!url) {
      return NextResponse.json(
        { error: "URL must be provided as a parameter" },
        { status: 400 }
      );
    }

    // URL'in güvenli olup olmadığını kontrol et (http veya https olmalı)
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://" },
        { status: 400 }
      );
    }

    // URL içeriğini çek
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch URL content: ${response.statusText}` },
        { status: 500 }
      );
    }

    // Content-Type başlığını kontrol et
    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain")
    ) {
      return NextResponse.json(
        {
          error:
            "URL is not a web page. Only HTML and text pages are supported.",
        },
        { status: 400 }
      );
    }

    // HTML içeriğini al
    const html = await response.text();

    // HTML içeriğinden başlık ve metin içeriğini çıkar
    const title = extractTitle(html);
    const content = cleanHtml(html);

    return NextResponse.json(
      {
        title,
        content,
        sourceUrl: url,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("URL processing error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error processing URL",
      },
      { status: 500 }
    );
  }
}

/**
 * HTML içeriğinden sayfa başlığını çıkarır
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "";
}

/**
 * HTML içeriğini temizleyerek sadece anlamlı metni çıkarır
 */
function cleanHtml(html: string): string {
  // Temel HTML temizleme işlemi
  let content = html;

  // Script ve style taglerini kaldır
  content = content.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );
  content = content.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  );

  // Diğer HTML taglerini kaldır
  content = content.replace(/<[^>]+>/g, " ");

  // Fazla boşlukları temizle
  content = content.replace(/\s+/g, " ");

  // Gereksiz satır başlarını temizle
  content = content.replace(/[\r\n]+/g, "\n");

  // Metni trim et
  return content.trim();
}
