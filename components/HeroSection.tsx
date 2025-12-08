"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-utils";
import type { Post } from "@/data/posts";
import Loader from "./Loader";

interface HeroSectionProps {
  posts: Post[];
}

export default function HeroSection({ posts }: HeroSectionProps) {
  const router = useRouter();

  const allPosts = posts || [];
  const featuredPost = allPosts[0];
  const gridPosts = allPosts.slice(1, 7); // Get 6 posts for the grid

  const handlePostClick = (slug: string) => {
    router.push(`/post/${slug}`);
  };

  return (
    <section className="w-full">
      <div className="container mx-auto max-w-[1280px] px-4 md:px-8 pt-10 md:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
          {/* Left Column - Text Content */}
          <div className="flex flex-col space-y-6 order-2 lg:order-1">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-xs sm:text-sm text-[#6B7280]">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                Resources
              </Link>
              <span className="text-[#6B7280]">/</span>
              <span className="text-[#111827]">{featuredPost?.category || "Design"}</span>
            </nav>

            {/* Page Title */}
            <header>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111827] leading-tight">
                Untitled Design & Photography Articles
              </h1>
            </header>

            {/* Subheading Paragraph */}
            <div className="max-w-[600px]">
              <p className="text-sm sm:text-base md:text-lg text-[#6B7280] leading-relaxed">
                The Untitled UI Articles features carefully selected good works
                from studios, designers, architects, photographers, and creators
                from all around the globe. Subscribe for new posts in your
                inbox.
              </p>
            </div>

            {/* Blog Cards Grid */}
            {gridPosts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
                {gridPosts.map((post) => (
                  <CompactBlogCard key={post.id} post={post} onClick={handlePostClick} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Featured Article */}
          {featuredPost && (
            <article className="order-1 lg:order-2">
              <div className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] rounded-xl overflow-hidden group">
                {/* Featured Image */}
                <Image
                  src={featuredPost.coverImage || featuredPost.thumbnail || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=600&fit=crop&q=80"}
                  alt={featuredPost.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                  unoptimized={(featuredPost.coverImage || featuredPost.thumbnail || "").startsWith('http')}
                />

                {/* Dark Gradient Overlay at Bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Metadata Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div className="flex flex-col space-y-4">
                {/* Article Title */}
                <button
                  onClick={() => handlePostClick(featuredPost.slug)}
                  className="text-left w-full"
                >
                  <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg hover:opacity-90 transition-opacity cursor-pointer">
                    {featuredPost.title}
                  </h2>
                </button>

                    {/* Metadata Row */}
                    <div className="flex flex-col space-y-3 text-sm text-white/90">
                      {/* Author and Date */}
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="drop-shadow-md">
                          Written by{" "}
                          <span className="font-medium">{featuredPost.author}</span>
                        </span>
                        <span className="text-white/70">•</span>
                        <span className="drop-shadow-md">
                          Published on{" "}
                          <span className="font-medium">{formatDate(featuredPost.date)}</span>
                        </span>
                      </div>

                      {/* Tags and Reading Time */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          {(featuredPost.tags || []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-md text-xs font-medium drop-shadow-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-white/70">•</span>
                        <span className="drop-shadow-md">{featuredPost.readingTime || "5 min read"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

// Compact Blog Card Component (matching featured article style)
function CompactBlogCard({ post, onClick }: { post: Post; onClick: (slug: string) => void }) {
  const thumbnailUrl = post.thumbnail || post.coverImage || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80";

  return (
    <button
      onClick={() => onClick(post.slug)}
      className="group block relative w-full text-left"
    >
      <article className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-[#F9FAFB] group-hover:shadow-xl transition-all duration-300">
        {/* Thumbnail Image */}
        <div className="relative w-full h-full">
          <Image
            src={thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={thumbnailUrl.startsWith('http')}
          />

          {/* Dark Gradient Overlay at Bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
            <div className="flex flex-col space-y-2">
              {/* Title */}
              <h3 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 drop-shadow-lg group-hover:opacity-90 transition-opacity">
                {post.title}
              </h3>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {(post.tags || []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-xs font-medium drop-shadow-md"
                  >
                    {tag}
                  </span>
                ))}
                {post.readingTime && (
                  <span className="px-2 py-0.5 text-white/90 text-xs drop-shadow-md">
                    {post.readingTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </button>
  );
}
