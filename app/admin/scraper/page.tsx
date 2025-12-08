"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Loader2, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import ScraperProgress from "@/components/admin/ScraperProgress";

export default function ScraperPage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("");
  const [websites, setWebsites] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch websites on mount
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/admin/websites")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch websites");
        }
        return res.json();
      })
      .then((data: { websites?: any[] }) => {
        const websitesList = data.websites || [];
        setWebsites(websitesList);
        if (websitesList.length > 0) {
          setSelectedWebsite((prev) => prev || websitesList[0].id);
        }
        setError("");
      })
      .catch((err) => {
        console.error("Error fetching websites:", err);
        setError("Failed to load websites. Make sure your database is running and websites are seeded.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleRunScraper = async () => {
    if (!selectedWebsite || selectedWebsite === "all") {
      alert("Please select a website to scrape");
      return;
    }

    setIsRunning(true);
    const currentSessionId = `scrape-${Date.now()}`;
    setSessionId(currentSessionId);
    
    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId: selectedWebsite,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to start scraping");
      }

      const data = await response.json();

      // Use sessionId from response
      if (data.sessionId) {
        setSessionId(data.sessionId);
      } else {
        // Fallback: use generated sessionId
        setSessionId(currentSessionId);
      }

      // Auto-refresh after completion (progress component will handle completion)
      setTimeout(() => {
        router.refresh();
      }, 5000);
    } catch (error) {
      console.error("Error starting scrape:", error);
      alert(`Failed to start scraping: ${error instanceof Error ? error.message : "Unknown error"}`);
      setSessionId(undefined);
      setIsRunning(false);
    }
  };

  const handleStopScraper = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch("/api/scrape/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to stop scraping");
      }

      setIsRunning(false);
      // Keep sessionId so progress component can show cancellation status
    } catch (error) {
      console.error("Error stopping scrape:", error);
      alert(`Failed to stop scraping: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Scraper Control</h1>
        <p className="text-[#6B7280] mt-1">
          Trigger scraping for websites
        </p>
      </div>

      {/* Real-time Progress */}
      {sessionId && (
        <ScraperProgress 
          sessionId={sessionId} 
          onComplete={() => {
            setIsRunning(false);
          }}
        />
      )}

      {/* Scraper Status */}
      {!sessionId && (
        <Card>
          <CardHeader>
            <CardTitle>Scraper Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-[#111827]">Idle</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scraper Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Run Scraper</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-1">
                Run <code className="bg-red-100 px-1 rounded">npm run seed</code> to add websites
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827]">
              Select Website
            </label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading websites...
              </div>
            ) : websites.length === 0 ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  No websites found. Please seed the database first.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Run: <code className="bg-yellow-100 px-1 rounded">npm run seed</code>
                </p>
              </div>
            ) : (
              <Select
                value={selectedWebsite}
                onValueChange={setSelectedWebsite}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a website..." />
                </SelectTrigger>
                <SelectContent>
                  {websites.map((website) => (
                    <SelectItem key={website.id} value={website.id}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleRunScraper}
              disabled={isRunning || !selectedWebsite || websites.length === 0 || isLoading}
              className="bg-[#111827] text-white hover:bg-[#111827]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Scraping
                </>
              )}
            </Button>
            {isRunning && sessionId && (
              <Button
                onClick={handleStopScraper}
                variant="destructive"
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Scraper
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Queue Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Scraping Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#6B7280]">No items in queue</p>
        </CardContent>
      </Card>
    </div>
  );
}

