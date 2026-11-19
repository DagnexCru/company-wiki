import React, { useState } from "react";
import {
  X,
  FileText,
  Download,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Layers,
  Sparkles,
  Eye,
} from "lucide-react";
import type { PdfExportOptions } from "../services/articleService";

interface PdfExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
  articleSlug: string;
  onExport: (options: PdfExportOptions) => Promise<void>;
  isExporting: boolean;
}

export const PdfExportOptionsModal: React.FC<PdfExportOptionsModalProps> = ({
  isOpen,
  onClose,
  articleTitle,
  articleSlug,
  onExport,
  isExporting,
}) => {
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [classification, setClassification] = useState<
    "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "PUBLIC"
  >("INTERNAL");
  const [watermark, setWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("CONFIDENTIAL - INTERNAL");
  const [includeToc, setIncludeToc] = useState<boolean>(true);

  if (!isOpen) return null;

  const classificationConfig = {
    CONFIDENTIAL: {
      label: "CONFIDENTIAL",
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      border: "border-rose-300 dark:border-rose-800",
      badgeBg: "bg-rose-600 text-white",
      icon: ShieldAlert,
    },
    RESTRICTED: {
      label: "RESTRICTED",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-300 dark:border-amber-800",
      badgeBg: "bg-amber-600 text-white",
      icon: ShieldAlert,
    },
    INTERNAL: {
      label: "INTERNAL",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-300 dark:border-indigo-800",
      badgeBg: "bg-indigo-600 text-white",
      icon: Shield,
    },
    PUBLIC: {
      label: "PUBLIC",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-300 dark:border-emerald-800",
      badgeBg: "bg-emerald-600 text-white",
      icon: ShieldCheck,
    },
  }[classification];

  const handleClassificationChange = (
    val: "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "PUBLIC"
  ) => {
    setClassification(val);
    if (val === "CONFIDENTIAL") {
      setWatermark(true);
      setWatermarkText("CONFIDENTIAL - INTERNAL USE ONLY");
    } else if (val === "RESTRICTED") {
      setWatermark(true);
      setWatermarkText("RESTRICTED ACCESS - PROPERTY OF WIKI");
    }
  };

  const handleConfirm = async () => {
    await onExport({
      includeCover,
      classification,
      watermark,
      watermarkText: watermark ? watermarkText : undefined,
      includeToc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Enterprise Branded PDF Export
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <Sparkles className="w-3 h-3 text-rose-500" /> Executive Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {articleTitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Mini Preview Card */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>Document Preview Outline</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
            {/* Watermark preview overlay */}
            {watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 opacity-15 rotate-[-25deg]">
                <span className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white tracking-widest text-center px-4 border-2 border-slate-900 dark:border-white">
                  {watermarkText || "WATERMARK"}
                </span>
              </div>
            )}

            {/* Top Bar Preview */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 text-[10px]">
              <div className="font-extrabold text-indigo-600 dark:text-indigo-400">
                COMPANY WIKI
              </div>
              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${classificationConfig.badgeBg}`}>
                • {classification}
              </span>
            </div>

            {/* Title & Cover simulation */}
            {includeCover ? (
              <div className="space-y-1.5 text-left">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-100 line-clamp-1">
                  {articleTitle}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>ID: SOP-{articleSlug.slice(0, 10).toUpperCase()}</div>
                  <div>Security: {classification}</div>
                  <div>Format: Two-Pass Numbered (Page X of Y)</div>
                  <div>Cover Page: Included</div>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                Direct content rendering without executive cover page
              </div>
            )}

            {includeToc && (
              <div className="mt-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-500" />
                <span>Automated Table of Contents enabled</span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Options */}
        <div className="space-y-4 text-xs">
          {/* 1. Cover Page Toggle */}
          <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer">
            <input
              type="checkbox"
              checked={includeCover}
              onChange={(e) => setIncludeCover(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Include Executive Cover Sheet
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Generates a corporate title page with document identifier, authors, dates, and compliance notice.
              </p>
            </div>
          </label>

          {/* 2. Security Classification Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 dark:text-white block">
              Document Security Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["INTERNAL", "CONFIDENTIAL", "RESTRICTED", "PUBLIC"] as const).map((cls) => {
                const isSelected = classification === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassificationChange(cls)}
                    className={`px-3 py-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                      isSelected
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {cls}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Watermark Protection Toggle & Custom Text */}
          <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  Add Security Watermark
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Draws a semi-transparent diagonal watermark across all pages for copy protection.
                </p>
              </div>
            </label>

            {watermark && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Watermark text (e.g. CONFIDENTIAL)"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                <div className="flex flex-wrap gap-1.5">
                  {["CONFIDENTIAL", "INTERNAL ONLY", "DO NOT DISTRIBUTE", "DRAFT"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWatermarkText(preset)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400 hover:bg-slate-200 transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Automated Table of Contents Toggle */}
          <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer">
            <input
              type="checkbox"
              checked={includeToc}
              onChange={(e) => setIncludeToc(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Include Table of Contents (TOC)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Extracts Markdown headings into an automated section hierarchy with dot-leaders.
              </p>
            </div>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Branded PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download Branded PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
