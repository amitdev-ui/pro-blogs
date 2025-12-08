import { prisma } from "../lib/prisma";
import { BlogScraper } from "../lib/scraper";

async function testAllWebsites() {
  try {
    console.log("🧪 Testing All Websites with Updated URLs and Selectors...\n");

    const websites = await prisma.website.findMany({
      orderBy: { name: "asc" },
    });

    const results: Array<{
      name: string;
      url: string;
      postsFound: number;
      hasAuthor: boolean;
      hasImages: boolean;
      hasContent: boolean;
      sampleTitle?: string;
    }> = [];

    for (const website of websites) {
      console.log(`\n📋 Testing: ${website.name}`);
      console.log(`🔗 URL: ${website.url}`);

      try {
        const selectors =
          typeof website.selectors === "string"
            ? JSON.parse(website.selectors)
            : website.selectors;

        const config = {
          name: website.name,
          url: website.url,
          selectors,
        };

        const scraper = new BlogScraper(config);
        const posts = await scraper.scrapePage(website.url);

        console.log(`   Posts found: ${posts.length}`);

        if (posts.length > 0) {
          const firstPost = posts[0];
          console.log(`   ✅ Sample: ${firstPost.title.substring(0, 60)}...`);
          console.log(`   Author: ${firstPost.author !== "Unknown" ? "✅ " + firstPost.author : "❌ Unknown"}`);
          console.log(`   Thumbnail: ${firstPost.thumbnail ? "✅ Yes" : "❌ No"}`);
          console.log(`   Link: ${firstPost.sourceUrl}`);

          // Try scraping full content
          if (firstPost.sourceUrl && firstPost.sourceUrl !== website.url) {
            const fullContent = await scraper.scrapeFullPost(firstPost.sourceUrl);
            console.log(`   Full Content: ${fullContent ? `✅ ${fullContent.length} chars` : "❌ No"}`);
          }

          results.push({
            name: website.name,
            url: website.url,
            postsFound: posts.length,
            hasAuthor: firstPost.author !== "Unknown",
            hasImages: !!firstPost.thumbnail,
            hasContent: false, // Will be updated if full content works
            sampleTitle: firstPost.title,
          });
        } else {
          console.log(`   ⚠️  No posts found`);
          results.push({
            name: website.name,
            url: website.url,
            postsFound: 0,
            hasAuthor: false,
            hasImages: false,
            hasContent: false,
          });
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error}`);
        results.push({
          name: website.name,
          url: website.url,
          postsFound: 0,
          hasAuthor: false,
          hasImages: false,
          hasContent: false,
        });
      }
    }

    // Summary
    console.log("\n\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60) + "\n");

    results.forEach((result) => {
      console.log(`${result.name}:`);
      console.log(`   Posts: ${result.postsFound > 0 ? "✅ " + result.postsFound : "❌ 0"}`);
      console.log(`   Author: ${result.hasAuthor ? "✅" : "❌"}`);
      console.log(`   Images: ${result.hasImages ? "✅" : "❌"}`);
      if (result.sampleTitle) {
        console.log(`   Sample: ${result.sampleTitle.substring(0, 50)}...`);
      }
      console.log();
    });

    const successCount = results.filter((r) => r.postsFound > 0).length;
    console.log(`\n✅ ${successCount}/${results.length} websites working correctly`);

    await prisma.$disconnect();
  } catch (error) {
    console.error("\n❌ Error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testAllWebsites();

