"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Post } from "@/data/posts";
import { formatDate } from "@/lib/date-utils";

interface BlogCardProps {
  post: Post;
}

export default function BlogCard({ post }: BlogCardProps) {
  const initials = post.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const thumbnailUrl = post.thumbnail || post.coverImage || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80";

  return (
    <article className="group border border-[#E5E7EB] rounded-xl overflow-hidden bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative">
      {/* Thumbnail Image */}
      <Link href={`/post/${post.slug}`}>
          <div className="relative w-full aspect-[16/10] overflow-hidden bg-[#F9FAFB]">
            <Image
              src={thumbnailUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized={thumbnailUrl.startsWith('http')}
            />
          </div>
        </Link>

        {/* Text Block */}
        <div className="p-4 md:p-5 flex flex-col space-y-3">
          {/* Category Badge */}
          <div>
            <span className="inline-block px-2.5 py-1 text-xs font-medium text-[#111827] bg-[#F9FAFB] rounded-md">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <Link href={`/post/${post.slug}`}>
            <h3 className="text-xl font-semibold text-[#111827] leading-tight line-clamp-2 group-hover:text-[#111827]/80 transition-colors">
              {post.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm md:text-[15px] text-[#6B7280] line-clamp-3 leading-relaxed">
            {post.description}
          </p>

          {/* Author Row */}
          <div className="flex items-center gap-2.5 pt-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.authorImage} alt={post.author} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-[#6B7280]">
              <span className="font-medium text-[#111827]">{post.author}</span>
              <span className="text-[#E5E7EB]">•</span>
              <span>{formatDate(post.date)}</span>
              <span className="text-[#E5E7EB]">•</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </div>
    </article>
  );
}
