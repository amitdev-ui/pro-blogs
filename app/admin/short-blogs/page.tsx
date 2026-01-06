"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Trash2, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date-utils";

interface ProblematicPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  websiteName: string;
  createdAt: Date | string;
  issue: string;
  wordCount: number;
  headingCount: number;
  textLength: number;
}

export default function ShortBlogsPage() {
  const [posts, setPosts] = useState<ProblematicPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const findShortBlogs = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/find-short-blogs");
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
        setHasSearched(true);
        if (data.count === 0) {
          setMessage({
            type: "success",
            text: "Great! No problematic posts found. All blogs meet the minimum requirements.",
          });
        } else {
          setMessage({
            type: "success",
            text: `Found ${data.count} problematic post(s) that may need deletion.`,
          });
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to find short blogs",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete:\n"${postTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeleting(postId);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/delete-short-blog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove deleted post from list
        setPosts(posts.filter((p) => p.id !== postId));
        setMessage({
          type: "success",
          text: `Successfully deleted: ${postTitle}`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete post",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    } finally {
      setDeleting(null);
    }
  };

  const deleteAllShortBlogs = async () => {
    if (posts.length === 0) {
      setMessage({
        type: "error",
        text: "No posts to delete",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${posts.length} short blog(s)?\n\nThis action cannot be undone.`)) {
      return;
    }

    setDeletingAll(true);
    setMessage(null);

    let deletedCount = 0;
    let failedCount = 0;

    for (const post of posts) {
      try {
        const response = await fetch("/api/admin/delete-short-blog", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: post.id }),
        });

        const data = await response.json();

        if (data.success) {
          deletedCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
      }
    }

    setPosts([]);
    setDeletingAll(false);

    if (failedCount === 0) {
      setMessage({
        type: "success",
        text: `Successfully deleted all ${deletedCount} short blog(s)!`,
      });
    } else {
      setMessage({
        type: "error",
        text: `Deleted ${deletedCount} blog(s), but ${failedCount} failed to delete.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Find & Delete Short Blogs</h1>
        <p className="text-[#6B7280] mt-1">
          Find blogs that only contain headings or have very short content (less than 300 words)
        </p>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={
            message.type === "success"
              ? "bg-green-50 border border-green-200 rounded-lg p-4 text-green-800"
              : "bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
          }
        >
          <div className="flex items-start gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle>Scan for Problematic Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">What this tool finds:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Posts with less than 300 words (very short - clearly useless)</li>
                    <li>Posts that only contain headings with minimal text</li>
                    <li>Posts where most content is headings (70%+ headings)</li>
                    <li>Posts with no content at all</li>
                  </ul>
                  <p className="text-xs mt-2 text-yellow-700">
                    Note: Main scraper requires 600 words minimum. This tool finds posts under 300 words for easy cleanup.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={findShortBlogs}
              disabled={loading}
              className="bg-[#111827] text-white hover:bg-[#111827]/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find Problematic Posts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Found Posts ({posts.length})
                {posts.length > 0 && (
                  <span className="text-sm font-normal text-[#6B7280] ml-2">
                    All posts have less than 300 words
                  </span>
                )}
              </CardTitle>
              {posts.length > 0 && (
                <Button
                  onClick={deleteAllShortBlogs}
                  disabled={deletingAll}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deletingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting All...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All ({posts.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <div className="text-center py-8 text-[#6B7280]">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All posts meet the requirements!</p>
                <p className="text-sm mt-2">No problematic posts found in your database.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#F9FAFB] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[#111827] mb-1 line-clamp-2">
                              {post.title}
                            </h3>
                            {post.description && (
                              <p className="text-sm text-[#6B7280] mb-2 line-clamp-2">
                                {post.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="ml-8 space-y-1">
                          <div className="flex flex-wrap items-center gap-4 text-sm text-[#6B7280]">
                            <span className="font-medium text-red-600">{post.issue}</span>
                            <span>•</span>
                            <span>{post.wordCount} words</span>
                            {post.headingCount > 0 && (
                              <>
                                <span>•</span>
                                <span>{post.headingCount} heading(s)</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{post.websiteName}</span>
                            <span>•</span>
                            <span>{formatDate(post.createdAt)}</span>
                          </div>

                          {post.sourceUrl && (
                            <div className="text-xs text-[#6B7280] mt-2">
                              <span className="font-medium">Source:</span>{" "}
                              <a
                                href={post.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline break-all"
                              >
                                {post.sourceUrl}
                              </a>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Link
                              href={`/post/${post.slug}`}
                              target="_blank"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View Post →
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => deletePost(post.id, post.title)}
                          disabled={deleting === post.id}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleting === post.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

