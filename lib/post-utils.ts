import { prisma } from "@/lib/prisma";
import type { Post } from "@/data/posts";

// Extended Post type with content
export interface PostWithContent extends Post {
  content?: string;
  sourceUrl?: string;
}

// Convert database post to Post interface format
export function dbPostToPost(dbPost: any): Post {
  const tags = typeof dbPost.tags === "string" 
    ? JSON.parse(dbPost.tags || "[]") 
    : dbPost.tags || [];

  return {
    id: dbPost.id,
    slug: dbPost.slug,
    title: dbPost.title,
    description: dbPost.description || "",
    author: dbPost.author || "Unknown",
    authorImage: dbPost.authorImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
    date: dbPost.date instanceof Date ? dbPost.date.toISOString() : dbPost.date,
    readingTime: dbPost.readingTime || "5 min read",
    category: dbPost.category || "General",
    tags: Array.isArray(tags) ? tags : [],
    thumbnail: dbPost.thumbnail || dbPost.coverImage || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80",
    coverImage: dbPost.coverImage || dbPost.thumbnail || "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=600&fit=crop&q=80",
  };
}

// Convert database post to PostWithContent format
export function dbPostToPostWithContent(dbPost: any): PostWithContent {
  const basePost = dbPostToPost(dbPost);
  return {
    ...basePost,
    content: dbPost.content || undefined,
    sourceUrl: dbPost.sourceUrl || undefined,
  };
}

// Fetch posts from database
export async function getPostsFromDB(limit?: number, skip?: number, category?: string) {
  try {
    let posts;
    
    if (category) {
      // For category filtering, fetch all and filter (since MySQL doesn't support case-insensitive)
      // This is less efficient but necessary for proper filtering
      const allPosts = await prisma.post.findMany({
        orderBy: { date: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          author: true,
          authorImage: true,
          date: true,
          readingTime: true,
          category: true,
          tags: true,
          thumbnail: true,
          coverImage: true,
        },
      });

      const categoryLower = category.toLowerCase();
      const filteredPosts = allPosts.filter(post => {
        const postCategory = (post.category || '').toLowerCase();
        const postTags = typeof post.tags === 'string' 
          ? JSON.parse(post.tags || '[]').join(' ').toLowerCase()
          : Array.isArray(post.tags) 
            ? post.tags.join(' ').toLowerCase()
            : '';
        const postTitle = (post.title || '').toLowerCase();
        const postDescription = (post.description || '').toLowerCase();
        
        return postCategory.includes(categoryLower) ||
               postTags.includes(categoryLower) ||
               postTitle.includes(categoryLower) ||
               postDescription.includes(categoryLower);
      });

      // Apply pagination after filtering
      const startIndex = skip || 0;
      const endIndex = limit ? startIndex + limit : undefined;
      posts = filteredPosts.slice(startIndex, endIndex);
    } else {
      // No category filter - use efficient database pagination
      posts = await prisma.post.findMany({
        orderBy: { date: "desc" },
        take: limit,
        skip: skip,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          author: true,
          authorImage: true,
          date: true,
          readingTime: true,
          category: true,
          tags: true,
          thumbnail: true,
          coverImage: true,
        },
      });
    }

    return posts.map(dbPostToPost);
  } catch (error) {
    console.error("Error fetching posts from database:", error);
    return [];
  }
}

// Search posts by query
export async function searchPosts(query: string, limit: number = 50) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const allPosts = await prisma.post.findMany({
      orderBy: { date: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        author: true,
        authorImage: true,
        date: true,
        readingTime: true,
        category: true,
        tags: true,
        thumbnail: true,
        coverImage: true,
      },
    });

    const queryLower = query.toLowerCase();
    const filteredPosts = allPosts.filter(post => {
      const postTitle = (post.title || '').toLowerCase();
      const postDescription = (post.description || '').toLowerCase();
      const postCategory = (post.category || '').toLowerCase();
      const postTags = typeof post.tags === 'string' 
        ? JSON.parse(post.tags || '[]').join(' ').toLowerCase()
        : Array.isArray(post.tags) 
          ? post.tags.join(' ').toLowerCase()
          : '';
      const postAuthor = (post.author || '').toLowerCase();
      
      return postTitle.includes(queryLower) ||
             postDescription.includes(queryLower) ||
             postCategory.includes(queryLower) ||
             postTags.includes(queryLower) ||
             postAuthor.includes(queryLower);
    });

    return filteredPosts.slice(0, limit).map(dbPostToPost);
  } catch (error) {
    console.error("Error searching posts:", error);
    return [];
  }
}

// Get all unique categories from database
export async function getAllCategories(): Promise<string[]> {
  try {
    const posts = await prisma.post.findMany({
      select: {
        category: true,
      },
      where: {
        category: {
          not: null,
        },
      },
    });

    // Get unique categories
    const categories = new Set<string>();
    posts.forEach((post) => {
      if (post.category) {
        categories.add(post.category);
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get total post count (for pagination)
export async function getPostsCount(category?: string) {
  try {
    if (!category) {
      return await prisma.post.count();
    }

    // For category filtering, we need to fetch and count
    const allPosts = await prisma.post.findMany({
      select: {
        category: true,
        tags: true,
        title: true,
        description: true,
      },
    });

    const categoryLower = category.toLowerCase();
    const filteredCount = allPosts.filter(post => {
      const postCategory = (post.category || '').toLowerCase();
      const postTags = typeof post.tags === 'string' 
        ? JSON.parse(post.tags || '[]').join(' ').toLowerCase()
        : Array.isArray(post.tags) 
          ? post.tags.join(' ').toLowerCase()
          : '';
      const postTitle = (post.title || '').toLowerCase();
      const postDescription = (post.description || '').toLowerCase();
      
      return postCategory.includes(categoryLower) ||
             postTags.includes(categoryLower) ||
             postTitle.includes(categoryLower) ||
             postDescription.includes(categoryLower);
    }).length;

    return filteredCount;
  } catch (error) {
    console.error("Error counting posts:", error);
    return 0;
  }
}

// Fetch stats from database
export async function getStatsFromDB() {
  try {
    const [postCount, websiteCount] = await Promise.all([
      prisma.post.count().catch(() => 0),
      prisma.website.count().catch(() => 0),
    ]);

    return {
      postCount,
      websiteCount,
      authorCount: Math.max(1, Math.floor(postCount / 10)), // Estimate authors
    };
  } catch (error) {
    console.error("Error fetching stats from database:", error);
    return {
      postCount: 0,
      websiteCount: 0,
      authorCount: 0,
    };
  }
}

// Fetch single post by slug
export async function getPostBySlug(slug: string): Promise<PostWithContent | null> {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        content: true,
        author: true,
        authorImage: true,
        date: true,
        readingTime: true,
        category: true,
        tags: true,
        thumbnail: true,
        coverImage: true,
        sourceUrl: true,
      },
    });

    if (!post) return null;
    return dbPostToPostWithContent(post);
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return null;
  }
}

// Fetch ads for a placement (used by blog detail page)
export async function getAdsForPlacement(placement: string, limit: number = 3) {
  try {
    const ads = await prisma.ad.findMany({
      where: { placement, isActive: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return ads;
  } catch (error) {
    console.error("Error fetching ads:", error);
    return [];
  }
}

