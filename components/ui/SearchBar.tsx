"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";
import { cn, debounce } from "@/lib/utils";
import type { MediaItem } from "@/types";

interface SearchResult {
  id: number;
  title: string;
  poster?: string;
  mediaType: "movie" | "tv";
  tmdbId?: number;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search when query changes using useEffect
  useEffect(() => {
    const searchQuery = query.trim();
    if (!searchQuery) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setSelectedIndex(0);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&type=all`
        );
        const data = await response.json();
        const searchResults = data.results || [];
        setResults(searchResults);
        // Show dropdown only if we have results
        setIsOpen(searchResults.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // If dropdown is open and has results and a valid selection, use it
      if (isOpen && results.length > 0 && results[selectedIndex]) {
        const result = results[selectedIndex];
        router.push(`/${result.mediaType}/${result.tmdbId}`);
      } else {
        // Otherwise go to search page with query
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      // Always navigate to search page unless using arrow keys to select
      e.preventDefault();
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative z-50 w-full max-w-xl">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            ) : query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="text-text-muted hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          >
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.mediaType}-${result.id}`}
                  onClick={() => {
                    router.push(
                      `/${result.mediaType}/${result.tmdbId}`
                    );
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover",
                    index === selectedIndex && "bg-surface-hover"
                  )}
                >
                  <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-border">
                    {result.poster && (
                      <img
                        src={result.poster}
                        alt={result.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-text-primary">
                      {result.title}
                    </p>
                    <p className="text-xs text-text-muted capitalize">
                      {result.mediaType}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}