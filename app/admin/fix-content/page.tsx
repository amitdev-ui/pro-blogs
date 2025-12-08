"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Image as ImageIcon, Loader2, BookOpen } from "lucide-react";
import ScraperProgress from "@/components/admin/ScraperProgress";

export default function FixContentPage() {
  const [seoSessionId, setSeoSessionId] = useState<string | undefined>();
  const [imageSessionId, setImageSessionId] = useState<string | undefined>();
  const [isSeoRunning, setIsSeoRunning] = useState(false);
  const [isImageRunning, setIsImageRunning] = useState(false);
  const [isContentRunning, setIsContentRunning] = useState(false);
  const [contentSessionId, setContentSessionId] = useState<string | undefined>();

  const handleSEORewrite = async () => {
    setIsSeoRunning(true);
    const currentSessionId = `fix-content-${Date.now()}`;
    setSeoSessionId(currentSessionId);
    
    try {
      const response = await fetch("/api/admin/fix-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "seo" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to start SEO rewrite");
      }

      const data = await response.json();
      if (data.sessionId) {
        setSeoSessionId(data.sessionId);
      }
    } catch (error) {
      console.error("Error starting SEO rewrite:", error);
      alert(`Failed to start SEO rewrite: ${error instanceof Error ? error.message : "Unknown error"}`);
      setSeoSessionId(undefined);
      setIsSeoRunning(false);
    }
  };

  const handleImageFix = async () => {
    setIsImageRunning(true);
    const currentSessionId = `fix-content-${Date.now()}`;
    setImageSessionId(currentSessionId);
    
    try {
      const response = await fetch("/api/admin/fix-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "images" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to start image fix");
      }

      const data = await response.json();
      if (data.sessionId) {
        setImageSessionId(data.sessionId);
      }
    } catch (error) {
      console.error("Error starting image fix:", error);
      alert(`Failed to start image fix: ${error instanceof Error ? error.message : "Unknown error"}`);
      setImageSessionId(undefined);
      setIsImageRunning(false);
    }
  };

  const handleContentFix = async () => {
    setIsContentRunning(true);
    const currentSessionId = `fix-content-${Date.now()}`;
    setContentSessionId(currentSessionId);
    
    try {
      const response = await fetch("/api/admin/fix-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "content" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to start content fix");
      }

      const data = await response.json();
      if (data.sessionId) {
        setContentSessionId(data.sessionId);
      }
    } catch (error) {
      console.error("Error starting content fix:", error);
      alert(`Failed to start content fix: ${error instanceof Error ? error.message : "Unknown error"}`);
      setContentSessionId(undefined);
      setIsContentRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Fix Existing Content</h1>
        <p className="text-[#6B7280] mt-1">
          Update existing blog posts with new features and improvements
        </p>
      </div>

      {/* SEO Rewrite Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            SEO Rewrite
          </CardTitle>
          <CardDescription>
            Find and optimize blog posts that haven&apos;t been SEO-optimized. This will rewrite
            content to improve search visibility while maintaining the original meaning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Real-time Progress */}
          {seoSessionId && (
            <ScraperProgress 
              sessionId={seoSessionId} 
              onComplete={() => setIsSeoRunning(false)}
              title="SEO Rewrite Progress"
            />
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSEORewrite}
              disabled={isSeoRunning}
              className="bg-[#111827] text-white hover:bg-[#111827]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSeoRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Start SEO Rewrite
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>What this does:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>Scans all existing blog posts</li>
              <li>Identifies posts that need SEO optimization</li>
              <li>Rewrites content with improved SEO while preserving meaning</li>
              <li>Enhances headings and paragraph structure</li>
              <li>Adds natural keywords based on content</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Image Fix Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Fix Missing Images
          </CardTitle>
          <CardDescription>
            Find and fix blog posts with missing or placeholder images. This will scrape
            the source URLs to find and update featured images and thumbnails.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Real-time Progress */}
          {imageSessionId && (
            <ScraperProgress 
              sessionId={imageSessionId} 
              onComplete={() => setIsImageRunning(false)}
              title="Image Fix Progress"
            />
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleImageFix}
              disabled={isImageRunning}
              className="bg-[#111827] text-white hover:bg-[#111827]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImageRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Start Image Fix
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>What this does:</strong>
            </p>
            <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
              <li>Scans all existing blog posts</li>
              <li>Identifies posts with missing or placeholder images</li>
              <li>Visits source URLs to extract featured images</li>
              <li>Updates thumbnails and cover images</li>
              <li>Shows real-time progress for each post</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Fix Missing Content Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Fix Missing Content
          </CardTitle>
          <CardDescription>
            Find and fix blog posts with missing or empty content. This will re-scrape
            the source URLs to extract full article content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Real-time Progress */}
          {contentSessionId && (
            <ScraperProgress 
              sessionId={contentSessionId} 
              onComplete={() => setIsContentRunning(false)}
              title="Content Fix Progress"
            />
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleContentFix}
              disabled={isContentRunning}
              className="bg-[#111827] text-white hover:bg-[#111827]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isContentRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Start Content Fix
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
            <p className="text-sm text-purple-800">
              <strong>What this does:</strong>
            </p>
            <ul className="text-sm text-purple-700 mt-2 list-disc list-inside space-y-1">
              <li>Scans all existing blog posts</li>
              <li>Identifies posts with missing or empty content</li>
              <li>Re-scrapes source URLs to extract full content</li>
              <li>Applies content cleaning and SEO optimization</li>
              <li>Updates posts with complete article content</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Content Fixing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6B7280] mb-4">
            These tools help you update existing blog posts with new features that were added
            after the posts were originally scraped. New posts will automatically include
            these improvements, but existing posts need to be updated manually.
          </p>
          <div className="space-y-2 text-sm text-[#6B7280]">
            <p><strong>Note:</strong> All processes run in the background and won&apos;t block your browser.</p>
            <p><strong>Tip:</strong> You can run all processes, but it&apos;s recommended to run them one at a time.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

