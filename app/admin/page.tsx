import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

async function getStats() {
  try {
    const [websiteCount, postCount, logCount, latestLog] = await Promise.all([
      prisma.website.count().catch(() => 0),
      prisma.post.count().catch(() => 0),
      prisma.log.count().catch(() => 0),
      prisma.log.findFirst({
        orderBy: { createdAt: "desc" },
        include: { website: true },
      }).catch(() => null),
    ]);

    return {
      websiteCount,
      postCount,
      logCount,
      latestLog,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      websiteCount: 0,
      postCount: 0,
      logCount: 0,
      latestLog: null,
    };
  }
}

async function getPostsByWebsite() {
  try {
    const posts = await prisma.post.groupBy({
      by: ["websiteId"],
      _count: {
        id: true,
      },
    }).catch(() => []);

    if (posts.length === 0) return [];

    const websites = await prisma.website.findMany({
      where: {
        id: {
          in: posts.map((p) => p.websiteId),
        },
      },
    }).catch(() => []);

    return posts.map((post: { websiteId: string; _count: { id: number } }) => {
      const website = websites.find((w: { id: string }) => w.id === post.websiteId);
      return {
        websiteName: website?.name || "Unknown",
        count: post._count.id,
      };
    });
  } catch (error) {
    console.error("Error fetching posts by website:", error);
    return [];
  }
}

async function getLatestPosts() {
  try {
    return await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        date: true,
        website: {
          select: {
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching latest posts:", error);
    return [];
  }
}

async function getLatestLogs() {
  try {
    return await prisma.log.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        website: {
          select: {
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching latest logs:", error);
    return [];
  }
}

export default async function AdminDashboard() {
  // Run all queries in parallel for better performance
  const [stats, postsByWebsite, latestPosts, latestLogs] = await Promise.all([
    getStats(),
    getPostsByWebsite(),
    getLatestPosts(),
    getLatestLogs(),
  ]);

  // Check if database connection is working (with timeout)
  let dbConnected = true;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout")), 2000)
      ),
    ]);
  } catch (error) {
    dbConnected = false;
    console.error("Database connection failed:", error);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Dashboard</h1>
        <p className="text-[#6B7280] mt-1">
          Overview of your scraper system
        </p>
      </div>

      {/* Database Connection Warning */}
      {!dbConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
            <p className="text-sm font-medium text-red-800">
              Database Connection Error
            </p>
          </div>
          <p className="text-sm text-red-700 mt-2">
            Cannot connect to database at localhost:3306. Please ensure:
          </p>
          <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
            <li>MySQL/XAMPP MySQL service is running</li>
            <li>DATABASE_URL is correctly set in .env file</li>
            <li>Database credentials are correct</li>
          </ul>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Websites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#111827]">
              {stats.websiteCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#111827]">
              {stats.postCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#111827]">
              {stats.logCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Scraper Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-[#111827]">Idle</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts by Website */}
      <Card>
        <CardHeader>
          <CardTitle>Posts Scraped per Website</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {postsByWebsite.length > 0 ? (
              postsByWebsite.map((item: { websiteName: string; count: number }, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0"
                >
                  <span className="text-sm text-[#111827]">
                    {item.websiteName}
                  </span>
                  <span className="text-sm font-medium text-[#6B7280]">
                    {item.count} posts
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6B7280]">No posts scraped yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Latest Posts and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Scraped Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestPosts.length > 0 ? (
                latestPosts.map((post: { id: string; title: string; website: { name: string }; date: Date }) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 pb-3 border-b border-[#E5E7EB] last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-sm font-medium text-[#111827] hover:text-[#111827]/80 line-clamp-2"
                      >
                        {post.title}
                      </Link>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {post.website.name} • {formatDate(post.date.toString())}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">No posts yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Latest Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {latestLogs.length > 0 ? (
                latestLogs.map((log: { id: string; message: string; status: string; website: { name: string }; createdAt: Date }) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 pb-3 border-b border-[#E5E7EB] last:border-0 last:pb-0"
                  >
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 ${
                        log.status === "success"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111827] line-clamp-2">
                        {log.message}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {log.website.name} •{" "}
                        {formatDate(log.createdAt.toString())}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">No logs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

