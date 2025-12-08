import { prisma } from "../lib/prisma";
import { websiteConfigs } from "../lib/scraper/configs";

async function updateWebsites() {
  try {
    console.log("🔄 Updating website URLs and selectors...\n");

    for (const [key, config] of Object.entries(websiteConfigs)) {
      // Find website by name
      const website = await prisma.website.findFirst({
        where: { name: config.name },
      });

      if (!website) {
        console.log(`⚠️  ${config.name} not found in database`);
        continue;
      }

      // Update website with new URL and selectors
      const updated = await prisma.website.update({
        where: { id: website.id },
        data: {
          url: config.url,
          selectors: JSON.stringify(config.selectors),
        },
      });

      console.log(`✅ Updated ${config.name}`);
      console.log(`   URL: ${config.url}`);
      console.log(`   Container: ${config.selectors.articleContainer}`);
      console.log(`   Title: ${config.selectors.title}`);
      console.log(`   Author: ${config.selectors.author}`);
      console.log();
    }

    console.log("✅ All websites updated successfully!");
  } catch (error) {
    console.error("❌ Error updating websites:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateWebsites();

