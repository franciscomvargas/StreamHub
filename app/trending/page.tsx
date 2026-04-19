"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MediaCard } from "@/components/ui/MediaCard";
import { getPosterUrl } from "@/lib/utils";
import type { MediaItem, MediaType } from "@/types";

export default function TrendingPage() {
  const router = useRouter();
  const [content, setContent] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "movies" | "tv">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true);
      setError(null);
      try {
        const items: MediaItem[] = [];

        // Fetch trending movies
        if (activeTab === "all" || activeTab === "movies") {
          const movieRes = await fetch(`/api/tmdb/movie?endpoint=trending&page=1`);
          
          if (!movieRes.ok) {
            const errData = await movieRes.json();
            throw new Error(errData.error || "Failed to fetch trending movies");
          }
          
          const movieData = await movieRes.json();
          const movies = (movieData.results || []).slice(0, 10).map((m: any) => ({
            id: m.id,
            title: m.title,
            poster: getPosterUrl(m.poster_path),
            backdrop: getPosterUrl(m.backdrop_path),
            overview: m.overview,
            rating: m.vote_average,
            releaseDate: m.release_date,
            mediaType: "movie" as MediaType,
            tmdbId: m.id,
          }));
          items.push(...movies);
        }

        // Fetch trending TV shows
        if (activeTab === "all" || activeTab === "tv") {
          const tvRes = await fetch(`/api/tmdb/tv?endpoint=trending&page=1`);
          
          if (!tvRes.ok) {
            const errData = await tvRes.json();
            throw new Error(errData.error || "Failed to fetch trending TV");
          }
          
          const tvData = await tvRes.json();
          const tv = (tvData.results || []).slice(0, 10).map((t: any) => ({
            id: t.id,
            title: t.name,
            poster: getPosterUrl(t.poster_path),
            backdrop: getPosterUrl(t.backdrop_path),
            overview: t.overview,
            rating: t.vote_average,
            releaseDate: t.first_air_date,
            mediaType: "tv" as MediaType,
            tmdbId: t.id,
          }));
          items.push(...tv);
        }

        // Shuffle for "all" tab
        if (activeTab === "all") {
          for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
          }
        }

        setContent(items);
      } catch (err: any) {
        console.error("Error fetching trending:", err);
        setError(err.message || "Failed to load trending content");
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, [activeTab]);

  const handleClick = (item: MediaItem) => {
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
        <h1 className="text-3xl font-bold text-text-primary">Trending</h1>
        
        <div className="flex rounded-xl border border-border bg-surface p-1">
          {(["all", "movies", "tv"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-surface p-6 text-center">
          <p className="text-text-secondary">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {content.map((item, index) => (
            <MediaCard
              key={`${item.mediaType}-${item.id}`}
              item={item}
              onClick={handleClick}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}