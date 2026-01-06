"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/date-utils";
import { ChevronUp, ChevronDown, Pause, Play } from "lucide-react";
import AdSlot from "./AdSlot";

interface Post {
  id: string;
  slug: string;
  title: string;
  thumbnail?: string | null;
  coverImage?: string | null;
  category?: string | null;
  author: string;
  authorImage?: string | null;
  date: string;
  readingTime?: string | null;
}

interface ScrollableRelatedArticlesProps {
  relatedPosts: Post[];
  sidebarAds: Array<{
    id: string;
    title: string;
    imageUrl?: string | null;
    linkUrl: string;
    adCode?: string | null;
    width?: number | null;
    height?: number | null;
    placement: string;
  }>;
}

export default function ScrollableRelatedArticles({ relatedPosts, sidebarAds }: ScrollableRelatedArticlesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoScrollRef = useRef<number | null>(null);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    setCanScrollUp(container.scrollTop > 0);
    setCanScrollDown(container.scrollTop < container.scrollHeight - container.clientHeight - 10);
  };

  // Auto-scroll functionality
  useEffect(() => {
    if (isPaused || !scrollContainerRef.current || !scrollContentRef.current) return;

    const container = scrollContainerRef.current;
    const content = scrollContentRef.current;
    
    // Check if content is scrollable
    if (content.scrollHeight <= container.clientHeight) {
      return; // No need to auto-scroll if content fits
    }

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame
    const maxScroll = content.scrollHeight - container.clientHeight;

    const autoScroll = () => {
      if (isPaused) return;

      scrollPosition += scrollSpeed;
      
      // Reset to top when reaching bottom for infinite loop
      if (scrollPosition >= maxScroll) {
        scrollPosition = 0;
        container.scrollTop = 0;
      } else {
        container.scrollTop = scrollPosition;
      }

      checkScrollability();
      autoScrollRef.current = requestAnimationFrame(autoScroll);
    };

    autoScrollRef.current = requestAnimationFrame(autoScroll);

    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, [isPaused, relatedPosts]);

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
      return () => {
        container.removeEventListener('scroll', checkScrollability);
        window.removeEventListener('resize', checkScrollability);
      };
    }
  }, [relatedPosts]);

  const scrollUp = () => {
    if (scrollContainerRef.current) {
      setIsPaused(true); // Pause auto-scroll when manually scrolling
      scrollContainerRef.current.scrollBy({ top: -200, behavior: 'smooth' });
      // Resume after a delay
      setTimeout(() => setIsPaused(false), 3000);
    }
  };

  const scrollDown = () => {
    if (scrollContainerRef.current) {
      setIsPaused(true); // Pause auto-scroll when manually scrolling
      scrollContainerRef.current.scrollBy({ top: 200, behavior: 'smooth' });
      // Resume after a delay
      setTimeout(() => setIsPaused(false), 3000);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  return (
    <section className="bg-white border border-[#E5E7EB] shadow-sm md:shadow-md rounded-none p-4 md:p-5 lg:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <h2 className="text-lg md:text-xl font-semibold text-[#111827]">
          Related articles
        </h2>
        {/* Scroll Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={togglePause}
            className="p-1.5 rounded border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] hover:border-[#111827] text-[#111827] transition-colors"
            aria-label={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </button>
          <div className="flex flex-col gap-1">
            <button
              onClick={scrollUp}
              disabled={!canScrollUp}
              className={`p-1.5 rounded border border-[#E5E7EB] transition-colors ${
                canScrollUp
                  ? 'bg-white hover:bg-[#F9FAFB] hover:border-[#111827] text-[#111827] cursor-pointer'
                  : 'bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed opacity-50'
              }`}
              aria-label="Scroll up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={scrollDown}
              disabled={!canScrollDown}
              className={`p-1.5 rounded border border-[#E5E7EB] transition-colors ${
                canScrollDown
                  ? 'bg-white hover:bg-[#F9FAFB] hover:border-[#111827] text-[#111827] cursor-pointer'
                  : 'bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed opacity-50'
              }`}
              aria-label="Scroll down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="relative h-[600px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-[#E5E7EB] scrollbar-track-transparent"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#E5E7EB transparent'
        }}
        onMouseEnter={() => setIsPaused(true)} // Pause on hover
        onMouseLeave={() => setIsPaused(false)} // Resume on leave
      >
        <div ref={scrollContentRef} className="space-y-4">
          {relatedPosts.slice(0, 8).map((relatedPost, index) => {
            const ad = sidebarAds[index] || sidebarAds[0];
            const thumb =
              relatedPost.thumbnail ||
              relatedPost.coverImage ||
              "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80";
            const initialsRelated = relatedPost.author
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div key={relatedPost.id} className="space-y-4">
                <article className="border border-[#E5E7EB] rounded-none overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <Link href={`/post/${relatedPost.slug}`}>
                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                      <Image
                        src={thumb}
                        alt={relatedPost.title}
                        fill
                        className="object-cover"
                        unoptimized={thumb.startsWith("http")}
                      />
                    </div>
                  </Link>
                  <div className="p-4 space-y-2">
                    {relatedPost.category && (
                      <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                        {relatedPost.category}
                      </span>
                    )}
                    <Link
                      href={`/post/${relatedPost.slug}`}
                      className="block hover:text-[#111827]/80 transition-colors"
                    >
                      <h3 className="text-sm md:text-base font-semibold text-[#111827] leading-snug line-clamp-2">
                        {relatedPost.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 pt-1 text-xs text-[#6B7280]">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={relatedPost.authorImage || undefined} alt={relatedPost.author} />
                        <AvatarFallback className="text-[10px]">{initialsRelated}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-[#111827] text-[11px]">
                          {relatedPost.author}
                        </span>
                        <div className="flex items-center gap-1 text-[11px]">
                          <span>{formatDate(relatedPost.date)}</span>
                          {relatedPost.readingTime && (
                            <>
                              <span className="text-[#E5E7EB]">•</span>
                              <span>{relatedPost.readingTime}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
                
                {/* Ad Slot - After each article */}
                {ad && (
                  <div className="w-full">
                    <AdSlot ad={ad} className="w-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

