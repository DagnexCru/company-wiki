import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Folder, Clock, ArrowRight, Trash2, Search, BookOpen } from "lucide-react";
import { bookmarkService } from "../services/bookmarkService";
import type { ArticleBookmark } from "../types/bookmark";

export const DashboardBookmarksWidget: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<ArticleBookmark[]>([]);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bookmarkService.getBookmarks({
        collection: selectedCollection === "All" ? undefined : selectedCollection,
        search: search.trim() || undefined,
      });
      setBookmarks(res.results || []);
      if (res.collections) {
        setCollections(["All", ...res.collections]);
      }
    } catch {
      // Graceful fallback on network glitch
    } finally {
      setLoading(false);
    }
  }, [selectedCollection, search]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemove = async (slug: string) => {
    try {
      await bookmarkService.toggleBookmark(slug, { action: "remove" });
      setBookmarks((prev) => prev.filter((b) => b.article_slug !== slug));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Bookmark className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              My Saved Articles & Reading Lists
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personal knowledge hub and bookmarked references
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved articles..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Collection Pills */}
      {collections.length > 1 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {collections.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setSelectedCollection(col)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedCollection === col
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {col === "All" ? "All Bookmarks" : col}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading your personal bookmarks...
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {selectedCollection === "All"
              ? "You haven't bookmarked any articles yet."
              : `No articles in collection "${selectedCollection}".`}
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Click the "Save" button on any article detail page to add it to your reading list.
          </p>
          <div className="pt-2">
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Browse Knowledge Base <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookmarks.map((bm) => (
            <div
              key={bm.id}
              className="group p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-white dark:hover:bg-slate-800/90 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    <Folder className="w-2.5 h-2.5" />
                    {bm.collection_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(bm.article_slug)}
                    title="Remove from reading list"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Link
                  to={`/articles/${bm.article_slug}`}
                  className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                  {bm.article_title}
                </Link>

                {bm.personal_note && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 bg-white/60 dark:bg-slate-900/40 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                    "{bm.personal_note}"
                  </p>
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {bm.article_reading_time || 3} min read
                </span>
                <Link
                  to={`/articles/${bm.article_slug}`}
                  className="font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  Read <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
