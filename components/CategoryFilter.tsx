"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
}

export default function CategoryFilter({ categories }: CategoryFilterProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";
  const currentPage = searchParams.get("page") || "1";

  const getFilterUrl = (category: string | null) => {
    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    }
    // Reset to page 1 when changing category
    if (category !== currentCategory) {
      params.set("page", "1");
    } else {
      params.set("page", currentPage);
    }
    return `/articles?${params.toString()}`;
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-6 border-b border-[#E5E7EB] bg-white">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center md:justify-between">
            <h3 className="text-sm font-semibold text-[#111827]">Filter by Category</h3>
            {currentCategory && (
              <Link href={getFilterUrl(null)} className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#6B7280] hover:text-[#111827]"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filter
                </Button>
              </Link>
            )}
          </div>
          
          {currentCategory && (
            <div className="flex justify-center md:hidden">
              <Link href={getFilterUrl(null)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#6B7280] hover:text-[#111827]"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filter
                </Button>
              </Link>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {/* All Posts Button */}
            <Link href={getFilterUrl(null)}>
              <Button
                variant={!currentCategory ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs rounded-full",
                  !currentCategory
                    ? "bg-[#111827] text-white hover:bg-[#111827]/90"
                    : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                )}
              >
                All Posts
              </Button>
            </Link>

            {/* Category Buttons */}
            {categories.map((category) => {
              const isActive = currentCategory.toLowerCase() === category.toLowerCase();
              return (
                <Link key={category} href={getFilterUrl(category)}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs rounded-full",
                      isActive
                        ? "bg-[#111827] text-white hover:bg-[#111827]/90"
                        : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                    )}
                  >
                    {category}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

