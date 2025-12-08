import { prisma } from "@/lib/prisma";
import PostsList from "@/components/admin/PostsList";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function getPosts(searchParams: { website?: string; category?: string }) {
  const where: any = {};

  if (searchParams.website) {
    where.websiteId = searchParams.website;
  }

  if (searchParams.category) {
    where.category = searchParams.category;
  }

  return prisma.post.findMany({
    where,
    include: { website: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function getWebsites() {
  return prisma.website.findMany({
    orderBy: { name: "asc" },
  });
}

async function getCategories() {
  const posts = await prisma.post.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  return posts
    .map((p) => p.category)
    .filter((c): c is string => c !== null);
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ website?: string; category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const posts = await getPosts(params);
  const websites = await getWebsites();
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#111827]">Posts</h1>
        <p className="text-[#6B7280] mt-1">
          View and manage all scraped posts
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search posts..."
          defaultValue={params.search || ""}
          className="flex-1"
        />
        <Select defaultValue={params.website || "all"}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Websites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Websites</SelectItem>
            {websites.map((website) => (
              <SelectItem key={website.id} value={website.id}>
                {website.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={params.category || "all"}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Posts List */}
      <PostsList initialPosts={posts} />
    </div>
  );
}

