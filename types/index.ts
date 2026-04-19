export type MediaType = "movie" | "tv" | "anime";

export interface MediaItem {
  id: number;
  title: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  releaseDate?: string;
  mediaType: MediaType;
  genres?: Genre[];
  tmdbId?: number;
  anilistId?: number;
  status?: string;
  episodeCount?: number;
  seasonCount?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Season {
  seasonNumber: number;
  episodeCount?: number;
  title: string;
  overview?: string;
  poster?: string;
  anilistId?: number; // For anime seasons - the Anilist ID to fetch episodes from
}

export interface Episode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  rating?: number;
  airDate?: string;
}

export interface WatchProgress {
  id: number;
  mediaType: MediaType;
  progress: number;
  season?: number;
  episode?: number;
  updatedAt: number;
}

export interface FilterOptions {
  mediaType?: MediaType | "all";
  genre?: number;
  year?: number;
  rating?: number;
  status?: string;
  search?: string;
  sortBy?: "popularity" | "rating" | "releaseDate";
}

export interface TMDBMovieResponse {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  name?: string;
  "poster_path": string | null;
  "backdrop_path": string | null;
  overview: string;
  "vote_average": number;
  "release_date": string;
  "media_type": "movie" | "tv";
  "genre_ids": number[];
}

export interface TMDBGenreResponse {
  genres: Genre[];
}

export interface AnilistMedia {
  id: number;
  title: {
    english: string;
    romaji: string;
    native: string;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  description: string;
  format: "TV" | "MOVIE" | "ONA" | "OVA" | "SPECIAL";
  episodes: number | null;
  season: string | null;
  seasonYear: number | null;
  status: string;
  averageScore: number | null;
  genres: string[];
  nextAiringEpisode: {
    episode: number;
    airingAt: number;
  } | null;
}