import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Post } from "@/data/posts";
import { formatDate } from "@/lib/date-utils";

interface FeaturedArticleProps {
  posts?: Post[];
}

export default function FeaturedArticle({ posts = [] }: FeaturedArticleProps) {
  // Use the first post as featured, or fallback to default
  const featuredPost = posts.length > 0 ? posts[0] : {
    id: "default",
    slug: "default",
    title: "No posts available yet",
    description: "New articles are being added regularly. Check back soon for featured content.",
    author: "Admin",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
    date: new Date().toISOString(),
    readingTime: "5 min read",
    category: "General",
    tags: [],
    thumbnail: "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80",
    coverImage: "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=600&fit=crop&q=80",
  };

  const initials = featuredPost.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <section className="w-full">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8 py-16 md:py-20">
        {/* Section Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold text-[#111827]">
            Featured blog posts
          </h2>
          <Button variant="ghost" className="text-sm md:text-base font-medium text-[#111827] hover:bg-[#F9FAFB]">
            View all posts
          </Button>
        </header>

        {/* Featured Article Card */}
        <article className="border border-[#E5E7EB] rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="flex flex-col md:flex-row">
            {/* Left Side - Text Content */}
            <div className="flex-1 p-6 md:p-8 lg:p-10 flex flex-col justify-between">
              <div className="flex flex-col space-y-4">
                {/* Category Badge */}
                <div>
                  <span className="inline-block px-3 py-1 text-xs font-medium text-[#111827] bg-[#F9FAFB] rounded-md">
                    {featuredPost.category}
                  </span>
                </div>

                {/* Title */}
                <Link href={`/post/${featuredPost.slug}`}>
                  <h3 className="text-xl md:text-2xl font-semibold text-[#111827] leading-tight hover:text-[#111827]/80 transition-colors cursor-pointer">
                    {featuredPost.title}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-base text-[#6B7280] line-clamp-3 leading-relaxed">
                  {featuredPost.description}
                </p>
              </div>

              {/* Author Row */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#E5E7EB]">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={featuredPost.authorImage}
                    alt={featuredPost.author}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
                  <span className="font-medium text-[#111827]">
                    {featuredPost.author}
                  </span>
                  <span className="text-[#E5E7EB]">•</span>
                  <span>{formatDate(featuredPost.date)}</span>
                  <span className="text-[#E5E7EB]">•</span>
                  <span>{featuredPost.readingTime}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="w-full md:w-[400px] lg:w-[500px] flex-shrink-0">
              <div className="relative w-full h-[250px] md:h-full min-h-[300px] md:min-h-0">
                <Image
                  src={featuredPost.thumbnail}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
