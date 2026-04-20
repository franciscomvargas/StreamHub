# StreamHub 🎬

A modern streaming platform for movies and TV shows built with Next.js, powered by TMDB and Videasy.

![StreamHub Homepage](public/homepage_ss.png)

---

## Features

### 🎥 Movies & TV Shows
- Browse extensive catalogs of movies and TV shows
- Filter by genre, year, and minimum rating
- Sort by popularity, rating, or release date
- Infinite scroll for seamless browsing

### 🔍 Smart Search
- Real-time search with dropdown suggestions
- Search across all media types
- Auto-search as you type

### 🎬 Streaming Experience
- Integrated streaming via Videasy player
- episode navigation for TV shows
- Player interface with progress bar

### 🎨 Modern Design
- Dark theme optimized for viewing
- Smooth animations with Framer Motion
- Responsive design for all devices
- Card-based media layout with hover effects

---

## Getting Started

### Prerequisites

- **Node.js** 18+ 
- **TMDB API Key** - Get free at [themoviedb.org](https://www.themoviedb.org/settings/api)

### Installation

```bash
# Clone the repository
git clone https://github.com/franciscomvargas/StreamHub.git
cd StreamHub

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your TMDB API key
# Edit .env.local and add: TMDB_API_KEY=your_api_key_here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 14](https://nextjs.org) | React framework |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [TMDB API](https://www.themoviedb.org) | Movie & TV data |
| [Videasy](https://videosfy.com) | Streaming embed |

---

## Project Structure

```
local_stream/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── tmdb/         # TMDB endpoints
│   │   └── search/        # Search endpoint
│   ├── movies/           # Movies page
│   ├── tv/              # TV Shows page
│   ├── browse/           # Browse all media
│   ├── search/          # Search page
│   └── [mediaType]/     # Media detail pages
├── components/            # React components
│   ├── ui/              # Reusable UI components
│   ├── player/          # Video player
│   └── layout/           # Header, Footer
├── lib/                  # Utilities
└── types/                # TypeScript definitions
```

---

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Featured content + category tabs |
| Movies | `/movies` | Movie catalog with filters |
| TV Shows | `/tv` | TV show catalog with filters |
| Browse | `/browse` | All media with type selector |
| Search | `/search` | Search results |

---

## Contributing

1. **Fork** the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

### Coding Standards

- Use TypeScript for all new code
- Follow existing component patterns
- Run `npm run build` before committing
- Keep components modular and reusable

---

## License

MIT License - Feel free to use this project for learning or building your own streaming app.

---

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org) for movie data
- [Videasy](https://videosfy.com) for streaming
- [Lucide](https://lucide.dev) for beautiful icons

---

**Enjoy watching! 🍿**
