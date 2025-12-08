import { prisma } from "../lib/prisma";
import { websiteConfigs } from "../lib/scraper/configs";

async function seedWebsites() {
  try {
    console.log("🌱 Seeding websites...");

    for (const [key, config] of Object.entries(websiteConfigs)) {
      // Check if website already exists
      const existing = await prisma.website.findFirst({
        where: { url: config.url },
      });

      if (existing) {
        console.log(`✓ ${config.name} already exists`);
        continue;
      }

      // Create website
      const website = await prisma.website.create({
        data: {
          name: config.name,
          url: config.url,
          selectors: JSON.stringify(config.selectors),
        },
      });

      console.log(`✓ Created ${config.name} (ID: ${website.id})`);
    }

    console.log("\n✅ All websites seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding websites:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedWebsites();

