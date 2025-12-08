import BlogCard from "./BlogCard";
import type { Post } from "@/data/posts";

interface BlogGridProps {
  posts: Post[];
}

export default function BlogGrid({ posts }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <section className="w-full">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-8 pt-12 md:pt-16">
          <div className="text-center py-16">
            <p className="text-lg text-[#6B7280]">No articles found. Check back soon for new content!</p>
          </div>
        </div>
      </section>
    );
  }

  // Organize posts into rows of 3 cards each (10 rows = 30 posts)
  const rows: typeof posts[] = [];
  for (let i = 0; i < posts.length; i += 3) {
    rows.push(posts.slice(i, i + 3));
  }

  return (
    <section className="w-full">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8 pt-12 md:pt-16">
        <div className="space-y-8">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {row.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
