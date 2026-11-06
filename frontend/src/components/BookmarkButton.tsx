import React, { useState } from "react";
import { Bookmark, MoreVertical, Loader2 } from "lucide-react";
import { bookmarkService } from "../services/bookmarkService";
import { BookmarkDialogModal } from "./BookmarkDialogModal";
import type { ArticleBookmark } from "../types/bookmark";

interface BookmarkButtonProps {
  slug: string;
  articleTitle: string;
  initialBookmarked?: boolean;
  initialBookmarkInfo?: {
    id: string;
    collection_name: string;
    personal_note: string;
  } | null;
  className?: string;
  onBookmarkChanged?: (bookmarked: boolean) => void;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  slug,
  articleTitle,
  initialBookmarked = false,
  initialBookmarkInfo = null,
  className = "",
  onBookmarkChanged,
}) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialBookmarked);
  const [bookmarkData, setBookmarkData] = useState<ArticleBookmark | null>(
    initialBookmarkInfo
      ? ({
          id: initialBookmarkInfo.id,
          article_slug: slug,
          article_title: articleTitle,
          collection_name: initialBookmarkInfo.collection_name,
          personal_note: initialBookmarkInfo.personal_note,
        } as ArticleBookmark)
      : null
  );
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickToggle = async () => {
    if (loading) return;
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

    try {
      setLoading(true);
      const res = await bookmarkService.toggleBookmark(slug);
      setIsBookmarked(res.bookmarked);
      setBookmarkData(res.bookmark || null);
      if (onBookmarkChanged) {
        onBookmarkChanged(res.bookmarked);
      }
    } catch {
      setIsBookmarked(!nextState);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModal = async (collection: string, note: string) => {
    try {
      setLoading(true);
      const res = await bookmarkService.toggleBookmark(slug, {
        action: "add",
        collection_name: collection,
        personal_note: note,
      });
      setIsBookmarked(res.bookmarked);
      setBookmarkData(res.bookmark || null);
      if (onBookmarkChanged) {
        onBookmarkChanged(res.bookmarked);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveModal = async () => {
    try {
      setLoading(true);
      await bookmarkService.toggleBookmark(slug, {
        action: "remove",
      });
      setIsBookmarked(false);
      setBookmarkData(null);
      if (onBookmarkChanged) {
        onBookmarkChanged(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden ${className}`}>
        <button
          type="button"
          disabled={loading}
          onClick={handleQuickToggle}
          title={isBookmarked ? "Remove from bookmarks" : "Save article to reading list"}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
            isBookmarked
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <Bookmark
              className={`w-4 h-4 transition-transform duration-200 ${
                isBookmarked ? "fill-amber-500 text-amber-500 scale-110" : "text-slate-500"
              }`}
            />
          )}
          <span>{isBookmarked ? (bookmarkData?.collection_name || "Saved") : "Save"}</span>
        </button>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Edit bookmark collection and personal notes"
          className="px-1.5 py-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-800 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      <BookmarkDialogModal
        isOpen={isModalOpen}
        articleTitle={articleTitle}
        initialBookmark={bookmarkData}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        onRemove={isBookmarked ? handleRemoveModal : undefined}
      />
    </>
  );
};
