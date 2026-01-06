export const dynamic = 'force-dynamic';
import HeroSection from "@/components/HeroSection";
import FeaturedArticle from "@/components/FeaturedArticle";
import BlogGrid from "@/components/BlogGrid";
import CategoryFilter from "@/components/CategoryFilter";
import { getPostsFromDB, getPostsCount, getAllCategories, getAdsForPlacement } from "@/lib/post-utils";
import PaginationControls from "@/components/PaginationControls";
import { Suspense } from "react";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";

export async function generateMetadata({ searchParams }: {
  searchParams: Promise<{ page?: string; category?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;
  
  const title = category 
    ? `${category.charAt(0).toUpperCase() + category.slice(1)} Articles | Blog Journal`
    : "All Articles | Blog Journal";
  
  const description = category
    ? `Browse our collection of ${category} articles. Discover insights, tips, and expert opinions on ${category} topics.`
    : "Browse our complete collection of articles. Discover insights, tips, and expert opinions on technology, finance, AI, and more.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/articles${category ? `?category=${category}` : ""}`,
    },
    alternates: {
      canonical: `${siteUrl}/articles${category ? `?category=${category}` : ""}`,
    },
  };
}

interface ArticlesPageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  try {
    const params = await searchParams;
    const currentPage = parseInt(params.page || "1", 10);
    const category = params.category;
    
    // Pagination: 20 rows × 3 cards = 60 posts per page
    const postsPerPage = 60;
    const skip = (currentPage - 1) * postsPerPage;

    // Fetch posts with pagination and categories
    const [posts, totalPosts, categories, mobileAds] = await Promise.all([
      getPostsFromDB(postsPerPage, skip, category),
      getPostsCount(category),
      getAllCategories(),
      getAdsForPlacement("mobile", 3), // Get mobile ads for articles page
    ]);

    const totalPages = Math.ceil(totalPosts / postsPerPage);

    return (
      <Suspense fallback={
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8 py-16">
          <div className="text-center">
            <p className="text-lg text-[#6B7280]">Loading articles...</p>
          </div>
        </div>
      }>
        <div>
          <HeroSection posts={posts || []} />
          
          {/* Top Ad Slot - After Hero Section */}
          {mobileAds.length > 0 && mobileAds[0] && (mobileAds[0] as any).adCode ? (
            <section className="w-full py-6 bg-white">
              <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
                <div 
                  className="w-full mx-auto"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '8px'
                  }}
                  dangerouslySetInnerHTML={{ __html: (mobileAds[0] as any).adCode }}
                />
              </div>
            </section>
          ) : (
            <section className="w-full py-6 bg-white">
              <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
                <div 
                  className="w-full mx-auto border-2 border-dashed border-[#D1D5DB] rounded-lg p-6 bg-[#F9FAFB]"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <h3 className="text-sm font-semibold text-[#6B7280] mb-2">
                    Top Ad Slot (100% × 250-280px)
                  </h3>
                  <p className="text-xs text-[#9CA3AF] text-center max-w-md">
                    Add ads with placement &quot;Mobile&quot; in the admin panel to display here. Accepts ads from 250px to 280px height.
                  </p>
                </div>
              </div>
            </section>
          )}
          
          <CategoryFilter categories={categories || []} />
          <FeaturedArticle posts={posts || []} />
          
          {/* Middle Ad Slot - Before Blog Grid */}
          {mobileAds.length > 1 && mobileAds[1] && (mobileAds[1] as any).adCode ? (
            <section className="w-full py-6 bg-[#F3F4F6]">
              <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
                <div 
                  className="w-full mx-auto"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '8px'
                  }}
                  dangerouslySetInnerHTML={{ __html: (mobileAds[1] as any).adCode }}
                />
              </div>
            </section>
          ) : (
            <section className="w-full py-6 bg-[#F3F4F6]">
              <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
                <div 
                  className="w-full mx-auto border-2 border-dashed border-[#D1D5DB] rounded-lg p-6 bg-[#F9FAFB]"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <h3 className="text-sm font-semibold text-[#6B7280] mb-2">
                    Middle Ad Slot (100% × 250-280px)
                  </h3>
                  <p className="text-xs text-[#9CA3AF] text-center max-w-md">
                    Add ads with placement &quot;Mobile&quot; in the admin panel to display here. Accepts ads from 250px to 280px height.
                  </p>
                </div>
              </div>
            </section>
          )}
          
          <BlogGrid posts={posts || []} />
          
          {/* Bottom Ad Slot - Before Pagination */}
          {mobileAds.length > 2 && mobileAds[2] && (mobileAds[2] as any).adCode ? (
            <section className="w-full py-6 bg-white">
              <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
                <div 
                  className="w-full mx-auto"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '8px'
                  }}
                  dangerouslySetInnerHTML={{ __html: (mobileAds[2] as any).adCode }}
                />
              </div>
            </section>
          ) : (
            <section className="w-full py-6 bg-white">
              <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
                <div 
                  className="w-full mx-auto border-2 border-dashed border-[#D1D5DB] rounded-lg p-6 bg-[#F9FAFB]"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}
                >
                  <h3 className="text-sm font-semibold text-[#6B7280] mb-2">
                    Bottom Ad Slot (100% × 250-280px)
                  </h3>
                  <p className="text-xs text-[#9CA3AF] text-center max-w-md">
                    Add ads with placement &quot;Mobile&quot; in the admin panel to display here. Accepts ads from 250px to 280px height.
                  </p>
                </div>
              </div>
            </section>
          )}
          
          <PaginationControls 
            currentPage={currentPage} 
            totalPages={totalPages}
            totalPosts={totalPosts}
            category={category}
          />
        </div>
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading articles page:", error);
    return (
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#111827] mb-4">Error Loading Articles</h1>
          <p className="text-[#6B7280] mb-4">
            {error instanceof Error ? error.message : "An error occurred while loading the articles page."}
          </p>
          <p className="text-sm text-[#6B7280]">
            Please check your database connection and try again.
          </p>
        </div>
      </div>
    );
  }
}

