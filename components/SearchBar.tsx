"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function SearchBar({ query, onQueryChange }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    onQueryChange(value);
  };

  const handleClear = () => {
    setLocalQuery("");
    onQueryChange("");
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
          <Search className="h-5 w-5" />
        </div>
        <Input
          type="text"
          value={localQuery}
          onChange={handleChange}
          placeholder="Search articles, topics, authors..."
          className="w-full pl-12 pr-12 py-6 text-lg border-2 border-[#E5E7EB] rounded-xl focus:border-[#111827] focus:ring-2 focus:ring-[#111827]/10 transition-all bg-white shadow-sm hover:shadow-md"
          autoFocus
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
