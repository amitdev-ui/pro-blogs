import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log("🔍 Checking database connection...");
    
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connection successful!");
    
    // Check if tables exist by trying to count
    const websiteCount = await prisma.website.count().catch(() => null);
    const postCount = await prisma.post.count().catch(() => null);
    
    if (websiteCount !== null && postCount !== null) {
      console.log(`✅ Database is set up correctly!`);
      console.log(`   - Websites: ${websiteCount}`);
      console.log(`   - Posts: ${postCount}`);
    } else {
      console.log("⚠️  Database tables may not exist. Run migrations:");
      console.log("   npx prisma migrate dev");
    }
    
  } catch (error: any) {
    console.error("❌ Database connection failed!");
    console.error("\nError details:", error.message);
    console.error("\nPlease check:");
    console.error("1. MySQL/XAMPP MySQL is running");
    console.error("2. DATABASE_URL in .env file is correct");
    console.error("3. Database name exists in MySQL");
    console.error("\nExample DATABASE_URL:");
    console.error('   DATABASE_URL="mysql://root:@localhost:3306/blogs_scraper"');
    
    if (error.message.includes("Unknown database")) {
      console.error("\n💡 The database doesn't exist. Create it in MySQL:");
      console.error("   CREATE DATABASE blogs_scraper;");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

