"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import type { Post } from "@/data/posts";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const searchPosts = async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.posts || []);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    const timeoutId = setTimeout(() => {
      searchPosts(query);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (query) {
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
    } else {
      router.replace("/search", { scroll: false });
    }
  }, [query, router]);

  return (
    <main className="w-full min-h-screen bg-gradient-to-b from-white to-[#F9FAFB]">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-8 pt-8 md:pt-12 pb-16 md:pb-20">
        <div className="mb-8 md:mb-12">
          <SearchBar query={query} onQueryChange={setQuery} />
        </div>
        <SearchResults query={query} results={results} isLoading={isLoading} />
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
