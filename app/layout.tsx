import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "StreamHub - Watch Movies, TV Shows & Anime",
  description:
    "Stream your favorite movies, TV shows, and anime with our modern streaming player powered by Videasy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Header />
        <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-screen-2xl px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}