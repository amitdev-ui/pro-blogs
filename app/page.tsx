import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BlogCard from "@/components/BlogCard";
import { getPostsFromDB, getStatsFromDB, getAdsForPlacement } from "@/lib/post-utils";
import { Sparkles, Code, TrendingUp, Brain } from "lucide-react";

export default async function Home() {
  // Fetch real posts and stats from database
  const [allPosts, stats, latestPosts, techPosts, financialPosts, aiPosts] = await Promise.all([
    getPostsFromDB(6),
    getStatsFromDB(),
    getPostsFromDB(6), // Latest posts
    getPostsFromDB(6, undefined, "tech"), // Tech posts
    getPostsFromDB(6, undefined, "financial"), // Financial posts
    getPostsFromDB(6, undefined, "ai"), // AI posts
  ]);

  // Get ads for homepage content sections
  const homepageAds = await getAdsForPlacement("inline", 8);

  // Featured posts for home page (first 3 posts)
  const featuredPosts = allPosts.slice(0, 3);

  // Helper function to filter posts by keywords
  const filterByKeywords = (posts: typeof allPosts, keywords: string[]) => {
    return posts.filter(post => {
      const searchText = `${post.title} ${post.description} ${post.category || ''} ${post.tags.join(' ')}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    }).slice(0, 6);
  };

  // Filter posts by category keywords
  const techFiltered = techPosts.length > 0 ? techPosts : filterByKeywords(allPosts, ['tech', 'technology', 'coding', 'programming', 'software', 'developer', 'web development', 'javascript', 'python']);
  const financialFiltered = financialPosts.length > 0 ? financialPosts : filterByKeywords(allPosts, ['financial', 'finance', 'money', 'investment', 'trading', 'stock', 'market', 'business', 'economy']);
  const aiFiltered = aiPosts.length > 0 ? aiPosts : filterByKeywords(allPosts, ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'openai', 'chatgpt', 'deep learning']);

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-white to-[#F9FAFB]">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8 pt-12 md:pt-16 pb-16 md:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text */}
            <div className="flex flex-col space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F9FAFB] rounded-full w-fit">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-[#6B7280]">
                  Latest articles published
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111827] leading-tight">
                Discover Stories, Ideas, and Inspiration
              </h1>

              <p className="text-lg md:text-xl text-[#6B7280] leading-relaxed max-w-[600px]">
                Explore carefully curated articles from designers, photographers,
                architects, and creators around the world. Join our community of
                creative minds.
              </p>

              {/* Ad Slot - After Hero Title and Description */}
              {homepageAds.length > 0 && homepageAds[0] && (
                <div className="my-6">
                  <a
                    href={homepageAds[0].linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                  >
                    <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                      Sponsored
                    </p>
                    <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                      {homepageAds[0].title}
                    </h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                      {homepageAds[0].linkUrl}
                    </p>
                  </a>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  asChild
                  className="bg-[#111827] text-white hover:bg-[#111827]/90 rounded-md h-12 px-8 text-base"
                >
                  <Link href="/articles">Explore Articles</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] rounded-md h-12 px-8 text-base"
                >
                  <Link href="#articles">Read Articles</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-8">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[#111827]">
                    {stats.postCount > 0 ? `${stats.postCount}+` : "0"}
                  </div>
                  <div className="text-sm text-[#6B7280]">Published Articles</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[#111827]">
                    {stats.websiteCount > 0 ? `${stats.websiteCount}+` : "0"}
                  </div>
                  <div className="text-sm text-[#6B7280]">Content Sources</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-[#111827]">
                    {stats.authorCount > 0 ? `${stats.authorCount}+` : "0"}
                  </div>
                  <div className="text-sm text-[#6B7280]">Authors</div>
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src={featuredPosts[0]?.coverImage || featuredPosts[0]?.thumbnail || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=1200&fit=crop&q=80"}
                alt={featuredPosts[0]?.title || "Creative workspace"}
                fill
                className="object-cover"
                priority
                unoptimized={(featuredPosts[0]?.coverImage || featuredPosts[0]?.thumbnail || "").startsWith('http')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blogs Section */}
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-1">
                  Latest Blogs
                </h2>
                <p className="text-base text-[#6B7280]">
                  Fresh content from our latest publications
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-sm md:text-base font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Link href="/articles?category=tech">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {latestPosts.length > 0 ? (
              latestPosts.map((post, index) => (
                <div key={post.id}>
                  <BlogCard post={post} />
                  {/* Ad Slot - After every 3rd blog card */}
                  {index > 0 && (index + 1) % 3 === 0 && homepageAds[1] && (
                    <div className="mt-6">
                      <a
                        href={homepageAds[1].linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                      >
                        <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                          Sponsored
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                          {homepageAds[1].title}
                        </h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                          {homepageAds[1].linkUrl}
                        </p>
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#6B7280]">No latest articles yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ad Slot - Between Latest and Tech Sections */}
      {homepageAds.length > 2 && homepageAds[2] && (
        <section className="w-full py-8 bg-white">
          <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
            <a
              href={homepageAds[2].linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
            >
              <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                Sponsored
              </p>
              <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                {homepageAds[2].title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                {homepageAds[2].linkUrl}
              </p>
            </a>
          </div>
        </section>
      )}

      {/* Tech Blogs Section */}
      <section className="w-full py-12 md:py-16 bg-gradient-to-b from-[#F9FAFB] to-white">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-1">
                  Tech Blogs
                </h2>
                <p className="text-base text-[#6B7280]">
                  Technology, coding, and development insights
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-sm md:text-base font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Link href="/articles?category=tech">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {techFiltered.length > 0 ? (
              techFiltered.map((post, index) => (
                <div key={post.id}>
                  <BlogCard post={post} />
                  {/* Ad Slot - After every 3rd blog card */}
                  {index > 0 && (index + 1) % 3 === 0 && homepageAds[3] && (
                    <div className="mt-6">
                      <a
                        href={homepageAds[3].linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                      >
                        <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                          Sponsored
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                          {homepageAds[3].title}
                        </h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                          {homepageAds[3].linkUrl}
                        </p>
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#6B7280]">No tech articles yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ad Slot - Between Tech and Financial Sections */}
      {homepageAds.length > 4 && homepageAds[4] && (
        <section className="w-full py-8 bg-gradient-to-b from-[#F9FAFB] to-white">
          <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
            <a
              href={homepageAds[4].linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
            >
              <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                Sponsored
              </p>
              <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                {homepageAds[4].title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                {homepageAds[4].linkUrl}
              </p>
            </a>
          </div>
        </section>
      )}

      {/* Financial Blogs Section */}
      <section className="w-full py-12 md:py-16 bg-white">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-1">
                  Financial Blogs
                </h2>
                <p className="text-base text-[#6B7280]">
                  Finance, investment, and market analysis
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-sm md:text-base font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Link href="/articles?category=financial">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {financialFiltered.length > 0 ? (
              financialFiltered.map((post, index) => (
                <div key={post.id}>
                  <BlogCard post={post} />
                  {/* Ad Slot - After every 3rd blog card */}
                  {index > 0 && (index + 1) % 3 === 0 && homepageAds[5] && (
                    <div className="mt-6">
                      <a
                        href={homepageAds[5].linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                      >
                        <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                          Sponsored
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                          {homepageAds[5].title}
                        </h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                          {homepageAds[5].linkUrl}
                        </p>
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#6B7280]">No financial articles yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ad Slot - Between Financial and AI Sections */}
      {homepageAds.length > 6 && homepageAds[6] && (
        <section className="w-full py-8 bg-gradient-to-b from-white to-[#F9FAFB]">
          <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
            <a
              href={homepageAds[6].linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
            >
              <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                Sponsored
              </p>
              <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                {homepageAds[6].title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                {homepageAds[6].linkUrl}
              </p>
            </a>
          </div>
        </section>
      )}

      {/* AI Blogs Section */}
      <section className="w-full py-12 md:py-16 bg-gradient-to-b from-[#F9FAFB] to-white">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 md:mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-1">
                  AI Related Blogs
                </h2>
                <p className="text-base text-[#6B7280]">
                  Artificial intelligence and machine learning insights
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="ghost"
              className="text-sm md:text-base font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              <Link href="/articles?category=ai">View all</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {aiFiltered.length > 0 ? (
              aiFiltered.map((post, index) => (
                <div key={post.id}>
                  <BlogCard post={post} />
                  {/* Ad Slot - After every 3rd blog card */}
                  {index > 0 && (index + 1) % 3 === 0 && homepageAds[7] && (
                    <div className="mt-6">
                      <a
                        href={homepageAds[7].linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                      >
                        <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                          Sponsored
                        </p>
                        <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                          {homepageAds[7].title}
                        </h3>
                        <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                          {homepageAds[7].linkUrl}
                        </p>
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-[#6B7280]">No AI articles yet. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-[#F9FAFB]">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
              Join Our Community
            </h2>
            <p className="text-lg text-[#6B7280] mb-8 max-w-2xl mx-auto">
              Get the latest articles, insights, and inspiration delivered
              straight to your inbox. Be part of a growing community of creative
              professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-md border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              />
              <Button className="bg-[#111827] text-white hover:bg-[#111827]/90 rounded-md px-8">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
