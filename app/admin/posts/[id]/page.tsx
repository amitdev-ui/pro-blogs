import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/date-utils";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { website: true },
  });
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const initials = post.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const tags = post.tags ? JSON.parse(post.tags) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/posts"
            className="text-sm text-[#6B7280] hover:text-[#111827] mb-2 inline-block"
          >
            ← Back to Posts
          </Link>
          <h1 className="text-3xl font-bold text-[#111827]">{post.title}</h1>
        </div>
        {post.sourceUrl && (
          <Button asChild variant="outline">
            <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer">
              View Original
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative w-full h-[400px] rounded-xl overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#6B7280]">{post.description}</p>
            </CardContent>
          </Card>

          {/* Content Preview */}
          {post.content && (
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none text-[#374151]"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Post Details */}
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#6B7280]">
                  Website
                </label>
                <p className="text-sm text-[#111827] mt-1">
                  {post.website.name}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-[#6B7280]">
                  Author
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.authorImage || ""} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-[#111827]">{post.author}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#6B7280]">
                  Published Date
                </label>
                <p className="text-sm text-[#111827] mt-1">
                  {formatDate(post.date.toString())}
                </p>
              </div>

              {post.category && (
                <div>
                  <label className="text-xs font-medium text-[#6B7280]">
                    Category
                  </label>
                  <p className="text-sm text-[#111827] mt-1">
                    {post.category}
                  </p>
                </div>
              )}

              {post.readingTime && (
                <div>
                  <label className="text-xs font-medium text-[#6B7280]">
                    Reading Time
                  </label>
                  <p className="text-sm text-[#111827] mt-1">
                    {post.readingTime}
                  </p>
                </div>
              )}

              {tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-[#6B7280]">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-md text-xs font-medium bg-[#F9FAFB] text-[#111827]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Slug:</span>
                <span className="text-[#111827] font-mono">{post.slug}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Created:</span>
                <span className="text-[#111827]">
                  {formatDate(post.createdAt.toString())}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Updated:</span>
                <span className="text-[#111827]">
                  {formatDate(post.updatedAt.toString())}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

