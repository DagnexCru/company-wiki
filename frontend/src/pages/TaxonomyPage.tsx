import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderTree,
  Tag as TagIcon,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { taxonomyService } from "../services/taxonomyService";
import { CategoryBadge } from "../components/CategoryBadge";
import type { Category, Tag, CategoryInput } from "../types/taxonomy";

export const TaxonomyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"categories" | "tags">("categories");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Category Modal State (Admin)
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryForm, setCategoryForm] = useState<CategoryInput>({
    name: "",
    description: "",
    icon: "code",
    color: "indigo",
  });
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // New Tag Form State (Admin)
  const [newTagName, setNewTagName] = useState<string>("");
  const [savingTag, setSavingTag] = useState<boolean>(false);

  const fetchTaxonomy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, tgs] = await Promise.all([
        taxonomyService.getCategories(),
        taxonomyService.getTags(),
      ]);
      setCategories(cats);
      setTags(tgs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load taxonomy.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxonomy();
  }, [fetchTaxonomy]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    setSavingCategory(true);
    setError(null);
    try {
      await taxonomyService.createCategory(categoryForm);
      setShowCategoryModal(false);
      setCategoryForm({ name: "", description: "", icon: "code", color: "indigo" });
      setSuccessMsg("Category created successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchTaxonomy();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category.";
      setError(msg);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (slug: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"? Existing articles will be kept safely as Uncategorized.`)) {
      return;
    }
    try {
      await taxonomyService.deleteCategory(slug);
      setSuccessMsg(`Category "${name}" removed.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchTaxonomy();
    } catch {
      setError("Failed to delete category.");
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setSavingTag(true);
    setError(null);
    try {
      await taxonomyService.createTag({ name: newTagName.trim() });
      setNewTagName("");
      setSuccessMsg("Tag created successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchTaxonomy();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create tag.";
      setError(msg);
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (slug: string, name: string) => {
    if (!window.confirm(`Delete tag #${name}?`)) return;
    try {
      await taxonomyService.deleteTag(slug);
      setSuccessMsg(`Tag #${name} deleted.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchTaxonomy();
    } catch {
      setError("Failed to delete tag.");
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Taxonomy & Content Organization
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse knowledge by department, project domain, or cross-cutting technical tags.
          </p>
        </div>

        {isAdmin && activeTab === "categories" && (
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("categories")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "categories"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === "tags"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <TagIcon className="w-4 h-4" />
          Tags ({tags.length})
        </button>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {!loading && activeTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group flex flex-col justify-between p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <CategoryBadge category={category} size="md" />
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteCategory(category.slug, category.name)}
                      title="Delete category"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2 line-clamp-3">
                  {category.description || "Articles and documentation belonging to this category."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {category.article_count} {category.article_count === 1 ? "Article" : "Articles"}
                </span>

                <button
                  onClick={() => navigate(`/articles?category=${category.slug}`)}
                  className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Browse <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAGS TAB */}
      {!loading && activeTab === "tags" && (
        <div className="space-y-6">
          {/* Admin Tag Creator Bar */}
          {isAdmin && (
            <form
              onSubmit={handleCreateTag}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 max-w-md"
            >
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Kubernetes, Security, PostgreSQL..."
                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={savingTag || !newTagName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {savingTag ? "Adding..." : "Add Tag"}
              </button>
            </form>
          )}

          {/* Tag Cloud Chips */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-400 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                <button
                  onClick={() => navigate(`/articles?tag=${tag.slug}`)}
                  className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5"
                >
                  <TagIcon className="w-3 h-3 text-slate-400" />
                  <span>#{tag.name}</span>
                </button>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {tag.article_count}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteTag(tag.slug, tag.name)}
                    title={`Delete #${tag.name}`}
                    className="text-slate-400 hover:text-rose-500 ml-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL (Admin) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Knowledge Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Establish a standard departmental category to organize company documentation.
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Information Security"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scope & Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="What documentation belongs in this category?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Icon Identifier
                  </label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="code">Code (Engineering)</option>
                    <option value="life-buoy">Life Buoy (IT Support)</option>
                    <option value="users">Users (Human Resources)</option>
                    <option value="server">Server (Operations/DevOps)</option>
                    <option value="rocket">Rocket (Onboarding)</option>
                    <option value="shield">Shield (Security/Policy)</option>
                    <option value="folder">Folder (General)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Color Accent
                  </label>
                  <select
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="sky">Sky Blue</option>
                    <option value="purple">Purple</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory || !categoryForm.name.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {savingCategory ? "Saving..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// UX Design: Tabbed interface switches between Department Categories and Tag Cloud.
