import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  // Check for API key
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not configured. Please add TMDB_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";
  const endpoint = searchParams.get("endpoint") || "popular";
  const sortBy = searchParams.get("sort_by");
  const withGenres = searchParams.get("with_genres");
  const year = searchParams.get("year") || searchParams.get("primary_release_year");
  const minRating = searchParams.get("vote_average.gte");

  // Map friendly sortBy values to sort_by for discover endpoint
  const sortMap: Record<string, string> = {
    popular: "popularity.desc",
    top_rated: "vote_average.desc",
    now_playing: "primary_release_date.desc",
    upcoming: "primary_release_date.desc",
    trending: "popularity.desc",
    rating: "vote_average.desc",
    new: "primary_release_date.desc",
    discover: "popularity.desc",
  };

  // Use discover endpoint when explicitly requested, or for filtering
  const useDiscover = endpoint === "discover" || !!withGenres || !!year;
  const sortValue = sortBy || sortMap[endpoint] || "popularity.desc";
  let tmdbEndpoint: string;

  if (useDiscover) {
    // Use discover endpoint with filters
    tmdbEndpoint = `/discover/movie?page=${page}&sort_by=${sortValue}`;
  } else if (endpoint === "trending") {
    tmdbEndpoint = `/trending/movie/week?page=${page}`;
  } else {
    // Use specific movie endpoints
    const endpointPathMap: Record<string, string> = {
      popular: "/movie/popular",
      top_rated: "/movie/top_rated",
      now_playing: "/movie/now_playing",
      upcoming: "/movie/upcoming",
      rating: "/movie/top_rated",
      new: "/movie/now_playing",
    };
    tmdbEndpoint = `${endpointPathMap[endpoint] || "/movie/popular"}?page=${page}`;
  }
  
  // Add genre filter
  if (withGenres) {
    tmdbEndpoint += `&with_genres=${withGenres}`;
  }
  // Add year filter
  if (year) {
    tmdbEndpoint += `&primary_release_year=${year}`;
  }
  // Add min rating filter
  if (minRating) {
    tmdbEndpoint += `&vote_average.gte=${minRating}`;
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}${tmdbEndpoint}&api_key=${TMDB_API_KEY}&language=en-US`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `TMDB API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch from TMDB" },
      { status: 500 }
    );
  }
}