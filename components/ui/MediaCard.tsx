"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Plus, Star } from "lucide-react";
import { cn, formatRating, formatDate, getPosterUrl } from "@/lib/utils";
import type { MediaItem } from "@/types";

interface MediaCardProps {
  item: MediaItem;
  onClick?: (item: MediaItem) => void;
  index?: number;
}

export function MediaCard({ item, onClick, index = 0 }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const posterUrl = item.poster
    ? item.poster
    : item.backdrop
    ? item.backdrop
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(item)}
    >
      <div
        className={cn(
          "relative aspect-[2/3] cursor-pointer overflow-hidden rounded-xl transition-all duration-300",
          isHovered ? "scale-105 shadow-2xl shadow-primary/20" : "shadow-lg"
        )}
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <span className="text-text-muted">No Image</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex gap-3">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary hover:bg-primary-hover transition-colors">
              <Play className="h-5 w-5 fill-current text-white" />
            </button>
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/80 hover:bg-surface transition-colors">
              <Plus className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Rating Badge */}
        {item.rating !== undefined && item.rating > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-surface/80 px-2 py-1 text-xs font-medium backdrop-blur-sm">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-text-primary">{formatRating(item.rating)}</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute left-2 top-2">
          <span
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium uppercase backdrop-blur-sm",
              item.mediaType === "movie" && "bg-blue-500/80 text-white",
              item.mediaType === "tv" && "bg-purple-500/80 text-white"
            )}
          >
            {item.mediaType}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold text-text-primary transition-colors group-hover:text-primary">
          {item.title}
        </h3>
        <p className="text-xs text-text-muted">
          {item.releaseDate ? formatDate(item.releaseDate) : "N/A"}
          {item.seasonCount !== undefined && ` • ${item.seasonCount} seasons`}
          {item.episodeCount !== undefined && ` • ${item.episodeCount} eps`}
        </p>
      </div>
    </motion.div>
  );
}