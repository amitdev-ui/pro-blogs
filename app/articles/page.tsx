import HeroSection from "@/components/HeroSection";
import FeaturedArticle from "@/components/FeaturedArticle";
import BlogGrid from "@/components/BlogGrid";
import CategoryFilter from "@/components/CategoryFilter";
import { getPostsFromDB, getPostsCount, getAllCategories } from "@/lib/post-utils";
import PaginationControls from "@/components/PaginationControls";
import { Suspense } from "react";

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
    const [posts, totalPosts, categories] = await Promise.all([
      getPostsFromDB(postsPerPage, skip, category),
      getPostsCount(category),
      getAllCategories(),
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
          <CategoryFilter categories={categories || []} />
          <FeaturedArticle posts={posts || []} />
          <BlogGrid posts={posts || []} />
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

