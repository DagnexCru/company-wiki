import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  FolderTree,
  Tag as TagIcon,
  PlusCircle,
  CheckSquare,
  Shield,
  Users,
  LayoutDashboard,
  LogOut,
  ArrowRight,
  Clock,
  Sparkles,
  X,
  CornerDownLeft,
  FileText,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { articleService } from "../services/articleService";
import { taxonomyService } from "../services/taxonomyService";
import type { ArticleListItem } from "../types/article";
import type { Category, Tag } from "../types/taxonomy";

interface PaletteAction {
  id: string;
  type: "action";
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  perform: () => void;
  allowedRoles?: string[];
}

interface PaletteArticleItem {
  id: string;
  type: "article";
  title: string;
  slug: string;
  summary: string;
  categoryName?: string;
  status: string;
  readingTime?: number;
}

interface PaletteCategoryItem {
  id: string;
  type: "category";
  name: string;
  slug: string;
  description: string;
  articleCount?: number;
}

interface PaletteTagItem {
  id: string;
  type: "tag";
  name: string;
  slug: string;
  articleCount?: number;
}

type PaletteItem =
  | PaletteAction
  | PaletteArticleItem
  | PaletteCategoryItem
  | PaletteTagItem;

const RECENT_SEARCHES_KEY = "company_wiki_recent_searches";

