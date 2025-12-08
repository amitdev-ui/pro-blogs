import { prisma } from "../lib/prisma";

async function countBlogsByWebsite() {
  try {
    console.log("\n📊 Blog Count by Website\n");
    console.log("=" .repeat(60));

    // Get all websites
    const websites = await prisma.website.findMany({
      orderBy: { name: "asc" },
    });

    if (websites.length === 0) {
      console.log("No websites found in the database.");
      return;
    }

    // Get post counts per website
    const postCounts = await prisma.post.groupBy({
      by: ["websiteId"],
      _count: {
        id: true,
      },
    });

    // Create a map for quick lookup
    const countMap = new Map<string, number>();
    postCounts.forEach((item) => {
      countMap.set(item.websiteId, item._count.id);
    });

    // Display results
    let totalBlogs = 0;
    const results: Array<{ name: string; url: string; count: number }> = [];

    websites.forEach((website) => {
      const count = countMap.get(website.id) || 0;
      totalBlogs += count;
      results.push({
        name: website.name,
        url: website.url,
        count: count,
      });
    });

    // Sort by count (descending)
    results.sort((a, b) => b.count - a.count);

    // Display formatted results
    console.log("\nWebsite Name".padEnd(30) + "Blogs Scraped".padEnd(20) + "URL");
    console.log("-".repeat(60));

    results.forEach((result) => {
      const name = result.name.padEnd(30);
      const count = result.count.toString().padEnd(20);
      console.log(`${name}${count}${result.url}`);
    });

    console.log("-".repeat(60));
    console.log(`\nTotal Websites: ${websites.length}`);
    console.log(`Total Blogs Scraped: ${totalBlogs}`);
    console.log("\n" + "=".repeat(60) + "\n");

    // Also show websites with 0 blogs
    const websitesWithNoBlogs = results.filter((r) => r.count === 0);
    if (websitesWithNoBlogs.length > 0) {
      console.log("⚠️  Websites with no blogs scraped yet:");
      websitesWithNoBlogs.forEach((website) => {
        console.log(`   - ${website.name} (${website.url})`);
      });
      console.log();
    }
  } catch (error) {
    console.error("Error counting blogs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
countBlogsByWebsite();

