import React, { useState, useEffect } from "react";
import { Bookmark, Folder, FileText, X, Check, Trash2, Loader2 } from "lucide-react";
import type { ArticleBookmark } from "../types/bookmark";

interface BookmarkDialogModalProps {
  isOpen: boolean;
  articleTitle: string;
  initialBookmark: ArticleBookmark | null;
  onClose: () => void;
  onSave: (collection: string, note: string) => Promise<void>;
  onRemove?: () => Promise<void>;
}

const PRESET_COLLECTIONS = ["Favorites", "Must Read", "Architecture", "Onboarding", "Reference"];

export const BookmarkDialogModal: React.FC<BookmarkDialogModalProps> = ({
  isOpen,
  articleTitle,
  initialBookmark,
  onClose,
  onSave,
  onRemove,
}) => {
  const [collection, setCollection] = useState("Favorites");
  const [customCollection, setCustomCollection] = useState("");
  const [note, setNote] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (initialBookmark) {
      if (PRESET_COLLECTIONS.includes(initialBookmark.collection_name)) {
        setCollection(initialBookmark.collection_name);
        setIsCustom(false);
      } else {
        setCollection("Custom");
        setCustomCollection(initialBookmark.collection_name);
        setIsCustom(true);
      }
      setNote(initialBookmark.personal_note || "");
    } else {
      setCollection("Favorites");
      setCustomCollection("");
      setIsCustom(false);
      setNote("");
    }
  }, [initialBookmark, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCollection = (isCustom ? customCollection : collection).trim() || "Favorites";
    try {
      setSaving(true);
      await onSave(finalCollection, note.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    try {
      setRemoving(true);
      await onRemove();
      onClose();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-amber-100 bg-amber-50/50 dark:border-amber-950/40 dark:bg-amber-950/20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialBookmark ? "Edit Saved Bookmark" : "Save to Reading List"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                "{articleTitle}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                Collection / Reading List
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_COLLECTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => {
                    setCollection(c);
                    setIsCustom(false);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
                    !isCustom && collection === c
                      ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300"
                  }`}
                >
                  {c}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors border ${
                  isCustom
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-300"
                }`}
              >
                + Custom
              </button>
            </div>

            {isCustom && (
              <input
                type="text"
                value={customCollection}
                onChange={(e) => setCustomCollection(e.target.value)}
                placeholder="Enter custom collection name (e.g. Q4 Sprint, API)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Private Note (Optional)
              </span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why are you saving this? (Only visible to you)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 gap-3">
            {initialBookmark && onRemove ? (
              <button
                type="button"
                disabled={removing || saving}
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Remove
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || removing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Bookmark
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
