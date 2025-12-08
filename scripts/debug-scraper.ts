import { fetchHTML } from "../lib/scraper/utils";
import * as cheerio from "cheerio";

async function debugScraper() {
  try {
    const url = "https://blog.hubspot.com";
    console.log(`🔍 Fetching: ${url}\n`);

    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    console.log(`✅ HTML fetched: ${html.length} characters\n`);

    // Try different selectors
    const selectors = [
      "article",
      ".post-item",
      ".blog-post",
      "[data-testid*='post']",
      ".hsg-post",
      ".blog-post-card",
    ];

    console.log("🔎 Testing selectors:\n");
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`   ${selector}: ${elements.length} elements found`);
      if (elements.length > 0) {
        const first = elements.first();
        const title = first.find("h1, h2, h3, .title, .post-title").first().text().trim();
        console.log(`      Sample title: ${title.substring(0, 50)}...`);
      }
    }

    // Check for common blog post patterns
    console.log("\n📋 Checking for common patterns:\n");
    console.log(`   Links with '/blog/': ${$("a[href*='/blog/']").length}`);
    console.log(`   Links with '/marketing/': ${$("a[href*='/marketing/']").length}`);
    console.log(`   Links with '/sales/': ${$("a[href*='/sales/']").length}`);
    console.log(`   Article tags: ${$("article").length}`);
    console.log(`   Divs with 'post' class: ${$("div[class*='post']").length}`);

    // Show page title
    console.log(`\n📄 Page title: ${$("title").text()}`);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugScraper();

