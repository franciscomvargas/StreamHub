import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const type = searchParams.get("type") || "all"; // all, movie, tv, anime

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const results: Array<{
    id: number;
    title: string;
    poster?: string;
    backdrop?: string;
    overview?: string;
    rating?: number;
    releaseDate?: string;
    mediaType: "movie" | "tv" | "anime";
    tmdbId?: number;
  }> = [];

  try {
    // Search TMDB for movies and TV shows
    if (type === "all" || type === "movie" || type === "tv") {
      if (TMDB_API_KEY) {
        const tmdbResponse = await fetch(
          `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            query
          )}&page=${page}`
        );

        if (tmdbResponse.ok) {
          const tmdbData = await tmdbResponse.json();

          for (const item of tmdbData.results || []) {
            if (item.media_type === "movie" && (type === "all" || type === "movie")) {
              results.push({
                id: item.id,
                title: item.title,
                poster: item.poster_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                  : undefined,
                backdrop: item.backdrop_path
                  ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                  : undefined,
                overview: item.overview,
                rating: item.vote_average,
                releaseDate: item.release_date,
                mediaType: "movie",
                tmdbId: item.id,
              });
            }

            if (item.media_type === "tv" && (type === "all" || type === "tv")) {
              results.push({
                id: item.id,
                title: item.name,
                poster: item.poster_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                  : undefined,
                backdrop: item.backdrop_path
                  ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                  : undefined,
                overview: item.overview,
                rating: item.vote_average,
                releaseDate: item.first_air_date,
                mediaType: "tv",
                tmdbId: item.id,
              });
            }
          }
        }
      }
    }

    // For anime, search TMDB TV shows with Animation genre filter
    // Note: TMDB doesn't have anime-specific search, but we can search all TV and filter by known anime titles
    // For now, we rely on the TMDB search which includes TV shows (some of which are anime)
    // If user specifically wants anime, we search for known anime keywords in the results
    if (type === "anime") {
      if (TMDB_API_KEY) {
        // Search all multi, then filter for anime-like results
        const animeKeywords = ["dragon ball", "naruto", "one piece", "bleach", "fullmetal", "pokemon", "pokémon", "attack on titan", "demon slayer", "jujutsu kaisen", "my hero", "haikyuu", "death note", " Evangelion", "cowboy bebop", "steins;gate", "hunter x hunter", "one punch", "blue lock", "spy x family", "chainsaw"];
        const queryLower = query.toLowerCase();
        const isAnimeSearch = animeKeywords.some(kw => queryLower.includes(kw));
        
        const searchType = isAnimeSearch ? "multi" : "tv";
        const tmdbResponse = await fetch(
          `${TMDB_BASE_URL}/search/${searchType}?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            query
          )}&page=${page}`
        );

        if (tmdbResponse.ok) {
          const tmdbData = await tmdbResponse.json();

          for (const item of tmdbData.results || []) {
            // For anime search, filter to TV shows 
            if (item.media_type === "tv" || isAnimeSearch) {
              results.push({
                id: item.id,
                title: item.name || item.title,
                poster: item.poster_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                  : undefined,
                backdrop: item.backdrop_path
                  ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
                  : undefined,
                overview: item.overview,
                rating: item.vote_average,
                releaseDate: item.first_air_date || item.release_date,
                mediaType: "anime",
                tmdbId: item.id,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      results,
      page,
      totalResults: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}