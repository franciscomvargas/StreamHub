import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  if (!TMDB_API_KEY) {
    return NextResponse.json(
      { error: "TMDB_API_KEY not configured. Please add TMDB_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const mediaType = searchParams.get("mediaType"); // "movie" or "tv"
  const id = searchParams.get("id");

  if (!mediaType || !id) {
    return NextResponse.json(
      { error: "mediaType and id are required" },
      { status: 400 }
    );
  }

  const endpoint = mediaType === "movie" ? "movie" : "tv";

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${TMDB_API_KEY}&language=en-US`
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