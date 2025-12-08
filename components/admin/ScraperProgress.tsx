"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ProgressData {
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  websiteId?: string;
  websiteName?: string;
  currentPost?: number;
  totalPosts?: number;
  message?: string;
  postsScraped?: number;
  errors?: string[];
  startTime?: string;
  endTime?: string;
  cancelled?: boolean;
}

interface ScraperProgressProps {
  sessionId?: string;
  onComplete?: () => void;
  title?: string;
}

export default function ScraperProgress({ sessionId, onComplete, title = "Progress" }: ScraperProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({
    status: 'idle',
    message: 'Ready to scrape'
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setProgress({
        status: 'idle',
        message: 'Ready to scrape'
      });
      return;
    }

    // Connect to SSE endpoint (works for both scraping and fix-content)
    const eventSource = new EventSource(
      `/api/scrape/progress?sessionId=${sessionId}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        setProgress(data);
        
        // Call onComplete when status changes to completed, error, or cancelled
        if ((data.status === 'completed' || data.status === 'error' || data.status === 'cancelled') && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      } catch (error) {
        console.error("Error parsing progress data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      // Try to reconnect after a delay
      setTimeout(() => {
        if (eventSourceRef.current && eventSourceRef.current.readyState === EventSource.CLOSED) {
          eventSourceRef.current.close();
          // Will reconnect via useEffect
        }
      }, 2000);
    };

    return () => {
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close();
        } catch (error) {
          // Ignore close errors
        }
      }
    };
  }, [sessionId]);

  if (progress.status === 'idle' && !sessionId) {
    return null;
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'running':
        return 'border-blue-500 bg-blue-50';
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'cancelled':
        return 'border-orange-500 bg-orange-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const calculateProgress = () => {
    if (progress.totalPosts && progress.currentPost) {
      return Math.round((progress.currentPost / progress.totalPosts) * 100);
    }
    return 0;
  };

  const getElapsedTime = () => {
    if (progress.startTime) {
      const start = new Date(progress.startTime);
      const end = progress.endTime ? new Date(progress.endTime) : new Date();
      const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
      
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return null;
  };

  return (
    <Card className={`border-2 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getStatusIcon()}
            {title}
          </CardTitle>
          {progress.status === 'running' && getElapsedTime() && (
            <span className="text-sm text-gray-600">
              {getElapsedTime()}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Message */}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {progress.websiteName || 'No website selected'}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {progress.message || 'Waiting...'}
          </p>
        </div>

        {/* Progress Bar */}
        {progress.status === 'running' && progress.totalPosts && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>
                Post {progress.currentPost || 0} of {progress.totalPosts}
              </span>
              <span>{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Posts Scraped</p>
            <p className="text-lg font-semibold text-gray-900">
              {progress.postsScraped || 0}
            </p>
          </div>
          {progress.totalPosts && (
            <div>
              <p className="text-xs text-gray-500">Total Found</p>
              <p className="text-lg font-semibold text-gray-900">
                {progress.totalPosts}
              </p>
            </div>
          )}
        </div>

        {/* Errors */}
        {progress.errors && progress.errors.length > 0 && (
          <div className="pt-2 border-t border-red-200">
            <p className="text-xs font-medium text-red-600 mb-1">
              Errors ({progress.errors.length}):
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {progress.errors.slice(0, 3).map((error, index) => (
                <p key={index} className="text-xs text-red-600 line-clamp-2">
                  {error}
                </p>
              ))}
              {progress.errors.length > 3 && (
                <p className="text-xs text-red-600">
                  +{progress.errors.length - 3} more errors
                </p>
              )}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {progress.status === 'completed' && (
          <div className="pt-2 border-t border-green-200">
            <p className="text-sm text-green-700 font-medium">
              ✅ Scraping completed successfully!
            </p>
            {getElapsedTime() && (
              <p className="text-xs text-green-600 mt-1">
                Completed in {getElapsedTime()}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'error' && (
          <div className="pt-2 border-t border-red-200">
            <p className="text-sm text-red-700 font-medium">
              ❌ Scraping failed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

