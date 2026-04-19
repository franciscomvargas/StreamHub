"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { List } from "lucide-react";
import { cn, generateVideasyUrl, saveWatchProgress } from "@/lib/utils";
import type { MediaItem, Episode, Season } from "@/types";

interface VideasyPlayerProps {
  item: MediaItem;
  seasons?: Season[];
  episodes?: Episode[];
  initialSeason?: number;
  initialEpisode?: number;
  currentPlayingEpisode?: number;
  currentPlayingSeason?: number;
  onSeasonChange?: (seasonNum: number, seasonData?: Season) => void;
  onEpisodeSelect?: (episodeNum: number) => void;
}

export function VideasyPlayer({
  item,
  seasons = [],
  episodes = [],
  initialSeason = 1,
  initialEpisode = 1,
  currentPlayingSeason,
  currentPlayingEpisode,
  onSeasonChange,
  onEpisodeSelect,
}: VideasyPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [showSidebar, setShowSidebar] = useState(true);
  const [progress, setProgress] = useState(0);
  const [allEpisodes, setAllEpisodes] = useState<Record<number, Episode[]>>({});

  // Sync with parent state when props change
  useEffect(() => {
    if (currentPlayingSeason !== undefined) {
      setCurrentSeason(currentPlayingSeason);
    }
  }, [currentPlayingSeason]);

  useEffect(() => {
    if (currentPlayingEpisode !== undefined) {
      setCurrentEpisode(currentPlayingEpisode);
    }
  }, [currentPlayingEpisode]);

  // Store episodes by season when they're first loaded
  useEffect(() => {
    if (episodes.length > 0) {
      setAllEpisodes((prev) => ({
        ...prev,
        [currentSeason]: episodes,
      }));
    }
  }, [episodes, currentSeason]);

  const mediaId = item.tmdbId || item.id;
  const isTV = item.mediaType === "tv";

  const playerUrl = generateVideasyUrl(
    item.mediaType as "movie" | "tv",
    mediaId,
    isTV ? currentSeason : undefined,
    isTV ? currentEpisode : undefined
  );

  // Listen for messages from the player (progress updates)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "progress") {
        setProgress(event.data.progress);
        saveWatchProgress(
          mediaId,
          item.mediaType,
          event.data.progress,
          isTV ? currentSeason : undefined,
          isTV ? currentEpisode : undefined
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [mediaId, item.mediaType, currentSeason, currentEpisode, isTV]);

  // Handle episode navigation - notify parent
  const handleNextEpisode = () => {
    const nextEp = currentEpisode + 1;
    const currentEpisodes = allEpisodes[currentSeason] || episodes;
    
    if (nextEp <= currentEpisodes.length) {
      setCurrentEpisode(nextEp);
      onEpisodeSelect?.(nextEp);
    } else if (currentSeason < seasons.length) {
      // Go to next season
      const newSeason = currentSeason + 1;
      setCurrentSeason(newSeason);
      setCurrentEpisode(1);
      onSeasonChange?.(newSeason);
      onEpisodeSelect?.(1);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      const prevEp = currentEpisode - 1;
      setCurrentEpisode(prevEp);
      onEpisodeSelect?.(prevEp);
    } else if (currentSeason > 1) {
      // Go to previous season, last episode
      const newSeason = currentSeason - 1;
      const prevSeasonEpisodes = allEpisodes[newSeason] || [];
      const lastEp = prevSeasonEpisodes.length || 1;
      setCurrentSeason(newSeason);
      setCurrentEpisode(lastEp);
      onSeasonChange?.(newSeason);
      onEpisodeSelect?.(lastEp);
    }
  };

  // Get episodes for current season
  const currentEpisodes = allEpisodes[currentSeason] || episodes.filter((e) => e.seasonNumber === currentSeason);

  return (
    <div ref={containerRef} className="relative flex h-full">
      {/* Video Player */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-xl bg-black",
          showSidebar && isTV ? "mr-80" : ""
        )}
      >
        <iframe
          ref={iframeRef}
          src={playerUrl}
          className="absolute inset-0 h-full w-full"
          allow="fullscreen; autoplay; encrypted-media"
          allowFullScreen
        />

        {/* Episode Info Badge */}
        {isTV && (
          <div className="absolute left-4 top-4 z-10">
            <div className="rounded-lg bg-black/70 px-3 py-2 text-sm text-white backdrop-blur-sm">
              <span className="font-semibold">S{currentSeason}</span>
              <span className="text-text-muted">E{currentEpisode}</span>
            </div>
          </div>
        )}

        {/* Toggle Sidebar Button */}
        {isTV && (
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn(
              "absolute right-4 top-4 z-10 rounded-lg bg-black/70 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/90",
              showSidebar && "text-primary"
            )}
          >
            <List className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Episode Sidebar for TV Shows */}
      {showSidebar && isTV && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-0 top-0 h-full w-72 overflow-y-auto rounded-xl bg-surface"
        >
          {/* Season Tabs */}
          {seasons.length > 1 && (
            <div className="flex gap-1 border-b border-border p-2">
              {seasons.map((season) => (
                <button
                  key={season.seasonNumber}
                  onClick={() => {
                    setCurrentSeason(season.seasonNumber);
                    setCurrentEpisode(1);
                    if (onSeasonChange) {
                      onSeasonChange(season.seasonNumber, season);
                    }
                  }}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-xs font-medium transition-colors",
                    currentSeason === season.seasonNumber
                      ? "bg-primary text-white"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  S{season.seasonNumber}
                </button>
              ))}
            </div>
          )}

          {/* Episodes List */}
          <div className="p-2">
            {currentEpisodes.length > 0 ? (
              currentEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => {
                    setCurrentSeason(episode.seasonNumber);
                    setCurrentEpisode(episode.episodeNumber);
                    if (onEpisodeSelect) {
                      onEpisodeSelect(episode.episodeNumber);
                    }
                  }}
                  className={cn(
                    "mb-1 w-full rounded-lg p-3 text-left transition-colors",
                    currentEpisode === episode.episodeNumber
                      ? "bg-primary/20 border border-primary"
                      : "hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-muted">
                      E{episode.episodeNumber}
                    </span>
                    <span className="flex-1 truncate text-sm text-text-primary">
                      {episode.title}
                    </span>
                  </div>
                  {episode.overview && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                      {episode.overview}
                    </p>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center text-text-muted">
                No episodes available
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}