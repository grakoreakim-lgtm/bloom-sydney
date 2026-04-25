/**
 * InstagramFeed.tsx
 * Reads from Firestore cache (refreshed hourly by Firebase Function)
 * Usage: <InstagramFeed />
 */
"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // your Firebase init
import { doc, getDoc } from "firebase/firestore";

interface Post {
  id: string;
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

export default function InstagramFeed({ limit = 12 }: { limit?: number }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const snap = await getDoc(doc(db, "cache", "instagram_feed"));
        if (snap.exists()) {
          setPosts((snap.data().posts as Post[]).slice(0, limit));
        }
      } catch (err) {
        console.error("Instagram feed error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeed();
  }, [limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="aspect-square bg-[#EDE5D8] animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  if (!posts.length) return null;

  return (
    <div className="grid grid-cols-6 gap-1">
      {posts.map((post) => (
        <a
          key={post.id}
          href="https://instagram.com/bloom.sydney"
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-square overflow-hidden rounded-sm group relative"
        >
          <img
            src={post.media_url || post.thumbnail_url}
            alt={post.caption?.slice(0, 60) || "Bloom Sydney"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-light tracking-widest uppercase">
              View
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