export const CommandPalette: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "articles" | "categories" | "tags" | "actions">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Search Results
  const [articleResults, setArticleResults] = useState<ArticleListItem[]>([]);
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const [tagResults, setTagResults] = useState<Tag[]>([]);
  const [recentSearches, setRecentSearches] = useState<{ title: string; path: string; type: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveRecentSearch = (title: string, path: string, type: string) => {
    try {
      const updated = [
        { title, path, type },
        ...recentSearches.filter((item) => item.path !== path),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Global Keyboard Listener for Ctrl+K / Cmd+K and custom trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Lock body scroll and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setActiveTab("all");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Define All Quick Actions with RBAC
  const quickActions: PaletteAction[] = useMemo(() => [
    {
      id: "act-new-article",
      type: "action",
      title: "Create New Article",
      subtitle: "Author a new Markdown article or standard operating procedure",
      icon: PlusCircle,
      iconColor: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
      perform: () => navigate("/articles/new"),
      allowedRoles: ["ADMIN", "AUTHOR"],
    },
    {
      id: "act-review-queue",
      type: "action",
      title: "Review Queue",
      subtitle: "Inspect pending submissions and evaluate editorial changes",
      icon: CheckSquare,
      iconColor: "text-amber-400 bg-amber-950/60 border-amber-800/60",
      perform: () => navigate("/reviews"),
      allowedRoles: ["ADMIN", "REVIEWER"],
    },
    {
      id: "act-taxonomy",
      type: "action",
      title: "Manage Categories & Tags",
      subtitle: "Organize knowledge taxonomy, color themes, and tag metadata",
      icon: FolderTree,
      iconColor: "text-indigo-400 bg-indigo-950/60 border-indigo-800/60",
      perform: () => navigate("/taxonomy"),
      allowedRoles: ["ADMIN"],
    },
    {
      id: "act-users",
      type: "action",
      title: "User Management & RBAC",
      subtitle: "Audit user roles, active statuses, and account authorizations",
      icon: Users,
      iconColor: "text-purple-400 bg-purple-950/60 border-purple-800/60",
      perform: () => navigate("/users"),
      allowedRoles: ["ADMIN"],
    },
    {
      id: "act-audit",
      type: "action",
      title: "Security Audit Trail",
      subtitle: "Inspect immutable system events, actor IPs, and login timestamps",
      icon: Shield,
      iconColor: "text-rose-400 bg-rose-950/60 border-rose-800/60",
      perform: () => navigate("/audit"),
      allowedRoles: ["ADMIN"],
    },
    {
      id: "act-dashboard",
      type: "action",
      title: "Workspace Dashboard",
      subtitle: "Overview of your personal drafting and team knowledge metrics",
      icon: LayoutDashboard,
      iconColor: "text-brand-400 bg-brand-950/60 border-brand-800/60",
      perform: () => navigate("/dashboard"),
    },
    {
      id: "act-profile",
      type: "action",
      title: "My Profile & Account Settings",
      subtitle: "Inspect role-gated permissions, user credentials, and workspace preferences",
      icon: User,
      iconColor: "text-indigo-400 bg-indigo-950/60 border-indigo-800/60",
      perform: () => navigate("/profile"),
    },
    {
      id: "act-all-articles",
      type: "action",
      title: "Browse All Knowledge Articles",
      subtitle: "Search, filter, and discover published company documentation",
      icon: BookOpen,
      iconColor: "text-sky-400 bg-sky-950/60 border-sky-800/60",
      perform: () => navigate("/articles"),
    },
    {
      id: "act-signout",
      type: "action",
      title: "Sign Out",
      subtitle: "Securely invalidate current session and token credentials",
      icon: LogOut,
      iconColor: "text-slate-400 bg-slate-800 border-slate-700",
      perform: () => logout(),
    },
  ], [navigate, logout]);

  // Filter actions by user role
  const allowedActions = useMemo(() => {
    return quickActions.filter((action) => {
      if (!action.allowedRoles) return true;
      return user?.role && action.allowedRoles.includes(user.role);
    });
  }, [quickActions, user?.role]);

  // Debounced Search Query across Articles, Categories, and Tags
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setArticleResults([]);
      setCategoryResults([]);
      setTagResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const [articlesRes, categoriesRes, tagsRes] = await Promise.allSettled([
          articleService.getArticles({ search: trimmed, page_size: 6 }),
          taxonomyService.getCategories(trimmed),
          taxonomyService.getTags(trimmed),
        ]);

        if (articlesRes.status === "fulfilled") {
          setArticleResults(articlesRes.value.results || []);
        }
        if (categoriesRes.status === "fulfilled") {
          setCategoryResults(categoriesRes.value || []);
        }
        if (tagsRes.status === "fulfilled") {
          setTagResults(tagsRes.value || []);
        }
      } catch {
        // Silently handle search network failures
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timeout);
  }, [query]);

  // Compile combined list of PaletteItems based on current tab and query
  const combinedItems: PaletteItem[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const items: PaletteItem[] = [];

    // 1. Matched Actions
    if (activeTab === "all" || activeTab === "actions") {
      const matchedActions = allowedActions.filter((act) => {
        if (!trimmed) return true;
        return (
          act.title.toLowerCase().includes(trimmed) ||
          act.subtitle.toLowerCase().includes(trimmed)
        );
      });
      items.push(...matchedActions);
    }

    // 2. Articles
    if (activeTab === "all" || activeTab === "articles") {
      articleResults.forEach((art) => {
        items.push({
          id: `art-${art.id}`,
          type: "article",
          title: art.title,
          slug: art.slug,
          summary: art.summary,
          categoryName: art.category?.name,
          status: art.status,
          readingTime: art.estimated_read_time,
        });
      });
    }

    // 3. Categories
    if (activeTab === "all" || activeTab === "categories") {
      categoryResults.forEach((cat) => {
        items.push({
          id: `cat-${cat.id}`,
          type: "category",
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          articleCount: cat.article_count,
        });
      });
    }

    // 4. Tags
    if (activeTab === "all" || activeTab === "tags") {
      tagResults.forEach((tg) => {
        items.push({
          id: `tag-${tg.id}`,
          type: "tag",
          name: tg.name,
          slug: tg.slug,
          articleCount: tg.article_count,
        });
      });
    }

    return items;
  }, [activeTab, query, allowedActions, articleResults, categoryResults, tagResults]);

  // Reset selected index when combinedItems changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [combinedItems]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement | null;
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Execute selected item
  const handleSelectItem = useCallback((item: PaletteItem) => {
    setIsOpen(false);

    if (item.type === "action") {
      item.perform();
    } else if (item.type === "article") {
      saveRecentSearch(item.title, `/articles/${item.slug}`, "article");
      navigate(`/articles/${item.slug}`);
    } else if (item.type === "category") {
      saveRecentSearch(item.name, `/articles?category=${item.slug}`, "category");
      navigate(`/articles?category=${item.slug}`);
    } else if (item.type === "tag") {
      saveRecentSearch(`#${item.name}`, `/articles?tag=${item.slug}`, "tag");
      navigate(`/articles?tag=${item.slug}`);
    }
  }, [navigate]);

  // Handle arrow keys and enter in search input
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (combinedItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % combinedItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (combinedItems[selectedIndex]) {
        handleSelectItem(combinedItems[selectedIndex]);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">Published</span>;
      case "in_review":
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">In Review</span>;
      case "draft":
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">Draft</span>;
      case "archived":
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">Archived</span>;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in-50 duration-150"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Palette"
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-slate-900/90 sticky top-0 z-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search articles, tags, categories, or type a command..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-hidden"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
          />

          {loading && (
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}

          {query && (
            <button
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">
            ESC
          </kbd>
        </div>

        {/* Filter Tab Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs overflow-x-auto scrollbar-none">
          {[
            { id: "all", label: "All" },
            { id: "articles", label: "Articles" },
            { id: "categories", label: "Categories" },
            { id: "tags", label: "Tags" },
            { id: "actions", label: "Actions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-2.5 py-1 rounded-lg font-medium transition shrink-0 ${
                activeTab === tab.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          id="palette-results"
          role="listbox"
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40"
        >
          {/* Empty Query: Show Recent Searches if any */}
          {!query.trim() && recentSearches.length > 0 && activeTab === "all" && (
            <div className="px-2 py-2 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition"
                >
                  Clear history
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((rec) => (
                  <button
                    key={rec.path}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(rec.path);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-700/60 transition"
                  >
                    <FileText className="w-3 h-3 text-brand-400" />
                    <span>{rec.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Items */}
          {combinedItems.length > 0 ? (
            combinedItems.map((item, index) => {
              const isSelected = index === selectedIndex;

              if (item.type === "action") {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? "bg-brand-600/20 border border-brand-500/40 text-white"
                        : "hover:bg-slate-800/50 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${item.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-brand-300 font-mono flex items-center gap-1 shrink-0">
                        <span>Select</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                );
              }

              if (item.type === "article") {
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? "bg-brand-600/20 border border-brand-500/40 text-white"
                        : "hover:bg-slate-800/50 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-800/50 text-sky-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="text-left truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{item.title}</p>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.categoryName ? (
                            <span className="text-indigo-300 mr-2 font-medium">
                              📁 {item.categoryName}
                            </span>
                          ) : null}
                          {item.summary || "No excerpt available"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.readingTime ? (
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          {item.readingTime}m read
                        </span>
                      ) : null}
                      {isSelected ? (
                        <CornerDownLeft className="w-3.5 h-3.5 text-brand-300" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              }

              if (item.type === "category") {
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? "bg-brand-600/20 border border-brand-500/40 text-white"
                        : "hover:bg-slate-800/50 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 flex items-center justify-center shrink-0">
                        <FolderTree className="w-4 h-4" />
                      </div>
                      <div className="text-left truncate">
                        <p className="text-xs font-bold text-white">Category: {item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description || "Browse articles filed in this category"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {typeof item.articleCount === "number" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {item.articleCount} articles
                        </span>
                      )}
                      {isSelected ? (
                        <CornerDownLeft className="w-3.5 h-3.5 text-brand-300" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              }

              if (item.type === "tag") {
                return (
                  <div
                    key={item.id}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? "bg-brand-600/20 border border-brand-500/40 text-white"
                        : "hover:bg-slate-800/50 text-slate-300 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0">
                        <TagIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left truncate">
                        <p className="text-xs font-bold text-white">Tag: #{item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          Filter articles tagged with #{item.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {typeof item.articleCount === "number" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          {item.articleCount} articles
                        </span>
                      )}
                      {isSelected ? (
                        <CornerDownLeft className="w-3.5 h-3.5 text-brand-300" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-white">No results found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No articles, categories, or actions matched &ldquo;{query}&rdquo;. Try another search term or browse by category.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Shortcuts */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                ↑↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                ESC
              </kbd>
              <span>to close</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 font-semibold text-brand-400">
            <span>CompanyWiki</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
