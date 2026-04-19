"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MediaCard } from "@/components/ui/MediaCard";
import { getPosterUrl } from "@/lib/utils";
import type { MediaItem, MediaType } from "@/types";
import { Search } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || loading || !hasMore || isLoadingRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  // Initialize query from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlQuery = params.get("q") || "";
    setQuery(urlQuery);
    setIsInitialized(true);
  }, []);

  // Search function for pagination
  const fetchSearch = useCallback(async (searchQuery: string, searchPage: number) => {
    if (!searchQuery.trim()) return;

    try {
      // Map "movies" to "movie" for API
      let typeParam: string;
      if (activeTab === "all") {
        typeParam = "all";
      } else if (activeTab === "movies") {
        typeParam = "movie";
      } else {
        typeParam = activeTab;
      }
      
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&page=${searchPage}&type=${typeParam}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      const mapped: MediaItem[] = (data.results || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        poster: r.poster || (r.poster_path ? getPosterUrl(r.poster_path) : undefined),
        backdrop: r.backdrop || (r.backdrop_path ? getPosterUrl(r.backdrop_path) : undefined),
        overview: r.overview,
        rating: r.rating,
        releaseDate: r.releaseDate || r.release_date,
        mediaType: r.mediaType as MediaType,
        tmdbId: r.tmdbId,
      }));

      if (searchPage === 1) {
        setResults(mapped);
      } else {
        setResults((prev) => [...prev, ...mapped]);
      }

      setHasMore(data.results?.length >= 10);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search");
    }
  }, [activeTab]);

  // Debounced search when query or tab changes
  useEffect(() => {
    if (!isInitialized) return;
    
    const searchQuery = query.trim();
    if (!searchQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(() => {
      fetchSearch(searchQuery, 1).finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, activeTab, isInitialized, fetchSearch]);

  const handleMediaClick = (item: MediaItem) => {
    router.push(`/${item.mediaType}/${item.tmdbId}`);
  };

  const handleTabChange = (tab: "all" | "movies" | "tv") => {
    setActiveTab(tab);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);
    fetchSearch(query, nextPage).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies and TV shows..."
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 pl-12 text-lg text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Tabs */}
      {query && (
        <div className="flex gap-2">
          {(["all", "movies", "tv"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {error ? (
        <div className="rounded-xl bg-surface p-6 text-center">
          <p className="text-text-secondary">{error}</p>
        </div>
      ) : !query ? (
        <div className="rounded-xl bg-surface p-6 text-center">
          <p className="text-text-secondary">Enter a search term to find movies and TV shows</p>
        </div>
      ) : loading && results.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl bg-surface p-6 text-center">
          <p className="text-text-secondary">No results found for &quot;{query}&quot;</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((item, index) => (
              <MediaCard
                key={`${item.mediaType}-${item.id}-${index}`}
                item={item}
                onClick={handleMediaClick}
                index={index}
              />
            ))}
          </div>

          {results.length > 0 && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loading && <div className="text-text-secondary">Loading more...</div>}
              {!loading && !hasMore && (
                <div className="text-text-muted">No more results</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}