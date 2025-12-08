"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/date-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  authorImage: string | null;
  date: Date;
  readingTime: string | null;
  category: string | null;
  thumbnail: string | null;
  website: {
    id: string;
    name: string;
  };
}

interface PostsListProps {
  initialPosts: Post[];
}

export default function PostsList({ initialPosts }: PostsListProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thumbnail</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Reading Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialPosts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-[#6B7280] py-8">
                No posts found
              </TableCell>
            </TableRow>
          ) : (
            initialPosts.map((post) => {
              const initials = post.author
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <TableRow key={post.id}>
                  <TableCell>
                    {post.thumbnail ? (
                      <div className="relative h-12 w-20 rounded overflow-hidden">
                        <Image
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-20 rounded bg-[#F9FAFB] flex items-center justify-center">
                        <span className="text-xs text-[#6B7280]">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-medium text-[#111827] hover:text-[#111827]/80 line-clamp-2"
                    >
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#6B7280]">
                      {post.website.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.authorImage || ""} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-[#6B7280]">
                        {post.author}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#6B7280]">
                      {formatDate(post.date.toString())}
                    </span>
                  </TableCell>
                  <TableCell>
                    {post.category ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#F9FAFB] text-[#111827]">
                        {post.category}
                      </span>
                    ) : (
                      <span className="text-sm text-[#6B7280]">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-[#6B7280]">
                      {post.readingTime || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

