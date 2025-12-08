export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  author: string;
  authorImage: string;
  date: string;
  readingTime: string;
  category: string;
  tags: string[];
  thumbnail: string;
  coverImage: string;
}

export const posts: Post[] = [
  {
    id: "1",
    slug: "the-future-of-retail-design",
    title: "The Future of Retail Design: A Conversation with Industry Leaders",
    description:
      "Discover how leading retail designers are shaping the future of shopping experiences through innovative design, technology integration, and customer-centric approaches.",
    author: "Frankie Sullivan",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
    date: "2025-04-10",
    readingTime: "12 min read",
    category: "Design",
    tags: ["Design", "Retail", "Interviews"],
    thumbnail:
      "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "2",
    slug: "photography-inspiration-2025",
    title: "10 Photography Inspirations for 2025",
    description:
      "A curated look at what's inspiring photographers across the globe this year. Discover the latest trends, techniques, and creative approaches.",
    author: "Lana Reed",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
    date: "2025-03-22",
    readingTime: "8 min read",
    category: "Photography",
    tags: ["Photography", "Inspiration"],
    thumbnail:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "3",
    slug: "creative-studios-to-watch",
    title: "Creative Studios to Watch in 2025",
    description:
      "Studios across the world are redefining creative expression with cutting-edge visuals and bold concepts. Explore the most innovative studios shaping the industry.",
    author: "Marcus Lane",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
    date: "2025-02-15",
    readingTime: "10 min read",
    category: "Creative",
    tags: ["Studios", "Creative"],
    thumbnail:
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "4",
    slug: "art-of-minimalist-design",
    title: "The Art of Minimalist Design: Less is More",
    description:
      "Explore how minimalist design principles can transform your creative projects. Learn from industry leaders and discover practical techniques.",
    author: "Sarah Chen",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80",
    date: "2025-04-15",
    readingTime: "5 min read",
    category: "Design",
    tags: ["Design", "Minimalism"],
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "5",
    slug: "photography-trends-modern-world",
    title: "Photography Trends: Capturing the Modern World",
    description:
      "Discover the latest trends in photography and how modern photographers are pushing boundaries with innovative techniques and styles.",
    author: "Michael Torres",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80",
    date: "2025-04-12",
    readingTime: "7 min read",
    category: "Photography",
    tags: ["Photography", "Trends"],
    thumbnail:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "6",
    slug: "architectural-innovation-urban",
    title: "Architectural Innovation in Urban Spaces",
    description:
      "How contemporary architects are reimagining urban environments to create sustainable, beautiful, and functional spaces for modern living.",
    author: "Emma Wilson",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80",
    date: "2025-04-10",
    readingTime: "6 min read",
    category: "Architecture",
    tags: ["Architecture", "Urban"],
    thumbnail:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "7",
    slug: "digital-art-technology-future",
    title: "Digital Art and Technology: The Future of Creativity",
    description:
      "Exploring the intersection of digital art and technology, and how new tools are empowering artists to create groundbreaking work.",
    author: "David Kim",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80",
    date: "2025-04-08",
    readingTime: "8 min read",
    category: "Digital Art",
    tags: ["Digital Art", "Technology"],
    thumbnail:
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "8",
    slug: "sustainable-design-practices",
    title: "Sustainable Design Practices for Modern Studios",
    description:
      "Learn how design studios are incorporating sustainable practices into their workflows, reducing environmental impact while maintaining creativity.",
    author: "Lisa Anderson",
    authorImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&q=80",
    date: "2025-04-05",
    readingTime: "6 min read",
    category: "Design",
    tags: ["Sustainability", "Design"],
    thumbnail:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=1200&h=600&fit=crop&q=80",
  },
  {
    id: "9",
    slug: "interior-design-inspiring-spaces",
    title: "Interior Design: Creating Spaces That Inspire",
    description:
      "Discover how top interior designers create spaces that inspire creativity and well-being. Learn about color theory, lighting, and spatial design.",
    author: "Olivia Brown",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
    date: "2025-04-01",
    readingTime: "6 min read",
    tags: ["Interior Design", "Spaces"],
    category: "Design",
    thumbnail:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=500&fit=crop&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=600&fit=crop&q=80",
  },
];
