import { prisma } from "../lib/prisma";

async function checkReadyWebsites() {
  try {
    console.log("\n📋 Checking Websites Ready to Scrape...\n");

    const websites = await prisma.website.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            posts: true,
            logs: true,
          },
        },
      },
    });

    if (websites.length === 0) {
      console.log("❌ No websites found in database");
      console.log("💡 Run 'npm run seed' to add websites");
      return;
    }

    console.log(`Found ${websites.length} website(s):\n`);
    console.log("=".repeat(80));

    const readyWebsites: typeof websites = [];
    const notReadyWebsites: Array<{ website: typeof websites[0]; reason: string }> = [];

    for (const website of websites) {
      let selectorsValid = false;
      let reason = "";

      try {
        const selectors =
          typeof website.selectors === "string"
            ? JSON.parse(website.selectors)
            : website.selectors;

        if (!selectors || typeof selectors !== "object") {
          reason = "Invalid selectors format";
        } else if (!selectors.articleContainer || !selectors.title || !selectors.link) {
          reason = "Missing required selectors (articleContainer, title, or link)";
        } else {
          selectorsValid = true;
        }
      } catch (parseError) {
        reason = `Error parsing selectors: ${parseError instanceof Error ? parseError.message : "Unknown error"}`;
      }

      if (selectorsValid) {
        readyWebsites.push(website);
      } else {
        notReadyWebsites.push({ website, reason });
      }
    }

    // Display ready websites
    if (readyWebsites.length > 0) {
      console.log("\n✅ READY TO SCRAPE:\n");
      readyWebsites.forEach((website, index) => {
        console.log(`${index + 1}. ${website.name}`);
        console.log(`   URL: ${website.url}`);
        console.log(`   ID: ${website.id}`);
        console.log(`   Posts already scraped: ${website._count.posts}`);
        console.log(`   Logs: ${website._count.logs}`);
        console.log("");
      });
    }

    // Display not ready websites
    if (notReadyWebsites.length > 0) {
      console.log("\n❌ NOT READY:\n");
      notReadyWebsites.forEach((item, index) => {
        console.log(`${index + 1}. ${item.website.name}`);
        console.log(`   URL: ${item.website.url}`);
        console.log(`   Reason: ${item.reason}`);
        console.log("");
      });
    }

    console.log("=".repeat(80));
    console.log(`\nSummary: ${readyWebsites.length} ready, ${notReadyWebsites.length} not ready\n`);
  } catch (error) {
    console.error("❌ Error checking websites:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReadyWebsites();

