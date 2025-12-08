"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Activity, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Schedule {
  websiteId: string;
  websiteName: string;
  schedule?: string;
  lastRun?: string;
  nextRun?: string;
  runCount?: number;
}

interface Post {
  id: string;
  title: string;
  category: string | null;
  date: Date;
  website: {
    name: string;
  };
}

export default function SchedulePage() {
  const [activeSchedules, setActiveSchedules] = useState<Schedule[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActiveSchedules();
    fetchRecentPosts();
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      fetchActiveSchedules();
      fetchRecentPosts();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSchedules = async () => {
    try {
      const response = await fetch("/api/admin/schedule");
      const data = await response.json();
      setActiveSchedules(data.schedules || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts?limit=12");
      const data = await response.json();
      setRecentPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Not run yet";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getNextRunTimes = () => {
    const now = new Date();
    const times = [];
    for (let i = 0; i < 12; i++) {
      const nextRun = new Date(now);
      nextRun.setHours(nextRun.getHours() + (i * 2), 0, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
        nextRun.setHours(i * 2, 0, 0, 0);
      }
      times.push(nextRun);
    }
    return times;
  };

  const groupPostsByCategory = () => {
    const grouped: Record<string, Post[]> = {};
    recentPosts.forEach((post) => {
      const category = post.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(post);
    });
    return grouped;
  };

  const groupedPosts = groupPostsByCategory();
  const nextRuns = getNextRunTimes();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Automatic Scraper</h1>
        <p className="text-[#6B7280] mt-1">
          Your scraper runs automatically every 2 hours - no setup needed!
        </p>
      </div>

      {/* Auto-Run Status */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✓ Auto-Scraper is Active
              </h3>
              <p className="text-sm text-green-800 mb-3">
                The scraper automatically runs every 2 hours to fetch new content from all your websites.
                No manual intervention needed!
              </p>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-xs font-medium text-green-900 mb-2">Next scheduled runs:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {nextRuns.slice(0, 8).map((time, idx) => (
                    <div key={idx} className="text-xs text-green-700">
                      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Info */}
      {activeSchedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Schedule Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSchedules.map((schedule) => {
                const formatDate = (dateStr?: string) => {
                  if (!dateStr) return "Not run yet";
                  try {
                    const date = new Date(dateStr);
                    return date.toLocaleString();
                  } catch {
                    return dateStr;
                  }
                };

                return (
                  <div
                    key={schedule.websiteId}
                    className="p-4 border border-[#E5E7EB] rounded-lg bg-[#F9FAFB]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-[#111827]">
                            {schedule.websiteName}
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            Last run: {formatDate(schedule.lastRun)} • 
                            Next run: {formatDate(schedule.nextRun)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#111827]">
                          {schedule.runCount || 0} runs
                        </p>
                        <p className="text-xs text-[#6B7280]">completed</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scraped Blogs by Category */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#111827]">Recently Scraped Blogs</h2>
          <Link
            href="/admin/posts"
            className="text-sm text-[#111827] hover:text-[#111827]/80 flex items-center gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentPosts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-[#6B7280] mx-auto mb-4" />
              <p className="text-[#6B7280]">No posts scraped yet</p>
              <p className="text-sm text-[#6B7280] mt-2">
                The scraper will automatically fetch content every 2 hours
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPosts).map(([category, posts]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>
                    {posts.length} {posts.length === 1 ? "post" : "posts"} in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.slice(0, 6).map((post) => (
                      <Link
                        key={post.id}
                        href={`/admin/posts/${post.id}`}
                        className="p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                      >
                        <h4 className="font-medium text-[#111827] text-sm line-clamp-2 mb-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-[#6B7280]">
                          {post.website.name} • {formatDate(post.date.toString())}
                        </p>
                      </Link>
                    ))}
                  </div>
                  {posts.length > 6 && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/admin/posts?category=${encodeURIComponent(category)}`}
                        className="text-sm text-[#111827] hover:text-[#111827]/80"
                      >
                        View {posts.length - 6} more {category} posts →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Info */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[#6B7280]">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-[#111827] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#111827] mb-1">Automatic Every 2 Hours</p>
              <p>
                The scraper automatically runs every 2 hours (12:00 AM, 2:00 AM, 4:00 AM, 6:00 AM, 8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM, 8:00 PM, 10:00 PM).
                All your websites are scraped sequentially (one by one) to ensure proper processing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#111827] mb-1">No Manual Setup Required</p>
              <p>
                Once your server is running, the scraper starts automatically. You don&apos;t need to visit this page or configure anything.
                Just keep your server running and new content will appear automatically.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-[#111827] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[#111827] mb-1">Check Your Posts</p>
              <p>
                View all scraped posts in <Link href="/admin/posts" className="text-[#111827] hover:underline font-medium">Posts</Link> section.
                New content appears automatically after each scraping cycle.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
