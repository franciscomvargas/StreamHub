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

type MediaTypeFilter = MediaType | "all";

export default function BrowsePage() {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<MediaTypeFilter>("all");
  const [content, setContent] = useState<MediaItem[]>([]);
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
  const [isInitialized, setIsInitialized] = useState(false);

  const types = [
    { value: "all", label: "All" },
    { value: "movie", label: "Movies" },
    { value: "tv", label: "TV Shows" },
  ] as const;

  // Use ref to track previous filters and prevent infinite loop
  const prevFiltersRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  // Initialize from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get("type");
    if (urlType && ["all", "movie", "tv"].includes(urlType)) {
      setMediaType(urlType as MediaTypeFilter);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    async function fetchContent() {
      setLoading(true);
      setError(null);
      try {
        // For "all", fetch both movies and TV shows
        if (mediaType === "all") {
          const sortMap: Record<string, string> = {
            popularity: "popularity.desc",
            rating: "vote_average.desc",
            trending: "popularity.desc",
            new: "primary_release_date.desc",
          };
          const sortBy = sortMap[filters.sortBy] || "popularity.desc";
          
          // Build filter params
          const genreParam = filters.genre ? `&with_genres=${filters.genre}` : "";
          const yearParam = filters.year ? `&primary_release_year=${filters.year}` : "";
          const ratingParam = filters.minRating ? `&vote_average.gte=${filters.minRating}` : "";
          
          // Fetch movies and TV shows in parallel
          const [movieRes, tvRes] = await Promise.all([
            fetch(`/api/tmdb/movie?endpoint=discover&sort_by=${sortBy}${genreParam}${yearParam}${ratingParam}&page=${page}`),
            fetch(`/api/tmdb/tv?endpoint=discover&sort_by=${sortBy}${genreParam}${filters.year ? `&first_air_date_year=${filters.year}` : ""}${ratingParam}&page=${page}`),
          ]);

          const [movieData, tvData] = await Promise.all([
            movieRes.json(),
            tvRes.json(),
          ]);

          const mappedMovies: MediaItem[] = (movieData.results || []).map((r: any) => ({
            id: r.id,
            title: r.title || r.name || "",
            poster: getPosterUrl(r.poster_path),
            backdrop: getPosterUrl(r.backdrop_path),
            overview: r.overview,
            rating: r.vote_average,
            releaseDate: r.release_date || r.first_air_date,
            mediaType: "movie" as MediaType,
            tmdbId: r.id,
            episodeCount: r.number_of_episodes,
            seasonCount: r.number_of_seasons,
          }));

          const mappedTV: MediaItem[] = (tvData.results || []).map((r: any) => ({
            id: r.id,
            title: r.title || r.name || "",
            poster: getPosterUrl(r.poster_path),
            backdrop: getPosterUrl(r.backdrop_path),
            overview: r.overview,
            rating: r.vote_average,
            releaseDate: r.release_date || r.first_air_date,
            mediaType: "tv" as MediaType,
            tmdbId: r.id,
            episodeCount: r.number_of_episodes,
            seasonCount: r.number_of_seasons,
          }));

          // Combine and sort by rating
          const allContent = [...mappedMovies, ...mappedTV].sort((a, b) => 
            (b.rating || 0) - (a.rating || 0)
          );

          if (page === 1) {
            setContent(allContent);
          } else {
            setContent((prev) => [...prev, ...allContent]);
          }
        } else {
          const sortMap: Record<string, string> = {
            popularity: "popularity.desc",
            rating: "vote_average.desc",
            trending: "popularity.desc",
            new: mediaType === "movie" ? "primary_release_date.desc" : "first_air_date.desc",
          };

          const sortBy = sortMap[filters.sortBy] || "popularity.desc";
          const apiType = mediaType === "movie" ? "movie" : "tv";
          
          // Build filter params
          const genreParam = filters.genre ? `&with_genres=${filters.genre}` : "";
          const yearParam = filters.year ? (mediaType === "movie" ? `&primary_release_year=${filters.year}` : `&first_air_date_year=${filters.year}`) : "";
          const ratingParam = filters.minRating ? `&vote_average.gte=${filters.minRating}` : "";
          
          let url = `/api/tmdb/${apiType}?endpoint=discover&sort_by=${sortBy}${genreParam}${yearParam}${ratingParam}&page=${page}`;
          
          const response = await fetch(url);

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to fetch content");
          }

          const data = await response.json();

          const mapped: MediaItem[] = (data.results || []).map((r: any) => ({
            id: r.id,
            title: r.title || r.name || "",
            poster: getPosterUrl(r.poster_path),
            backdrop: getPosterUrl(r.backdrop_path),
            overview: r.overview,
            rating: r.vote_average,
            releaseDate: r.release_date || r.first_air_date,
            mediaType: mediaType as MediaType,
            tmdbId: r.id,
            episodeCount: r.number_of_episodes,
            seasonCount: r.number_of_seasons,
          }));

          if (page === 1) {
            setContent(mapped);
          } else {
            setContent((prev) => [...prev, ...mapped]);
          }

          // Check if there are more results
          const totalPages = data.total_pages || 1;
          hasMoreRef.current = page < totalPages;
        }
      } catch (err: any) {
        console.error("Error fetching content:", err);
        setError(err.message || "Failed to load content");
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    }

    // Check if filters or media type changed
    const filtersKey = `${mediaType}-${filters.genre}-${filters.year}-${filters.sortBy}-${filters.minRating}`;
    if (prevFiltersRef.current !== filtersKey || isInitializedRef.current) {
      prevFiltersRef.current = filtersKey;
      isInitializedRef.current = true;
      fetchContent();
    }
  }, [mediaType, page, filters.sortBy, filters.genre, filters.year, filters.minRating, isInitialized]);

  const handleFilterChange = (newFilters: any) => {
    const filtersKey = `${mediaType}-${newFilters.genre}-${newFilters.year}-${newFilters.sortBy}-${newFilters.minRating}`;
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

  const handleMediaClick = (item: MediaItem) => {
    router.push(`/${item.mediaType}/${item.tmdbId}`);
  };

  if (loading && content.length === 0) {
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
        <h1 className="text-3xl font-bold text-text-primary">Browse</h1>

        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-xl border border-border bg-surface p-1">
            {types.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  setMediaType(type.value as MediaType);
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  mediaType === type.value
                    ? "bg-primary text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <FilterBar 
            onFilterChange={handleFilterChange} 
            mediaType={mediaType} 
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-surface p-6 text-center">
          <p className="text-text-secondary">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {content.map((item, index) => (
              <MediaCard
                key={`${item.mediaType}-${item.id}`}
                item={item}
                onClick={handleMediaClick}
                index={index}
              />
            ))}
          </div>

          {content.length > 0 && (
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