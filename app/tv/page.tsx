"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MediaCard } from "@/components/ui/MediaCard";
import { getPosterUrl } from "@/lib/utils";
import type { MediaItem, MediaType } from "@/types";
import { FilterBar } from "@/components/ui/FilterBar";

interface FilterState {
  genre: number | null;
  year: number | null;
  sortBy: string;
  minRating: number | null;
}

export default function TVPage() {
  const router = useRouter();
  const [shows, setShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || loading || !hasMoreRef.current || isLoadingRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMoreRef.current && !isLoadingRef.current) {
          isLoadingRef.current = true;
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading]);
  const [filters, setFilters] = useState<FilterState>({
    genre: null,
    year: null,
    sortBy: "popularity",
    minRating: null,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track previous filters and prevent infinite loop
  const prevFiltersRef = useRef<string>("");
  const isInitialized = useRef(false);

  useEffect(() => {
    async function fetchShows() {
      setLoading(true);
      setError(null);
      try {
        const sortMap: Record<string, string> = {
          popularity: "popular",
          rating: "top_rated",
          trending: "trending",
          new: "on_the_air",
        };

        const endpoint = sortMap[filters.sortBy] || "popular";
        let url = `/api/tmdb/tv?endpoint=${endpoint}&page=${page}`;
        
        if (filters.genre) {
          url += `&with_genres=${filters.genre}`;
        }
        if (filters.year) {
          url += `&year=${filters.year}`;
        }
        if (filters.minRating) {
          url += `&vote_average.gte=${filters.minRating}`;
        }
        
        const response = await fetch(url);

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to fetch TV shows");
        }

        const data = await response.json();

        const mapped: MediaItem[] = (data.results || []).map((t: any) => ({
          id: t.id,
          title: t.name,
          poster: getPosterUrl(t.poster_path),
          backdrop: getPosterUrl(t.backdrop_path),
          overview: t.overview,
          rating: t.vote_average,
          releaseDate: t.first_air_date,
          mediaType: "tv" as MediaType,
          tmdbId: t.id,
          seasonCount: t.number_of_seasons,
        }));

        if (page === 1) {
          setShows(mapped);
        } else {
          setShows((prev) => [...prev, ...mapped]);
        }

        // Check if there are more results
        const totalPages = data.total_pages || 1;
        hasMoreRef.current = page < totalPages;
      } catch (err: any) {
        console.error("Error fetching shows:", err);
        setError(err.message || "Failed to load TV shows");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }

    // Check if filters changed
    const filtersKey = `${filters.genre}-${filters.year}-${filters.sortBy}-${filters.minRating}`;
    if (prevFiltersRef.current !== filtersKey || isInitialized.current) {
      prevFiltersRef.current = filtersKey;
      isInitialized.current = true;
      fetchShows();
    }
  }, [page, filters.sortBy, filters.genre, filters.year, filters.minRating]);

  const handleFilterChange = (newFilters: any) => {
    const filtersKey = `${newFilters.genre}-${newFilters.year}-${newFilters.sortBy}-${newFilters.minRating}`;
    if (prevFiltersRef.current !== filtersKey) {
      setFilters({
        genre: newFilters.genre,
        year: newFilters.year,
        sortBy: newFilters.sortBy,
        minRating: newFilters.minRating,
      });
      setPage(1);
      hasMoreRef.current = true;
      isLoadingRef.current = false;
    }
  };

  const handleClick = (item: MediaItem) => {
    router.push(`/tv/${item.tmdbId}`);
  };

  if (loading && shows.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-primary">TV Shows</h1>
        <FilterBar onFilterChange={handleFilterChange} mediaType="tv" />
      </div>

      {error ? (
        <div className="rounded-xl bg-surface p-6 text-center">
          <p className="text-text-secondary">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {shows.map((show, index) => (
              <MediaCard
                key={show.id}
                item={show}
                onClick={handleClick}
                index={index}
              />
            ))}
          </div>

          {shows.length > 0 && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {loading && <div className="text-text-secondary">Loading more...</div>}
              {!loading && !hasMoreRef.current && (
                <div className="text-text-muted">No more results</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}