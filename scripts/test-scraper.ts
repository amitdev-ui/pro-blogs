import { prisma } from "../lib/prisma";
import { BlogScraper } from "../lib/scraper";

async function testScraper() {
  try {
    console.log("🧪 Testing Scraper System...\n");

    // Get first website
    const website = await prisma.website.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!website) {
      console.log("❌ No websites found in database");
      console.log("💡 Run 'npm run seed' to add websites");
      process.exit(1);
    }

    console.log(`📋 Testing with: ${website.name}`);
    console.log(`🔗 URL: ${website.url}\n`);

    // Parse selectors
    const selectors =
      typeof website.selectors === "string"
        ? JSON.parse(website.selectors)
        : website.selectors;

    // Create scraper
    const config = {
      name: website.name,
      url: website.url,
      selectors,
    };

    const scraper = new BlogScraper(config);

    console.log("🔄 Starting scrape...\n");
    const startTime = Date.now();

    // Scrape the website
    const posts = await scraper.scrapePage(website.url);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ Scraping completed in ${duration}s\n`);
    console.log(`📊 Results:`);
    console.log(`   - Posts found: ${posts.length}\n`);

    if (posts.length > 0) {
      console.log("📝 Sample posts:");
      posts.slice(0, 3).forEach((post, index) => {
        console.log(`\n   ${index + 1}. ${post.title}`);
        console.log(`      Author: ${post.author}`);
        console.log(`      Date: ${post.date.toISOString().split("T")[0]}`);
        console.log(`      Slug: ${post.slug}`);
        if (post.thumbnail) {
          console.log(`      Thumbnail: ${post.thumbnail.substring(0, 50)}...`);
        }
      });

      console.log("\n✅ Scraper is working correctly!");
    } else {
      console.log("⚠️  No posts found. This could mean:");
      console.log("   - The selectors need adjustment");
      console.log("   - The website structure has changed");
      console.log("   - The website is blocking requests");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("\n❌ Scraper test failed:");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testScraper();

