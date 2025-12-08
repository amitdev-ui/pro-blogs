import { prisma } from "../lib/prisma";
import { BlogScraper } from "../lib/scraper";
import { fetchHTML } from "../lib/scraper/utils";
import * as cheerio from "cheerio";

async function testWebsiteSelectors(websiteName?: string) {
  try {
    console.log("🧪 Testing Website Selectors...\n");

    let websites;
    if (websiteName) {
      const allWebsites = await prisma.website.findMany({
        orderBy: { name: "asc" },
      });
      websites = allWebsites.filter(w => 
        w.name.toLowerCase().includes(websiteName.toLowerCase())
      );
    } else {
      // Test all websites that have 0 posts scraped
      websites = await prisma.website.findMany({
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
      
      // Filter to websites with 0 posts
      websites = websites.filter(w => w._count.posts === 0);
    }

    if (websites.length === 0) {
      console.log("❌ No websites found to test");
      return;
    }

    for (const website of websites) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📋 Testing: ${website.name}`);
      console.log(`🔗 URL: ${website.url}`);
      console.log(`${"=".repeat(80)}\n`);

      // Parse selectors
      let selectors;
      try {
        selectors =
          typeof website.selectors === "string"
            ? JSON.parse(website.selectors)
            : website.selectors;
      } catch (error) {
        console.log(`❌ Error parsing selectors: ${error}`);
        continue;
      }

      console.log("📝 Configured Selectors:");
      console.log(JSON.stringify(selectors, null, 2));
      console.log("");

      // Fetch HTML and analyze
      try {
        console.log("🌐 Fetching HTML...");
        const html = await fetchHTML(website.url);
        const $ = cheerio.load(html);
        console.log(`✅ HTML fetched: ${html.length} characters\n`);

        // Test article container selector
        console.log("🔍 Testing Article Container Selector:");
        const containers = $(selectors.articleContainer || "article");
        console.log(`   Selector: "${selectors.articleContainer || "article"}"`);
        console.log(`   Found: ${containers.length} containers\n`);

        if (containers.length === 0) {
          console.log("⚠️  No containers found with primary selector. Testing fallbacks...");
          const fallbackSelectors = ["article", ".post", ".card", "[class*='post']", "[class*='card']"];
          for (const selector of fallbackSelectors) {
            const testContainers = $(selector);
            console.log(`   "${selector}": ${testContainers.length} found`);
            if (testContainers.length > 0) {
              console.log(`   ✅ Found ${testContainers.length} with fallback selector!`);
              break;
            }
          }
          console.log("");
        }

        // Test title selector on first container
        if (containers.length > 0) {
          const firstContainer = containers.first();
          console.log("📰 Testing on First Container:");
          
          const title = firstContainer.find(selectors.title || "h1, h2, h3").first().text().trim();
          console.log(`   Title selector: "${selectors.title || "h1, h2, h3"}"`);
          console.log(`   Title found: "${title.substring(0, 60)}${title.length > 60 ? "..." : ""}"`);
          
          const link = firstContainer.find(selectors.link || "a").first().attr("href");
          console.log(`   Link selector: "${selectors.link || "a"}"`);
          console.log(`   Link found: ${link ? link.substring(0, 60) + (link.length > 60 ? "..." : "") : "NOT FOUND"}`);
          
          const author = firstContainer.find(selectors.author || "").first().text().trim();
          console.log(`   Author selector: "${selectors.author || ""}"`);
          console.log(`   Author found: "${author || "NOT FOUND"}"`);
          
          const image = firstContainer.find(selectors.image || "img").first().attr("src");
          console.log(`   Image selector: "${selectors.image || "img"}"`);
          console.log(`   Image found: ${image ? "YES" : "NOT FOUND"}`);
          
          console.log("");
        }

        // Now test actual scraper
        console.log("🔄 Testing Actual Scraper...");
        const config = {
          name: website.name,
          url: website.url,
          selectors,
          pagination: {
            type: "next-page" as const,
            maxPages: 1, // Just test first page
          },
        };

        const scraper = new BlogScraper(config);
        const posts = await scraper.scrapePage(website.url);
        
        console.log(`\n📊 Scraper Results:`);
        console.log(`   Posts found: ${posts.length}`);
        
        if (posts.length > 0) {
          console.log(`\n   Sample Post:`);
          const sample = posts[0];
          console.log(`   - Title: ${sample.title.substring(0, 60)}...`);
          console.log(`   - Slug: ${sample.slug}`);
          console.log(`   - Link: ${sample.sourceUrl || "N/A"}`);
          console.log(`   - Author: ${sample.author || "N/A"}`);
          console.log(`   - Has Image: ${sample.thumbnail || sample.coverImage ? "YES" : "NO"}`);
        } else {
          console.log(`\n❌ No posts found! This website needs selector updates.`);
        }
      } catch (error) {
        console.error(`❌ Error testing website: ${error}`);
        if (error instanceof Error) {
          console.error(`   Message: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get website name from command line args
const websiteName = process.argv[2];
testWebsiteSelectors(websiteName);

