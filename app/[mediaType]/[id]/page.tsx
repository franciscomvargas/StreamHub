"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Play,
  Plus,
  Star,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Share2,
  ThumbsUp,
  List,
} from "lucide-react";
import { VideasyPlayer } from "@/components/player/VideasyPlayer";
import { MediaCard } from "@/components/ui/MediaCard";
import {
  cn,
  getPosterUrl,
  formatDate,
  formatRating,
  getWatchProgress,
} from "@/lib/utils";
import type { MediaItem, Season, Episode, MediaType } from "@/types";

interface MediaPageContentProps {
  mediaType: string;
  id: string;
}

function MediaPageContent({ mediaType, id }: MediaPageContentProps) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"episodes" | "similar" | "info">("episodes");
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);

  const isTV = mediaType === "tv";
  const mediaId = parseInt(id);

  useEffect(() => {
    async function fetchMediaDetails() {
      setLoading(true);
      try {
        // Fetch movie/TV from internal API route
        const endpoint = isTV ? "tv" : "movie";
        const response = await fetch(
          `/api/tmdb/detail?mediaType=${endpoint}&id=${mediaId}`
        );

        if (!response.ok) {
          const errData = await response.json();
          console.error("Error fetching media:", errData.error);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.name || data.title) {
          setMedia({
            id: data.id,
            title: data.title || data.name,
            poster: getPosterUrl(data.poster_path, "large"),
            backdrop: getPosterUrl(data.backdrop_path, "large"),
            overview: data.overview,
            rating: data.vote_average,
            releaseDate: data.release_date || data.first_air_date,
            mediaType: isTV ? "tv" : "movie",
            tmdbId: data.id,
            episodeCount: data.number_of_episodes,
            seasonCount: data.number_of_seasons,
            status: data.status,
            genres: data.genres,
          });

          // Fetch seasons for TV shows
          if (isTV && data.seasons) {
            const mappedSeasons: Season[] = data.seasons
              .filter((s: any) => s.season_number > 0)
              .map((s: any) => ({
                seasonNumber: s.season_number,
                title: s.name,
                overview: s.overview,
                poster: getPosterUrl(s.poster_path),
              }));
            setSeasons(mappedSeasons);

            // Fetch episodes for first season
            if (mappedSeasons.length > 0) {
              await fetchEpisodes(mediaId, 1);
            }
          }

          // Fetch recommendations
          await fetchRecommendations(
            isTV ? "tv" : "movie",
            data.genres?.map((g: any) => g.id) || []
          );
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchEpisodes(tmdbId: number, seasonNum: number) {
      try {
        const response = await fetch(
          `/api/tmdb/season?tvId=${tmdbId}&seasonNumber=${seasonNum}`
        );
        if (!response.ok) return;

        const data = await response.json();

        const mappedEpisodes: Episode[] = (data.episodes || []).map(
          (e: any) => ({
            id: e.id,
            episodeNumber: e.episode_number,
            seasonNumber: seasonNum,
            title: e.name,
            overview: e.overview,
            stillPath: e.still_path,
            rating: e.vote_average,
            airDate: e.air_date,
          })
        );
        setEpisodes(mappedEpisodes);
      } catch (error) {
        console.error("Error fetching episodes:", error);
      }
    }

    async function fetchRecommendations(type: string, genreIds: (number | string)[]) {
      try {
        // Use TMDB for all types (anime, tv, movie)
        const genreParam = genreIds.slice(0, 2).join(",");
        const response = await fetch(
          `/api/tmdb/discover?mediaType=${type}&genres=${genreParam}`
        );
        if (!response.ok) return;
        
        const data = await response.json();

        const recs: MediaItem[] = (data.results || []).slice(0, 6).map(
          (r: any) => ({
            id: r.id,
            title: r.title || r.name || "",
            poster: getPosterUrl(r.poster_path),
            backdrop: getPosterUrl(r.backdrop_path),
            overview: r.overview,
            rating: r.vote_average,
            releaseDate: r.release_date || r.first_air_date,
            mediaType: (r.media_type as MediaType) || (type === "tv" ? "tv" : "movie"),
            tmdbId: r.id,
          })
        );
        setRecommendations(recs);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    }

    fetchMediaDetails();
  }, [mediaId, isTV]);

const handleSeasonChange = async (seasonNum: number, seasonData?: Season) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1); // Reset to episode 1 when changing season
    
    // Use TMDB API for both anime and TV shows
    const response = await fetch(
      `/api/tmdb/season?tvId=${mediaId}&seasonNumber=${seasonNum}`
    );
    if (!response.ok) return;

    const data = await response.json();

    const mappedEpisodes: Episode[] = (data.episodes || []).map(
      (e: any) => ({
        id: e.id,
        episodeNumber: e.episode_number,
        seasonNumber: seasonNum,
        title: e.name,
        overview: e.overview,
        stillPath: e.still_path,
        rating: e.vote_average,
        airDate: e.air_date,
      })
    );
    setEpisodes(mappedEpisodes);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Media not found</h2>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-white"
        >
          <ChevronLeft className="h-5 w-5" />
          Go Home
        </button>
      </div>
    );
  }

  const seasonCount = media.seasonCount;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* Player Section */}
      <section className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <VideasyPlayer
          item={media}
          seasons={seasons}
          episodes={episodes}
          initialSeason={currentSeason}
          initialEpisode={currentEpisode}
          currentPlayingSeason={currentSeason}
          currentPlayingEpisode={currentEpisode}
          onSeasonChange={handleSeasonChange}
          onEpisodeSelect={(ep) => setCurrentEpisode(ep)}
        />
      </section>

      {/* Media Info */}
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{media.title}</h1>
            {media.releaseDate && (
              <p className="text-sm text-text-muted">{formatDate(media.releaseDate)}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {media.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span className="font-medium text-text-primary">
                  {formatRating(media.rating)}
                </span>
                <span className="text-text-muted">/10</span>
              </div>
            )}
            {media.episodeCount && (
              <div className="flex items-center gap-1 text-text-secondary">
                <Clock className="h-4 w-4" />
                <span>{media.episodeCount} episodes</span>
              </div>
            )}
            {seasonCount !== undefined && (
              <div className="flex items-center gap-1 text-text-secondary">
                <Calendar className="h-4 w-4" />
                <span>{seasonCount} seasons</span>
              </div>
            )}
          </div>

          {/* Genres */}
          {media.genres && media.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {media.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          {media.overview && (
            <p className="text-sm text-text-secondary">{media.overview}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-medium text-white hover:bg-primary-hover">
              <Play className="h-5 w-5" />
              Play
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 font-medium text-text-primary hover:bg-surface-hover">
              <Plus className="h-5 w-5" />
              Add to List
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 font-medium text-text-primary hover:bg-surface-hover">
              <ThumbsUp className="h-5 w-5" />
              Like
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 font-medium text-text-primary hover:bg-surface-hover">
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {(isTV 
            ? (["episodes", "similar", "info"] as const)
            : (["similar", "info"] as const)
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "border-b-2 py-4 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "episodes" && isTV && (
        <div className="space-y-4">
          {/* Season Selector - show for both anime and TV if multiple seasons */}
          {seasons.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {seasons.map((season) => {
                const seasonNumLabel = `Season ${season.seasonNumber}`;
                const showPrefix = season.title !== seasonNumLabel && season.title !== `Season ${season.seasonNumber}`;
                return (
                  <button
                    key={season.seasonNumber}
                    onClick={() => handleSeasonChange(season.seasonNumber, season)}
                    className={cn(
                      "flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                      currentSeason === season.seasonNumber
                        ? "bg-primary text-white"
                        : "bg-surface text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {showPrefix 
                      ? `S${season.seasonNumber}: ${season.title}`
                      : seasonNumLabel}
                  </button>
                );
              })}
            </div>
          )}

          {/* Episodes Grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {episodes.map((episode) => {
              const isCurrentEpisode = episode.episodeNumber === currentEpisode;
              return (
                <div
                  key={episode.id}
                  onClick={() => {
                    setCurrentEpisode(episode.episodeNumber);
                  }}
                  className={cn(
                    "flex gap-3 rounded-lg bg-surface p-3 transition-colors cursor-pointer",
                    isCurrentEpisode 
                      ? "ring-2 ring-primary" 
                      : "hover:bg-surface-hover"
                  )}
                >
                  {/* Thumbnail */}
                  <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-border">
                    {episode.stillPath && (
                      <img
                        src={getPosterUrl(episode.stillPath)}
                        alt={episode.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        E{episode.episodeNumber}
                      </span>
                      {episode.rating && (
                        <span className="text-xs text-accent">
                          {formatRating(episode.rating)}
                        </span>
                      )}
                    </div>
                    <h4 className="line-clamp-2 text-sm text-text-secondary">
                      {episode.title}
                    </h4>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "similar" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {recommendations.map((item, index) => (
            <MediaCard
              key={`${item.mediaType}-${item.id}-${index}`}
              item={item}
              index={index}
              onClick={(i) => router.push(`/${i.mediaType}/${i.tmdbId}`)}
            />
          ))}
        </div>
      )}

      {activeTab === "info" && (
        <div className="rounded-xl bg-surface p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium text-text-muted">Status</h4>
              <p className="text-text-primary">{media.status || "Unknown"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-muted">Release Date</h4>
              <p className="text-text-primary">{formatDate(media.releaseDate)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-text-muted">Rating</h4>
              <p className="text-text-primary">{formatRating(media.rating)} / 10</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MediaPage() {
  const params = useParams();
  const mediaType = params?.mediaType as string;
  const id = params?.id as string;

  if (!mediaType || !id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-2xl font-bold text-text-primary">Invalid media</h2>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <MediaPageContent mediaType={mediaType} id={id} />
    </Suspense>
  );
}