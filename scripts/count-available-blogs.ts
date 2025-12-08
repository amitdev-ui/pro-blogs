import { prisma } from "../lib/prisma";
import { BlogScraper } from "../lib/scraper";

async function countAvailableBlogs() {
  try {
    console.log("\n🌐 Checking Available Blogs on Target Websites\n");
    console.log("=".repeat(80));

    // Get all websites
    const websites = await prisma.website.findMany({
      orderBy: { name: "asc" },
    });

    if (websites.length === 0) {
      console.log("No websites found in the database.");
      return;
    }

    // Get post counts per website (already scraped)
    const postCounts = await prisma.post.groupBy({
      by: ["websiteId"],
      _count: {
        id: true,
      },
    });

    const scrapedCountMap = new Map<string, number>();
    postCounts.forEach((item) => {
      scrapedCountMap.set(item.websiteId, item._count.id);
    });

    const results: Array<{
      name: string;
      url: string;
      available: number;
      scraped: number;
      remaining: number;
      status: string;
    }> = [];

    console.log("\n⏳ Scraping websites to count available blogs...\n");

    // Check each website
    for (let i = 0; i < websites.length; i++) {
      const website = websites[i];
      const scraped = scrapedCountMap.get(website.id) || 0;

      console.log(`[${i + 1}/${websites.length}] Checking ${website.name}...`);

      try {
        // Parse selectors
        let selectors;
        try {
          selectors =
            typeof website.selectors === "string"
              ? JSON.parse(website.selectors)
              : website.selectors;
        } catch (parseError) {
          console.error(`  ❌ Error parsing selectors for ${website.name}`);
          results.push({
            name: website.name,
            url: website.url,
            available: 0,
            scraped: scraped,
            remaining: 0,
            status: "Error: Invalid selectors",
          });
          continue;
        }

        // Create scraper config
        const config = {
          name: website.name,
          url: website.url,
          selectors,
          pagination: {
            type: "next-page" as const,
            maxPages: 10, // Limit to 10 pages for faster checking
          },
        };

        const scraper = new BlogScraper(config);
        const posts = await scraper.scrapePage(website.url);

        const available = posts.length;
        const remaining = Math.max(0, available - scraped);

        let status = "✅ OK";
        if (available === 0) {
          status = "⚠️  No posts found";
        } else if (remaining > 0) {
          status = `📥 ${remaining} new posts available`;
        } else if (scraped >= available) {
          status = "✅ All scraped";
        }

        results.push({
          name: website.name,
          url: website.url,
          available: available,
          scraped: scraped,
          remaining: remaining,
          status: status,
        });

        console.log(
          `  ${status} - Found ${available} posts (${scraped} already scraped)`
        );
      } catch (error) {
        console.error(`  ❌ Error: ${error}`);
        results.push({
          name: website.name,
          url: website.url,
          available: 0,
          scraped: scraped,
          remaining: 0,
          status: `Error: ${String(error).substring(0, 30)}...`,
        });
      }

      // Small delay between websites
      if (i < websites.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Display results
    console.log("\n" + "=".repeat(80));
    console.log("\n📊 SUMMARY\n");
    console.log(
      "Website Name".padEnd(30) +
        "Available".padEnd(15) +
        "Scraped".padEnd(15) +
        "Remaining".padEnd(15) +
        "Status"
    );
    console.log("-".repeat(80));

    let totalAvailable = 0;
    let totalScraped = 0;
    let totalRemaining = 0;

    results.forEach((result) => {
      totalAvailable += result.available;
      totalScraped += result.scraped;
      totalRemaining += result.remaining;

      const name = result.name.substring(0, 28).padEnd(30);
      const available = result.available.toString().padEnd(15);
      const scraped = result.scraped.toString().padEnd(15);
      const remaining = result.remaining.toString().padEnd(15);

      console.log(`${name}${available}${scraped}${remaining}${result.status}`);
    });

    console.log("-".repeat(80));
    console.log(
      "TOTAL".padEnd(30) +
        totalAvailable.toString().padEnd(15) +
        totalScraped.toString().padEnd(15) +
        totalRemaining.toString().padEnd(15)
    );

    console.log("\n" + "=".repeat(80));
    console.log(`\n📈 Total Available Blogs: ${totalAvailable}`);
    console.log(`📥 Total Scraped: ${totalScraped}`);
    console.log(`🔄 Remaining to Scrape: ${totalRemaining}`);
    console.log(
      `\n💡 Note: This count is based on the first 10 pages of each website.\n`
    );
  } catch (error) {
    console.error("Error counting available blogs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
countAvailableBlogs();

