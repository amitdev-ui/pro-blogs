"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  category?: string;
}

export default function PaginationControls({ 
  currentPage, 
  totalPages,
  totalPosts,
  category 
}: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", page.toString());
    return `/articles?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <section className="w-full py-12 md:py-16 bg-white">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="flex items-center justify-center gap-2">
          {/* Previous Button */}
          <Button
            asChild
            variant="outline"
            className="border-[#E5E7EB] hover:bg-[#F9FAFB]"
            disabled={currentPage === 1}
          >
            {currentPage > 1 ? (
              <Link href={getPageUrl(currentPage - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            ) : (
              <span className="opacity-50 cursor-not-allowed">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </span>
            )}
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-3 py-2 text-[#6B7280]"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={
                    isActive
                      ? "bg-[#111827] text-white hover:bg-[#111827]/90 min-w-[40px]"
                      : "hover:bg-[#F9FAFB] text-[#111827] min-w-[40px]"
                  }
                >
                  <Link href={getPageUrl(pageNum)}>{pageNum}</Link>
                </Button>
              );
            })}
          </div>

          {/* Next Button */}
          <Button
            asChild
            variant="outline"
            className="border-[#E5E7EB] hover:bg-[#F9FAFB]"
            disabled={currentPage === totalPages}
          >
            {currentPage < totalPages ? (
              <Link href={getPageUrl(currentPage + 1)}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            ) : (
              <span className="opacity-50 cursor-not-allowed">
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            )}
          </Button>
        </div>

        {/* Page Info */}
        <div className="text-center mt-6">
          <p className="text-sm text-[#6B7280]">
            Page {currentPage} of {totalPages} • Showing {Math.min(60, Math.max(0, totalPosts - (currentPage - 1) * 60))} of {totalPosts} posts
          </p>
        </div>
      </div>
    </section>
  );
}

