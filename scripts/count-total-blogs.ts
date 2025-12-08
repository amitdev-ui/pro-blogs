import { prisma } from "../lib/prisma";
import axios from "axios";
import * as cheerio from "cheerio";

// Known estimates for major websites
const websiteEstimates: Record<string, { estimate: string; source: string }> = {
  "TechCrunch": {
    estimate: "220,000 - 360,000",
    source: "Based on 30-50 articles/day since 2005",
  },
};

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

async function fetchSitemap(url: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  
  try {
    // Try common sitemap locations
    const sitemapUrls = [
      `${url}/sitemap.xml`,
      `${url}/sitemap_index.xml`,
      `${url}/sitemaps/sitemap.xml`,
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        console.log(`  Trying: ${sitemapUrl}`);
        const response = await axios.get(sitemapUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 30000,
        });

        const $ = cheerio.load(response.data, { xmlMode: true });

        // Check if it's a sitemap index (contains other sitemaps)
        const sitemapIndex = $("sitemapindex > sitemap");
        if (sitemapIndex.length > 0) {
          console.log(`  Found sitemap index with ${sitemapIndex.length} sitemaps`);
          // For now, just count the sitemaps (could recursively fetch each)
          sitemapIndex.each((_, el) => {
            const loc = $(el).find("loc").text().trim();
            if (loc) {
              urls.push({ loc });
            }
          });
          return urls; // Return sitemap count for now
        }

        // Regular sitemap with URLs
        const urlElements = $("urlset > url");
        console.log(`  Found ${urlElements.length} URLs in sitemap`);
        
        urlElements.each((_, el) => {
          const loc = $(el).find("loc").text().trim();
          const lastmod = $(el).find("lastmod").text().trim();
          if (loc) {
            urls.push({ loc, lastmod: lastmod || undefined });
          }
        });

        if (urls.length > 0) {
          return urls;
        }
      } catch (error: any) {
        // Continue to next sitemap URL
        if (error.response?.status !== 404) {
          console.log(`  Error: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.log(`  Could not fetch sitemap`);
  }

  return urls;
}

async function countTotalBlogs() {
  try {
    console.log("\n📊 Total Blog Count Analysis\n");
    console.log("=".repeat(80));

    // Get all websites
    const websites = await prisma.website.findMany({
      orderBy: { name: "asc" },
    });

    if (websites.length === 0) {
      console.log("No websites found in the database.");
      return;
    }

    // Get scraped counts
    const postCounts = await prisma.post.groupBy({
      by: ["websiteId"],
      _count: { id: true },
    });

    const scrapedCountMap = new Map<string, number>();
    postCounts.forEach((item) => {
      scrapedCountMap.set(item.websiteId, item._count.id);
    });

    const results: Array<{
      name: string;
      url: string;
      scraped: number;
      sitemapCount?: number;
      estimate?: string;
      source?: string;
      status: string;
    }> = [];

    console.log("\n🔍 Analyzing websites...\n");

    for (let i = 0; i < websites.length; i++) {
      const website = websites[i];
      const scraped = scrapedCountMap.get(website.id) || 0;

      console.log(`[${i + 1}/${websites.length}] ${website.name}`);
      console.log(`  URL: ${website.url}`);
      console.log(`  Already scraped: ${scraped} posts`);

      // Check for known estimates
      const estimate = websiteEstimates[website.name];
      
      // Extract root domain for sitemap checking
      let rootUrl = website.url;
      try {
        const urlObj = new URL(website.url);
        rootUrl = `${urlObj.protocol}//${urlObj.host}`;
      } catch {
        // Keep original URL if parsing fails
      }
      
      // Try to fetch sitemap from root domain
      console.log(`  Checking sitemap at root domain: ${rootUrl}...`);
      const sitemapUrls = await fetchSitemap(rootUrl);
      
      let status = "✅";
      let sitemapCount: number | undefined;
      let estimateText: string | undefined;
      let sourceText: string | undefined;

      if (sitemapUrls.length > 0) {
        // Filter to blog/article URLs (heuristic: contains common blog patterns)
        const blogUrls = sitemapUrls.filter((url) => {
          const loc = url.loc.toLowerCase();
          return (
            loc.includes("/article") ||
            loc.includes("/post") ||
            loc.includes("/blog") ||
            loc.includes("/news") ||
            loc.includes("/story") ||
            loc.match(/\d{4}\/\d{2}\//) || // Date pattern
            loc.match(/\/\d{4}\//) // Year pattern
          );
        });

        sitemapCount = blogUrls.length > 0 ? blogUrls.length : sitemapUrls.length;
        console.log(`  📄 Sitemap found: ${sitemapUrls.length} total URLs`);
        console.log(`  📝 Estimated blog URLs: ${sitemapCount}`);
        
        if (sitemapCount > scraped) {
          status = `📥 ${sitemapCount - scraped} more available`;
        } else if (sitemapCount === scraped) {
          status = "✅ All scraped";
        }
      } else {
        console.log(`  ⚠️  No sitemap found`);
        status = "⚠️  No sitemap";
      }

      // Add estimate if available
      if (estimate) {
        estimateText = estimate.estimate;
        sourceText = estimate.source;
        console.log(`  📊 Known estimate: ${estimate.estimate} (${estimate.source})`);
        
        if (!sitemapCount) {
          status = `📊 Estimate: ${estimate.estimate}`;
        }
      }

      results.push({
        name: website.name,
        url: website.url,
        scraped: scraped,
        sitemapCount: sitemapCount,
        estimate: estimateText,
        source: sourceText,
        status: status,
      });

      // Delay between websites
      if (i < websites.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      console.log();
    }

    // Display results
    console.log("=".repeat(80));
    console.log("\n📊 SUMMARY\n");
    console.log(
      "Website Name".padEnd(25) +
        "Scraped".padEnd(12) +
        "Sitemap".padEnd(12) +
        "Estimate".padEnd(20) +
        "Status"
    );
    console.log("-".repeat(80));

    let totalScraped = 0;
    let totalSitemap = 0;

    results.forEach((result) => {
      totalScraped += result.scraped;
      if (result.sitemapCount) {
        totalSitemap += result.sitemapCount;
      }

      const name = result.name.substring(0, 23).padEnd(25);
      const scraped = result.scraped.toString().padEnd(12);
      const sitemap = result.sitemapCount
        ? result.sitemapCount.toLocaleString().padEnd(12)
        : "N/A".padEnd(12);
      const estimate = result.estimate
        ? result.estimate.padEnd(20)
        : "N/A".padEnd(20);

      console.log(`${name}${scraped}${sitemap}${estimate}${result.status}`);
    });

    console.log("-".repeat(80));
    console.log(
      "TOTAL".padEnd(25) +
        totalScraped.toString().padEnd(12) +
        (totalSitemap > 0 ? totalSitemap.toLocaleString().padEnd(12) : "N/A".padEnd(12))
    );

    console.log("\n" + "=".repeat(80));
    console.log("\n📈 Key Findings:\n");

    results.forEach((result) => {
      if (result.estimate) {
        console.log(`  ${result.name}:`);
        console.log(`    Estimated Total: ${result.estimate}`);
        console.log(`    Source: ${result.source}`);
        console.log(`    Currently Scraped: ${result.scraped.toLocaleString()}`);
        if (result.sitemapCount) {
          console.log(`    Sitemap URLs: ${result.sitemapCount.toLocaleString()}`);
        }
        console.log();
      }
    });

    console.log("\n💡 Notes:");
    console.log("  - Sitemap counts may include non-blog URLs");
    console.log("  - Some websites may not have public sitemaps");
    console.log("  - Estimates are based on published research/data");
    console.log("  - Actual counts may vary\n");
  } catch (error) {
    console.error("Error counting total blogs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
countTotalBlogs();

