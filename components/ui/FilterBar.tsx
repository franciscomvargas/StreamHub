"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaType } from "@/types";

interface FilterOption {
  id: number | string;
  name: string;
}

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
  mediaType?: MediaType | "all";
}

interface FilterState {
  genre: number | null;
  year: number | null;
  sortBy: string;
  minRating: number | null;
}

const sortOptions = [
  { value: "popularity", label: "Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "new", label: "Newest" },
  { value: "trending", label: "Trending" },
];

const ratingOptions = [
  { value: 7, label: "7+" },
  { value: 8, label: "8+" },
  { value: 8.5, label: "8.5+" },
  { value: 9, label: "9+" },
];

const years = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year, label: year.toString() };
});

// TMDB genre IDs for movies
const movieGenres: FilterOption[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

// TMDB genre IDs for TV shows
const tvGenres: FilterOption[] = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

// Combined genres for "all" media type (merged movie + TV, removing duplicates)
const allGenres: FilterOption[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
  // TV-only genres
  { id: 10762, name: "Kids" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
];

export function FilterBar({ onFilterChange, mediaType = "all" }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    genre: null,
    year: null,
    sortBy: "popularity",
    minRating: null,
  });

  // Select genres based on mediaType
  const [genres, setGenres] = useState<FilterOption[]>(movieGenres);

  // Update genres when mediaType changes and clear genre filter
  useEffect(() => {
    let newGenres: FilterOption[];
    if (mediaType === "tv") {
      newGenres = tvGenres;
    } else if (mediaType === "movie") {
      newGenres = movieGenres;
    } else {
      newGenres = allGenres;
    }
    setGenres(newGenres);
    // Clear genre filter when switching media type
    setFilters((prev) => ({ ...prev, genre: null }));
  }, [mediaType]);

  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      genre: null,
      year: null,
      sortBy: "popularity",
      minRating: null,
    });
  };

  const hasActiveFilters =
    filters.genre !== null || filters.year !== null || filters.minRating !== null;

  return (
    <div className="relative z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-hover",
          hasActiveFilters && "border-primary bg-primary/10"
        )}
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
            {(filters.genre ? 1 : 0) + (filters.year ? 1 : 0) + (filters.minRating ? 1 : 0)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-surface p-4 shadow-2xl"
          >
            <div className="space-y-4">
              {/* Sort By */}
              <div>
                <label className="mb-2 block text-xs font-medium text-text-muted uppercase">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((sort) => (
                    <button
                      key={sort.value}
                      onClick={() => updateFilter("sortBy", sort.value)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        filters.sortBy === sort.value
                          ? "bg-primary text-white"
                          : "bg-surface-hover text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {sort.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="mb-2 block text-xs font-medium text-text-muted uppercase">
                  Year
                </label>
                <select
                  value={filters.year || ""}
                  onChange={(e) =>
                    updateFilter("year", e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year.value} value={year.value}>
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div>
                <label className="mb-2 block text-xs font-medium text-text-muted uppercase">
                  Min Rating
                </label>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating.value}
                      onClick={() =>
                        updateFilter(
                          "minRating",
                          filters.minRating === rating.value ? null : rating.value
                        )
                      }
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        filters.minRating === rating.value
                          ? "bg-primary text-white"
                          : "bg-surface-hover text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {rating.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre */}
              <div>
                <label className="mb-2 block text-xs font-medium text-text-muted uppercase">
                  Genre
                </label>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() =>
                        updateFilter(
                          "genre",
                          filters.genre === genre.id ? null : (genre.id as number)
                        )
                      }
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        filters.genre === genre.id
                          ? "bg-primary text-white"
                          : "bg-surface-hover text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}