import { prisma } from "../lib/prisma";

async function deleteAhrefs() {
  try {
    console.log("🗑️  Searching for Ahrefs website...");

    // Find all websites with "ahrefs" in name or URL
    // MySQL doesn't support case-insensitive mode directly, so we search for both cases
    const allWebsites = await prisma.website.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            logs: true,
          },
        },
      },
    });

    // Filter for Ahrefs websites (case-insensitive check)
    const ahrefsWebsites = allWebsites.filter(
      (website) =>
        website.name.toLowerCase().includes("ahrefs") ||
        website.url.toLowerCase().includes("ahrefs.com")
    );

    if (ahrefsWebsites.length === 0) {
      console.log("❌ No Ahrefs websites found in the database.");
      return;
    }

    console.log(`\n📊 Found ${ahrefsWebsites.length} Ahrefs website(s):\n`);
    ahrefsWebsites.forEach((website) => {
      console.log(`   - ${website.name} (ID: ${website.id})`);
      console.log(`     URL: ${website.url}`);
      console.log(`     Posts: ${website._count.posts}`);
      console.log(`     Logs: ${website._count.logs}`);
      console.log("");
    });

    // Count total posts that will be deleted
    let totalPosts = 0;
    for (const website of ahrefsWebsites) {
      totalPosts += website._count.posts;
    }

    console.log(`⚠️  This will delete ${ahrefsWebsites.length} website(s) and ${totalPosts} post(s).`);
    console.log("🗑️  Deleting Ahrefs website(s) and all associated posts...\n");

    // Delete all Ahrefs websites (posts will be cascade deleted)
    for (const website of ahrefsWebsites) {
      await prisma.website.delete({
        where: { id: website.id },
      });
      console.log(`✓ Deleted ${website.name} (${website._count.posts} posts removed)`);
    }

    console.log(`\n✅ Successfully deleted ${ahrefsWebsites.length} Ahrefs website(s) and ${totalPosts} post(s)!`);
  } catch (error) {
    console.error("❌ Error deleting Ahrefs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAhrefs();

