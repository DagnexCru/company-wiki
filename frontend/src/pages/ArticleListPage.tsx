import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  FileText,
  Filter,
  Tag as TagIcon,
  X,
  ArrowUpDown,
  RotateCcw,
  ChevronDown,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { articleService } from "../services/articleService";
import { taxonomyService } from "../services/taxonomyService";
import { CategoryBadge } from "../components/CategoryBadge";
import { WorkflowStatusBadge } from "../components/WorkflowStatusBadge";
import type { ArticleListItem, ArticleFilterParams } from "../types/article";
import type { Category, Tag } from "../types/taxonomy";

export const ArticleListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize from URL search parameters for link persistence
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialTag = searchParams.get("tag") || "";
  const initialStatus = searchParams.get("status") || "all";
  const initialSort = searchParams.get("sort") || "-updated_at";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialPageSize = parseInt(searchParams.get("page_size") || "9", 10);

  const [search, setSearch] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [sortOrder, setSortOrder] = useState<string>(initialSort);
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Custom downward dropdown states
  const [tagDropdownOpen, setTagDropdownOpen] = useState<boolean>(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState<boolean>(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState<boolean>(false);

  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setTagDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTagDropdownOpen(false);
        setCategoryDropdownOpen(false);
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const canCreate = user?.role === "ADMIN" || user?.role === "AUTHOR";

  // Debounce search input for snappy, smooth typing without API thrashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load categories and tags taxonomy on mount
  useEffect(() => {
    taxonomyService.getCategories().then(setCategories).catch(() => {});
    taxonomyService.getTags().then(setTags).catch(() => {});
  }, []);

  // Synchronize URL search params with active state
  const updateUrlParams = useCallback(
    (updates: {
      search?: string;
      category?: string;
      tag?: string;
      status?: string;
      sort?: string;
      page?: number;
      page_size?: number;
    }) => {
      const nextParams = new URLSearchParams(searchParams);

      const s = updates.search !== undefined ? updates.search : debouncedSearch;
      if (s.trim()) nextParams.set("search", s.trim());
      else nextParams.delete("search");

      const cat = updates.category !== undefined ? updates.category : selectedCategory;
      if (cat) nextParams.set("category", cat);
      else nextParams.delete("category");

      const t = updates.tag !== undefined ? updates.tag : selectedTag;
      if (t) nextParams.set("tag", t);
      else nextParams.delete("tag");

      const st = updates.status !== undefined ? updates.status : statusFilter;
      if (st && st !== "all") nextParams.set("status", st);
      else nextParams.delete("status");

      const so = updates.sort !== undefined ? updates.sort : sortOrder;
      if (so && so !== "-updated_at") nextParams.set("sort", so);
      else nextParams.delete("sort");

      const p = updates.page !== undefined ? updates.page : page;
      if (p > 1) nextParams.set("page", p.toString());
      else nextParams.delete("page");

      const ps = updates.page_size !== undefined ? updates.page_size : pageSize;
      if (ps !== 9) nextParams.set("page_size", ps.toString());
      else nextParams.delete("page_size");

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, debouncedSearch, selectedCategory, selectedTag, statusFilter, sortOrder, page, pageSize, setSearchParams]
  );

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ArticleFilterParams = {
        page,
        page_size: pageSize,
        ordering: sortOrder,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      if (selectedTag) {
        params.tag = selectedTag;
      }

      const data = await articleService.getArticles(params);
      setArticles(data.results);
      setTotalCount(data.count);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load knowledge articles.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortOrder, debouncedSearch, statusFilter, selectedCategory, selectedTag]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    updateUrlParams({ search: val, page: 1 });
  };

  const handleClearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    updateUrlParams({ search: "", page: 1 });
  };

  const handleCategoryChange = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setPage(1);
    updateUrlParams({ category: catSlug, page: 1 });
  };

  const handleTagChange = (tagSlug: string) => {
    setSelectedTag(tagSlug);
    setPage(1);
    updateUrlParams({ tag: tagSlug, page: 1 });
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    updateUrlParams({ status, page: 1 });
  };

  const handleSortChange = (newSort: string) => {
    setSortOrder(newSort);
    setPage(1);
    updateUrlParams({ sort: newSort, page: 1 });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    updateUrlParams({ page_size: newSize, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrlParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory("");
    setSelectedTag("");
    setStatusFilter("all");
    setSortOrder("-updated_at");
    setPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = Boolean(
    debouncedSearch.trim() ||
      selectedCategory ||
      selectedTag ||
      statusFilter !== "all" ||
      sortOrder !== "-updated_at"
  );

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Generate pagination items
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse, search, and filter technical documentation organized by categories, tags, and status.
          </p>
        </div>

        {canCreate && (
          <Link
            to="/articles/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm shadow-indigo-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Article
          </Link>
        )}
      </div>

      {/* Main Search, Filter & Sort Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top row: Search input + Sorting selector */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Debounced Search input with clear button */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search across title, summary, content, tags, or categories..."
              className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setSortDropdownOpen((prev) => !prev);
                setTagDropdownOpen(false);
                setCategoryDropdownOpen(false);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {sortOrder === "-updated_at" && "Recently Updated"}
                {sortOrder === "-created_at" && "Newest First"}
                {sortOrder === "created_at" && "Oldest First"}
                {sortOrder === "title" && "Title (A to Z)"}
                {sortOrder === "-title" && "Title (Z to A)"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${sortDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl py-1.5 z-50 divide-y divide-slate-800/60 animate-in fade-in-50 duration-150">
                {[
                  { value: "-updated_at", label: "Recently Updated" },
                  { value: "-created_at", label: "Newest First" },
                  { value: "created_at", label: "Oldest First" },
                  { value: "title", label: "Title (A to Z)" },
                  { value: "-title", label: "Title (Z to A)" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      handleSortChange(s.value);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      sortOrder === s.value
                        ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{s.label}</span>
                    {sortOrder === s.value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Category Filter, Tag Filter, Status Tabs */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setCategoryDropdownOpen((prev) => !prev);
                  setTagDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  selectedCategory
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="max-w-[130px] truncate">
                  {selectedCategory
                    ? categories.find((c) => c.slug === selectedCategory)?.name || "Category"
                    : "All Categories"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${categoryDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl py-1.5 z-50 max-h-64 overflow-y-auto divide-y divide-slate-800/60 animate-in fade-in-50 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      handleCategoryChange("");
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      !selectedCategory
                        ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>All Categories</span>
                    {!selectedCategory && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        handleCategoryChange(c.slug);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedCategory === c.slug
                          ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-500 font-mono">({c.article_count})</span>
                        {selectedCategory === c.slug && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tag Dropdown - Custom Downward Menu */}
            <div className="relative" ref={tagDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setTagDropdownOpen((prev) => !prev);
                  setCategoryDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className={`inline-flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  selectedTag
                    ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                <TagIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="max-w-[130px] truncate">
                  {selectedTag
                    ? `#${tags.find((t) => t.slug === selectedTag)?.name || selectedTag}`
                    : "All Tags"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${tagDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {tagDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl py-1.5 z-50 max-h-64 overflow-y-auto divide-y divide-slate-800/60 animate-in fade-in-50 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      handleTagChange("");
                      setTagDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      !selectedTag
                        ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>All Tags</span>
                    {!selectedTag && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        handleTagChange(t.slug);
                        setTagDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedTag === t.slug
                          ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <span className="truncate">#{t.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-slate-500 font-mono">({t.article_count})</span>
                        {selectedTag === t.slug && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: "all", label: "All Content" },
              { id: "published", label: "Published" },
              ...(canCreate || user?.role === "REVIEWER" ? [{ id: "in_review", label: "In Review" }] : []),
              ...(canCreate ? [{ id: "draft", label: "Drafts" }, { id: "rejected", label: "Needs Revision" }] : []),
              { id: "archived", label: "Archived" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar & Reset Button */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-500 dark:text-slate-400">Active Filters:</span>
            {debouncedSearch.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                Query: "{debouncedSearch}"
                <button onClick={handleClearSearch} className="hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => handleCategoryChange("")} className="hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
                <TagIcon className="w-3 h-3" /> #{tags.find((t) => t.slug === selectedTag)?.name || selectedTag}
                <button onClick={() => handleTagChange("")} className="hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                Status: {statusFilter}
                <button onClick={() => handleStatusChange("all")} className="hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
            {sortOrder !== "-updated_at" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Sort: {sortOrder}
                <button onClick={() => handleSortChange("-updated_at")} className="hover:text-rose-600 transition-colors">
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </span>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset all filters
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
          <button
            onClick={fetchArticles}
            className="text-xs font-medium text-rose-700 dark:text-rose-300 underline hover:no-underline flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(pageSize)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 pt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && (
        <div className="text-center py-16 px-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {hasActiveFilters ? "No matching articles found" : "No articles available"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            {hasActiveFilters
              ? "No knowledge articles match your current search and filter combination. Try broadening your keywords or resetting filters."
              : "There are no knowledge articles published yet. Start creating company documentation."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Reset Filters
              </button>
            )}
            {canCreate && (
              <Link
                to="/articles/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Write First Article
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Article Cards Grid */}
      {!loading && !error && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate(`/articles/${article.slug}`)}
              className="group cursor-pointer flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md transition-all"
            >
              <div>
                {/* Status and Category header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {article.category && <CategoryBadge category={article.category} size="sm" />}
                    <WorkflowStatusBadge status={article.status} statusDisplay={article.status_display} size="sm" />
                    {article.is_featured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Featured
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {article.estimated_read_time} min
                  </span>
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {article.summary || "Click to open and read full documentation..."}
                </p>

                {/* Tag Pills */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {article.tags.map((t) => (
                      <button
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTagChange(t.slug);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium transition-colors"
                      >
                        #{t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-[10px]">
                    {article.author.full_name
                      ? article.author.full_name[0].toUpperCase()
                      : article.author.username[0].toUpperCase()}
                  </div>
                  <span className="truncate max-w-[120px]">
                    {article.author.full_name || article.author.username}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* Results summary and Page size selector */}
          <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <p>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(page * pageSize, totalCount)}
              </span>{" "}
              of <span className="font-semibold text-slate-900 dark:text-white">{totalCount}</span> articles
            </p>

            <div className="flex items-center gap-1.5 text-xs">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
              </select>
            </div>
          </div>

          {/* Page numbers navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 max-w-full overflow-x-auto py-1">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(p)}
                      className={`min-w-8 h-8 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        page === p
                          ? "bg-indigo-600 text-white font-semibold shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-400 text-xs">
                      {p}
                    </span>
                  )
                )}
              </div>

              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
