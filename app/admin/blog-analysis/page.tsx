"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  User,
  Tag,
  Loader2,
  RefreshCw,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface BlogAnalysis {
  statistics: {
    totalPosts: number;
    perfectPosts: number;
    emptyContentPosts: number;
    missingThumbnailPosts: number;
    missingCoverImagePosts: number;
    missingAuthorImagePosts: number;
    shortContentPosts: number;
    missingCategoryPosts: number;
    missingTagsPosts: number;
    postsWithIssues: number;
  };
  emptyPosts: Array<{
    id: string;
    slug: string;
    title: string;
    website: string;
    issues: string[];
  }>;
  websiteStats: Array<{
    websiteName: string;
    total: number;
    perfect: number;
    issues: number;
  }>;
}

export default function BlogAnalysisPage() {
  const [analysis, setAnalysis] = useState<BlogAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchAnalysis = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/blog-analysis");
      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }
      const data = await response.json();
      if (data.success) {
        setAnalysis(data);
      } else {
        setError(data.error || "Failed to analyze blogs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="ml-64 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#111827]" />
            <p className="text-[#6B7280]">Analyzing your blogs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ml-64 p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchAnalysis}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const stats = analysis.statistics;
  const perfectPercentage = stats.totalPosts > 0 
    ? Math.round((stats.perfectPosts / stats.totalPosts) * 100) 
    : 0;
  const issuesPercentage = stats.totalPosts > 0 
    ? Math.round((stats.postsWithIssues / stats.totalPosts) * 100) 
    : 0;

  return (
    <div className="ml-64 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Blog Quality Analysis
          </h1>
          <p className="text-[#6B7280]">
            Comprehensive overview of your blog posts quality and completeness
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#6B7280]">
                Total Blogs
              </CardTitle>
              <FileText className="h-4 w-4 text-[#6B7280]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[#111827]">
                {stats.totalPosts.toLocaleString()}
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                All blog posts in database
              </p>
            </CardContent>
          </Card>

          {/* Perfect Posts */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Perfect Blogs
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {stats.perfectPosts.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {perfectPercentage}% of total • Complete with all content
              </p>
            </CardContent>
          </Card>

          {/* Posts with Issues */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">
                Blogs with Issues
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {stats.postsWithIssues.toLocaleString()}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {issuesPercentage}% of total • Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Issue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-900">Empty Content</p>
                    <p className="text-sm text-red-600">
                      Posts with no content at all
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {stats.emptyContentPosts}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">Short Content</p>
                    <p className="text-sm text-yellow-600">
                      Less than 350 characters (plain text)
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-700">
                  {stats.shortContentPosts}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Missing Thumbnail</p>
                    <p className="text-sm text-blue-600">
                      No thumbnail image
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {stats.missingThumbnailPosts}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">Missing Cover Image</p>
                    <p className="text-sm text-purple-600">
                      No cover image
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {stats.missingCoverImagePosts}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-indigo-900">Missing Author Image</p>
                    <p className="text-sm text-indigo-600">
                      No author profile picture
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {stats.missingAuthorImagePosts}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-200">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="font-medium text-pink-900">Missing Category</p>
                    <p className="text-sm text-pink-600">
                      No category assigned
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-pink-700">
                  {stats.missingCategoryPosts}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-200">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-teal-600" />
                  <div>
                    <p className="font-medium text-teal-900">Missing Tags</p>
                    <p className="text-sm text-teal-600">
                      No tags assigned
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-teal-700">
                  {stats.missingTagsPosts}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Statistics by Website
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.websiteStats.map((website) => {
                const perfectPercentage = website.total > 0
                  ? Math.round((website.perfect / website.total) * 100)
                  : 0;
                return (
                  <div
                    key={website.websiteName}
                    className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#111827]">
                        {website.websiteName}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-green-600">
                          ✓ {website.perfect} perfect
                        </span>
                        <span className="text-sm text-orange-600">
                          ⚠ {website.issues} with issues
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#111827]">
                        {website.total}
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        {perfectPercentage}% perfect
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Empty Posts List */}
        {analysis.emptyPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Blogs with Issues (First 100)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysis.emptyPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start justify-between p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-colors"
                  >
                    <div className="flex-1">
                      <Link
                        href={`/admin/posts?search=${post.slug}`}
                        className="font-medium text-[#111827] hover:text-[#111827]/80 transition-colors"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-[#6B7280] mt-1">
                        {post.website} • {post.slug}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.issues.map((issue, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-md"
                          >
                            {issue}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {analysis.emptyPosts.length >= 100 && (
                <p className="text-sm text-[#6B7280] mt-4 text-center">
                  Showing first 100 posts with issues. There may be more.
                </p>
              )}
            </CardContent>
          </Card>
        )}

         {/* Actions */}
         <Card className="border-red-200 bg-red-50">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-red-700">
               <AlertCircle className="h-5 w-5" />
               Delete Empty Blogs
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="space-y-4">
               <p className="text-sm text-red-700">
                Delete all blogs with empty or short content (less than 350 characters). 
                This will keep your original 82 blogs and remove all empty ones added by the category scraper.
               </p>
               <div className="flex gap-4">
                 <Button
                   onClick={async () => {
                     if (!confirm(`Delete ${stats.postsWithIssues} empty blogs? This cannot be undone!`)) {
                       return;
                     }
                     
                     setLoading(true);
                     try {
                       const response = await fetch("/api/admin/delete-empty-blogs", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({
                          keepOriginal: true,
                          minContentLength: 350,
                         }),
                       });
                       
                       const data = await response.json();
                       if (data.success) {
                         alert(`Successfully deleted ${data.deleted} empty blogs!`);
                         fetchAnalysis(); // Refresh
                       } else {
                         alert(`Error: ${data.error}`);
                       }
                     } catch (err) {
                       alert(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
                     } finally {
                       setLoading(false);
                     }
                   }}
                   disabled={loading || stats.postsWithIssues === 0}
                   variant="destructive"
                   className="bg-red-600 hover:bg-red-700"
                 >
                   {loading ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Deleting...
                     </>
                   ) : (
                     <>
                       <XCircle className="h-4 w-4 mr-2" />
                       Delete {stats.postsWithIssues.toLocaleString()} Empty Blogs
                     </>
                   )}
                 </Button>
                 <Button
                   onClick={async () => {
                     if (!confirm("DELETE ALL BLOGS? This will remove every post from the database. Are you absolutely sure?")) {
                       return;
                     }

                     setLoading(true);
                     try {
                       const response = await fetch("/api/admin/delete-empty-blogs", {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({
                           deleteAll: true,
                         }),
                       });

                       const data = await response.json();
                       if (data.success) {
                         alert(`All blogs deleted (${data.deleted} posts). You are starting fresh.`);
                         fetchAnalysis(); // Refresh
                       } else {
                         alert(`Error: ${data.error}`);
                       }
                     } catch (err) {
                       alert(`Failed to delete all blogs: ${err instanceof Error ? err.message : "Unknown error"}`);
                     } finally {
                       setLoading(false);
                     }
                   }}
                   disabled={loading || stats.totalPosts === 0}
                   variant="destructive"
                 >
                   Delete ALL Blogs
                 </Button>
                 <Button onClick={fetchAnalysis} disabled={loading} variant="outline">
                   <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                   Refresh Analysis
                 </Button>
               </div>
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

