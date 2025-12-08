import * as cheerio from "cheerio";
import axios from "axios";

export async function fetchHTML(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error}`);
  }
}

export function extractText(
  $: cheerio.CheerioAPI,
  selector: string,
  context?: cheerio.Cheerio<any>
): string {
  const element = context
    ? context.find(selector).first()
    : $(selector).first();
  return element.text().trim();
}

export function extractAttribute(
  $: cheerio.CheerioAPI,
  selector: string,
  attribute: string,
  context?: cheerio.Cheerio<any>
): string {
  const element = context
    ? context.find(selector).first()
    : $(selector).first();
  return element.attr(attribute) || "";
}

export function extractMultiple(
  $: cheerio.CheerioAPI,
  selector: string,
  context?: cheerio.Cheerio<any>
): string[] {
  const elements = context
    ? context.find(selector)
    : $(selector);
  return elements
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((text) => text.length > 0);
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

export function parseDate(dateString: string): Date {
  // Try various date formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Fallback to current date if parsing fails
  return new Date();
}

export function estimateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

