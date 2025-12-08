"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, User, Tag, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import type { Post } from "@/data/posts";

interface SearchResultsProps {
  query: string;
  results: Post[];
  isLoading?: boolean;
}

export default function SearchResults({ query, results, isLoading = false }: SearchResultsProps) {

  if (!query) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F9FAFB] mb-4">
          <svg
            className="w-10 h-10 text-[#6B7280]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Search Articles
        </h2>
        <p className="text-[#6B7280]">
          Enter keywords to search through our collection of articles
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F9FAFB] mb-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#111827]"></div>
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Searching...
        </h2>
        <p className="text-[#6B7280]">
          Finding articles matching &quot;{query}&quot;
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F9FAFB] mb-4">
          <svg
            className="w-10 h-10 text-[#6B7280]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          No results found
        </h2>
        <p className="text-[#6B7280]">
          We couldn&apos;t find any articles matching &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#111827]">
          Found {results.length} {results.length === 1 ? "result" : "results"} for &quot;{query}&quot;
        </h2>
      </div>

      <div className="space-y-4">
        {results.map((post) => {
          const thumbnailUrl = post.thumbnail || post.coverImage || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80";

          return (
            <article
              key={post.id}
              className="group relative bg-white border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-lg hover:border-[#111827]/20 transition-all duration-300"
            >
              <Link
                href={`/post/${post.slug}`}
                className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6"
              >
                {/* Thumbnail */}
                <div className="relative w-full md:w-32 h-48 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-[#F9FAFB] border border-[#E5E7EB]">
                  <Image
                    src={thumbnailUrl}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={thumbnailUrl.startsWith('http')}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-2">
                    {/* Category Tag */}
                    {post.category && (
                      <div className="inline-flex items-center">
                        <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-md border border-[#10B981]/20">
                          {post.category.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg md:text-xl font-bold text-[#111827] group-hover:text-[#111827]/80 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#6B7280] line-clamp-2 leading-relaxed">
                      {post.description || "No description available."}
                    </p>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center gap-4 text-xs text-[#6B7280] mt-3 pt-3 border-t border-[#E5E7EB]">
                    {/* Author */}
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#10B981]" />
                      <span className="truncate font-medium">{post.author}</span>
                    </div>

                    {/* Reading Time */}
                    {post.readingTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#10B981]" />
                        <span>{post.readingTime}</span>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-1.5">
                      <span>{formatDate(post.date)}</span>
                    </div>

                    {/* Arrow Icon */}
                    <div className="ml-auto flex items-center gap-1 text-[#10B981] group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}

