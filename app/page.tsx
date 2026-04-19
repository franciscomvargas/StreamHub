"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, ChevronRight, Star, TrendingUp, Film, Tv } from "lucide-react";
import { MediaCard } from "@/components/ui/MediaCard";
import { cn, getPosterUrl, formatRating } from "@/lib/utils";
import type { MediaItem } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [tvShows, setTVShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<MediaItem | null>(null);

  const tabs = [
    { id: "all", label: "For You", icon: TrendingUp },
    { id: "movies", label: "Movies", icon: Film },
    { id: "tv", label: "TV Shows", icon: Tv },
  ] as const;

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      try {
        // Fetch movies
        const movieRes = await fetch("/api/tmdb/movie?endpoint=trending");
        const movieData = await movieRes.json();
        const mappedMovies: MediaItem[] = (movieData.results || []).map(
          (m: {
            id: number;
            title: string;
            name?: string;
            poster_path: string | null;
            backdrop_path: string | null;
            overview: string;
            vote_average: number;
            release_date: string;
            media_type: string;
          }) => ({
            id: m.id,
            title: m.title || m.name || "",
            poster: getPosterUrl(m.poster_path, "large"),
            backdrop: getPosterUrl(m.backdrop_path, "large"),
            overview: m.overview,
            rating: m.vote_average,
            releaseDate: m.release_date,
            mediaType: "movie",
            tmdbId: m.id,
          })
        );
        setMovies(mappedMovies);

        // Fetch TV shows
        const tvRes = await fetch("/api/tmdb/tv?endpoint=trending");
        const tvData = await tvRes.json();
        const mappedTV: MediaItem[] = (tvData.results || []).map(
          (t: {
            id: number;
            name: string;
            poster_path: string | null;
            backdrop_path: string | null;
            overview: string;
            vote_average: number;
            first_air_date: string;
          }) => ({
            id: t.id,
            title: t.name,
            poster: getPosterUrl(t.poster_path, "large"),
            backdrop: getPosterUrl(t.backdrop_path, "large"),
            overview: t.overview,
            rating: t.vote_average,
            releaseDate: t.first_air_date,
            mediaType: "tv",
            tmdbId: t.id,
          })
        );
        setTVShows(mappedTV);

        // Set featured (first trending movie)
        if (mappedMovies.length > 0) {
          setFeatured(mappedMovies[0]);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, []);

  const handleMediaClick = (item: MediaItem) => {
    router.push(`/${item.mediaType}/${item.tmdbId}`);
  };

  const getCurrentContent = () => {
    switch (activeTab) {
      case "movies":
        return movies;
      case "tv":
        return tvShows;
      default:
        return [...movies.slice(0, 6), ...tvShows.slice(0, 4)];
    }
  };

  const content = getCurrentContent();

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Hero Skeleton */}
        <div className="relative h-[60vh] w-full animate-pulse rounded-2xl bg-surface" />

        {/* Content Skeletons */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] animate-pulse rounded-xl bg-surface" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      {featured && (
        <section className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl"
          >
            {/* Backdrop */}
            <div className="absolute inset-0">
              {featured.backdrop && (
                <img
                  src={featured.backdrop}
                  alt={featured.title}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative flex min-h-[50vh] flex-col justify-end p-6 md:p-10">
              <div className="max-w-2xl space-y-4">
                {/* Badge */}
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                    Trending Now
                  </span>
                  {featured.rating && (
                    <span className="flex items-center gap-1 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                      <Star className="h-3 w-3" />
                      {formatRating(featured.rating)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold leading-tight text-text-primary md:text-5xl lg:text-6xl"
                >
                  {featured.title}
                </motion.h1>

                {/* Overview */}
                <p className="line-clamp-3 text-sm text-text-secondary md:text-base">
                  {featured.overview}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => handleMediaClick(featured)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
                  >
                    <Play className="h-5 w-5" />
                    Watch Now
                  </button>
                  <button className="flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-6 py-3 font-medium text-text-primary transition-colors hover:bg-surface-hover">
                    More Info
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Content Tabs */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              const typeMap: Record<string, string> = {
                all: "all",
                movies: "movie",
                tv: "tv",
              };
              router.push(`/browse?type=${typeMap[activeTab]}`);
            }}
            className="flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Media Grid */}
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
      </section>
    </div>
  );
}