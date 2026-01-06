"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, FileText, Calendar, User, Globe, Tag, Image as ImageIcon, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  sourceUrl: string | null;
  category: string | null;
  tags: string[];
  readingTime: string | null;
  thumbnail: string | null;
  coverImage: string | null;
  websiteName: string;
  websiteUrl: string;
  wordCount: number;
  charCount: number;
  headingCount: number;
  seoScore: number;
}

export default function AllBlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  const fetchAllBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/all-blogs");
      const data = await response.json();

      if (data.success) {
        setAllPosts(data.posts || []);
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPosts(allPosts);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/all-blogs?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        if (data.success) {
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error("Error searching blogs:", error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allPosts]);

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-blue-600 bg-blue-50";
    if (score >= 40) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">All Blogs</h1>
        <p className="text-[#6B7280] mt-1">
          View and search all blogs in your database ({allPosts.length} total)
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Blogs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
            <Input
              type="text"
              placeholder="Search by title, author, category, tags... (typo-tolerant search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-[#6B7280] mt-2">
              Found {posts.length} result(s) for "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-[#111827]" />
              <p className="text-[#6B7280]">Loading blogs...</p>
            </div>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-[#6B7280]">
              <FileText className="h-12 w-12 mx-auto mb-4 text-[#9CA3AF]" />
              <p className="text-lg font-medium">No blogs found</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "No blogs in the database yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="border border-[#E5E7EB] hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold text-[#111827] line-clamp-2 flex-1">
                    {post.title}
                  </CardTitle>
                  <div
                    className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${getSEOScoreColor(
                      post.seoScore
                    )}`}
                  >
                    <TrendingUp className="h-3 w-3" />
                    {post.seoScore}
                  </div>
                </div>
                {post.description && (
                  <p className="text-sm text-[#6B7280] line-clamp-2">
                    {post.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <FileText className="h-4 w-4" />
                      <span>{post.wordCount.toLocaleString()} words</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <span className="font-mono">{post.charCount.toLocaleString()} chars</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      <Tag className="h-4 w-4" />
                      <span>{post.headingCount} headings</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6B7280]">
                      {post.thumbnail || post.coverImage ? (
                        <>
                          <ImageIcon className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Has image</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">No image</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E5E7EB]"></div>

                  {/* Meta Information */}
                  <div className="space-y-2 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{post.websiteName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{post.author}</span>
                    </div>
                    {post.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] rounded text-[11px] font-medium">
                          {post.category}
                        </span>
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-4 w-4 flex-shrink-0" />
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[#F9FAFB] text-[#111827] rounded text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-[#6B7280]">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E5E7EB]"></div>

                  {/* Dates */}
                  <div className="space-y-1.5 text-xs text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">Original Date:</span>{" "}
                        <span>{formatDate(post.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium">Added Date:</span>{" "}
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    {post.readingTime && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span>{post.readingTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Source URL */}
                  {post.sourceUrl && (
                    <>
                      <div className="border-t border-[#E5E7EB]"></div>
                      <div className="text-xs">
                        <span className="font-medium text-[#6B7280]">Source:</span>
                        <a
                          href={post.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:underline truncate mt-1"
                          title={post.sourceUrl}
                        >
                          {post.sourceUrl}
                        </a>
                      </div>
                    </>
                  )}

                  {/* View Button */}
                  <div className="pt-2">
                    <Link href={`/post/${post.slug}`} target="_blank">
                      <Button className="w-full bg-[#111827] text-white hover:bg-[#111827]/90">
                        <Eye className="h-4 w-4 mr-2" />
                        View Blog
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

