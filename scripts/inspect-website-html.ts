import { fetchHTML } from "../lib/scraper/utils";
import * as cheerio from "cheerio";

async function inspectWebsite(url: string) {
  try {
    console.log(`🔍 Inspecting: ${url}\n`);
    
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);
    
    console.log(`✅ HTML fetched: ${html.length} characters\n`);
    
    // Try to find article containers
    console.log("📦 Looking for article containers:\n");
    const selectors = [
      "article",
      "[class*='post']",
      "[class*='card']",
      "[class*='article']",
      "[class*='blog']",
      "[data-testid*='post']",
      "[data-testid*='card']",
      "[data-testid*='article']",
    ];
    
    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   "${selector}": ${elements.length} found`);
        
        // Inspect first element
        const first = elements.first();
        console.log(`      First element HTML preview:`);
        const htmlPreview = $(first).html() || $(first).text() || "";
        console.log(`      ${htmlPreview.substring(0, 500)}...\n`);
        
        // Check for title elements
        const titles = first.find("h1, h2, h3, h4, .title, .post-title, [class*='title']");
        console.log(`      Titles found: ${titles.length}`);
        if (titles.length > 0) {
          titles.slice(0, 3).each((_, el) => {
            const text = $(el).text().trim().substring(0, 60);
            const tag = el.tagName;
            const classes = $(el).attr("class") || "";
            console.log(`         - <${tag} class="${classes}">: "${text}..."`);
          });
        }
        
        // Check for links
        const links = first.find("a");
        console.log(`\n      Links found: ${links.length}`);
        if (links.length > 0) {
          links.slice(0, 5).each((_, el) => {
            const href = $(el).attr("href");
            const text = $(el).text().trim().substring(0, 40);
            if (href && href.includes("/blog/")) {
              console.log(`         - "${text}..." -> ${href.substring(0, 60)}`);
            }
          });
        }
        
        // Check for author info
        const authorSelectors = [
          ".author",
          "[class*='author']",
          "[data-author]",
          ".byline",
          "[class*='byline']",
          ".writer",
          "[class*='writer']",
        ];
        console.log(`\n      Looking for author...`);
        for (const authSel of authorSelectors) {
          const auth = first.find(authSel);
          if (auth.length > 0) {
            console.log(`         Found with "${authSel}": ${auth.first().text().trim().substring(0, 50)}`);
            break;
          }
        }
        
        // Check for images
        const images = first.find("img");
        console.log(`\n      Images found: ${images.length}`);
        if (images.length > 0) {
          images.slice(0, 3).each((_, el) => {
            const src = $(el).attr("src") || $(el).attr("data-src");
            const alt = $(el).attr("alt") || "";
            if (src && !src.includes("avatar") && !src.includes("icon")) {
              console.log(`         - ${src.substring(0, 60)} (alt: "${alt.substring(0, 30)}")`);
            }
          });
        }
        
        console.log("\n");
        break; // Found containers, stop looking
      }
    }
    
    // Also check page structure
    console.log("📄 Page Structure Analysis:\n");
    console.log(`   Page title: ${$("title").text()}`);
    console.log(`   All <article> tags: ${$("article").length}`);
    console.log(`   All links with '/blog/': ${$("a[href*='/blog/']").length}`);
    console.log(`   All headings (h1-h3): ${$("h1, h2, h3").length}`);
    
    // Save a sample of the HTML for inspection
    const sampleHTML = $.html().substring(0, 5000);
    console.log(`\n📝 HTML Sample (first 5000 chars):\n${sampleHTML}...\n`);
    
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
  }
}

const url = process.argv[2] || "https://web.dev/blog/";
inspectWebsite(url);

