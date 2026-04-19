import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  const year = new Date(dateString).getFullYear();
  return year.toString();
}

export function formatRating(rating?: number): string {
  if (!rating) return "N/A";
  return rating.toFixed(1);
}

export function truncateText(text?: string, maxLength: number = 150): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function getYearFromDate(dateString?: string): number | null {
  if (!dateString) return null;
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? null : year;
}

export function generateVideasyUrl(
  mediaType: "movie" | "tv" | "anime",
  id: number,
  season?: number,
  episode?: number,
  seasonId?: number // Optional: specific Anilist season ID for anime
): string {
  switch (mediaType) {
    case "movie":
      return `https://player.videasy.net/movie/${id}`;
    case "tv":
      return `https://player.videasy.net/tv/${id}/${season || 1}/${episode || 1}`;
    case "anime":
      // For anime, use seasonId if available, otherwise use the main id
      const targetId = seasonId || id;
      return `https://player.videasy.net/anime/${targetId}/${episode || 1}`;
    default:
      return "";
  }
}

export function getPosterUrl(
  path: string | null | undefined,
  size: "small" | "medium" | "large" = "medium"
): string {
  if (!path) return "";
  
  // If it's already a full URL, return it as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  const sizes = {
    small: "w185",
    medium: "w342",
    large: "w780",
  };
  return `https://image.tmdb.org/t/p/${sizes[size]}${path}`;
}

export function getAnilistImageUrl(
  path: string | null | undefined,
  size: "small" | "medium" | "large" = "medium"
): string {
  if (!path) return "";
  
  // If it's already a full URL (Anilist returns complete URLs), return it as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // Otherwise build URL from path (shouldn't happen with current Anilist API)
  const sizes = {
    small: "/small",
    medium: "/medium",
    large: "/large",
  };
  return `https://s4.anilist.co${path}${sizes[size]}.webp`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getWatchProgressKey(id: number, mediaType: string): string {
  return `watch_${mediaType}_${id}`;
}

export function saveWatchProgress(
  id: number,
  mediaType: string,
  progress: number,
  season?: number,
  episode?: number
): void {
  const key = getWatchProgressKey(id, mediaType);
  const data = {
    id,
    mediaType,
    progress,
    season,
    episode,
    updatedAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

export function getWatchProgress(
  id: number,
  mediaType: string
): { progress: number; season?: number; episode?: number } | null {
  if (typeof window === "undefined") return null;
  const key = getWatchProgressKey(id, mediaType);
  const data = localStorage.getItem(key);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    return {
      progress: parsed.progress,
      season: parsed.season,
      episode: parsed.episode,
    };
  } catch {
    return null;
  }
}

export function getContinueWatching(): Array<{
  id: number;
  mediaType: string;
  progress: number;
  season?: number;
  episode?: number;
  title: string;
  poster: string;
}> {
  if (typeof window === "undefined") return [];
  const items: Array<{
    id: number;
    mediaType: string;
    progress: number;
    season?: number;
    episode?: number;
    title: string;
    poster: string;
    updatedAt: number;
  }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("watch_")) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          items.push(parsed);
        } catch {
          // ignore
        }
      }
    }
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);
}