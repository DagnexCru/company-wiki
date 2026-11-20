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
  ChevronLeft,
  ChevronRight,
  Code2,
  AlertCircle,
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
  const [activeTab, setActiveTab] = useState<"cover" | "toc" | "content">("cover");

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

        {/* Interactive Multi-Page Print Previewer */}
        {(() => {
          const availableTabs: Array<{ id: "cover" | "toc" | "content"; label: string; pageNum: number; icon: React.ComponentType<{ className?: string }> }> = [];
          if (includeCover) {
            availableTabs.push({ id: "cover", label: "Cover Sheet", pageNum: 1, icon: FileText });
          }
          if (includeToc) {
            availableTabs.push({ id: "toc", label: "TOC", pageNum: includeCover ? 2 : 1, icon: Layers });
          }
          availableTabs.push({
            id: "content",
            label: "Content & Code",
            pageNum: (includeCover ? 1 : 0) + (includeToc ? 1 : 0) + 1,
            icon: Code2,
          });

          const currentTab =
            (!includeCover && activeTab === "cover") || (!includeToc && activeTab === "toc")
              ? "content"
              : activeTab;
          const currentTabObj = availableTabs.find((t) => t.id === currentTab) || availableTabs[0];
          const totalPages = availableTabs.length;

          const handlePrevPage = () => {
            const curIdx = availableTabs.findIndex((t) => t.id === currentTab);
            if (curIdx > 0) setActiveTab(availableTabs[curIdx - 1].id);
          };

          const handleNextPage = () => {
            const curIdx = availableTabs.findIndex((t) => t.id === currentTab);
            if (curIdx < availableTabs.length - 1) setActiveTab(availableTabs[curIdx + 1].id);
          };

          return (
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-3 overflow-hidden">
              {/* Previewer Header & Page Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <Eye className="w-3.5 h-3.5 text-rose-500" />
                  <span>Interactive Print Previewer</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    (Page {currentTabObj.pageNum} of {totalPages})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Prev / Next controls */}
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={currentTab === availableTabs[0].id}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Previous page preview"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  {/* Thumbnail / Tab Switchers */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {availableTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isSelected = currentTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          }`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentTab === availableTabs[availableTabs.length - 1].id}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Next page preview"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Rendered Live Page Canvas */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden min-h-[200px] flex flex-col justify-between select-none">
                {/* Diagonal watermark simulation */}
                {watermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-10 rotate-[-25deg]">
                    <span className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white tracking-widest text-center px-4 border-2 border-slate-900 dark:border-white">
                      {watermarkText || "WATERMARK"}
                    </span>
                  </div>
                )}

                {/* --- PAGE 1: COVER SHEET --- */}
                {currentTab === "cover" && (
                  <div className="space-y-3 text-left">
                    {/* Top Running Banner */}
                    <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-950/60 pb-2">
                      <div>
                        <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                          COMPANY WIKI
                        </div>
                        <div className="text-[8px] text-slate-400 uppercase tracking-tight">
                          Enterprise Standard Operating Procedure
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${classificationConfig.badgeBg}`}>
                        • {classification}
                      </span>
                    </div>

                    {/* Document Title */}
                    <div className="pt-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-2">
                        {articleTitle}
                      </h4>
                    </div>

                    {/* Executive Summary Box */}
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Executive Scope:{" "}
                      </span>
                      Mission-critical documentation with full corporate governance and compliance matrices.
                    </div>

                    {/* Metadata Matrix Grid */}
                    <div className="grid grid-cols-2 gap-1.5 text-[8.5px] bg-slate-50/80 dark:bg-slate-800/30 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400">ID: </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          SOP-{articleSlug.slice(0, 10).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Security: </span>
                        <span className={`font-bold ${classificationConfig.color}`}>{classification}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Release: </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">v1.0 (Prod)</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Effective: </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">2026-11-20</span>
                      </div>
                    </div>

                    {/* Compliance disclaimer */}
                    <div className="text-[7.5px] text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/60 p-1.5 rounded leading-tight">
                      <b>GOVERNANCE:</b> Authorized for verified enterprise users. Distribution requires security clearance.
                    </div>
                  </div>
                )}

                {/* --- PAGE 2: TABLE OF CONTENTS --- */}
                {currentTab === "toc" && (
                  <div className="space-y-3 text-left">
                    {/* Running Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 text-[9px]">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        COMPANY WIKI <span className="text-slate-400 font-normal">| Table of Contents</span>
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${classificationConfig.badgeBg}`}>
                        • {classification}
                      </span>
                    </div>

                    <div className="pt-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                        Table of Contents
                      </div>
                    </div>

                    {/* Simulated dot-leader TOC rows */}
                    <div className="space-y-1.5 text-[9px] pt-1">
                      {[
                        { title: "1. System Overview & Architecture", sec: "Section 1" },
                        { title: "2. High-Fidelity Markdown Specifications", sec: "Section 1" },
                        { title: "3. Rolling Deployment Procedures", sec: "Section 2" },
                        { title: "4. Health Verification & Telemetry", sec: "Section 2" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-1 text-slate-600 dark:text-slate-300">
                          <span className="font-medium truncate">{item.title}</span>
                          <span className="text-slate-300 dark:text-slate-600 tracking-widest text-[8px] overflow-hidden whitespace-nowrap">
                            . . . . . . . . . . . . . . . . . . . . . . . . . . . .
                          </span>
                          <span className="text-slate-400 text-[8px] shrink-0">{item.sec}</span>
                        </div>
                      ))}
                    </div>

                    {/* Running Footer */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[8px] text-slate-400">
                      <span>CompanyWiki Enterprise Edition</span>
                      <span>Page {currentTabObj.pageNum} of {totalPages}</span>
                    </div>
                  </div>
                )}

                {/* --- PAGE 3: HIGH-FIDELITY CONTENT & ELEMENTS --- */}
                {currentTab === "content" && (
                  <div className="space-y-2.5 text-left">
                    {/* Running Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5 text-[9px]">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        COMPANY WIKI <span className="text-slate-400 font-normal">| Knowledge Base</span>
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${classificationConfig.badgeBg}`}>
                        • {classification}
                      </span>
                    </div>

                    {/* 1. High-Fidelity GitHub-style Callout */}
                    <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-500 border-r border-t border-b border-blue-100 dark:border-blue-900/40">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-700 dark:text-blue-400">
                        <AlertCircle className="w-3 h-3 text-blue-600" />
                        <span>[!NOTE] DEPLOYMENT POLICY</span>
                      </div>
                      <p className="text-[8.5px] text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">
                        Ensure all container pods are drain-safe before rolling cluster upgrades.
                      </p>
                    </div>

                    {/* 2. High-Fidelity Syntax Highlighted Code Container */}
                    <div className="rounded-lg overflow-hidden border border-slate-800 bg-[#0b0f19] text-[8px]">
                      <div className="bg-[#1e293b] px-2 py-0.5 text-[7px] font-bold font-mono text-slate-400 flex items-center justify-between">
                        <span>SOURCE CODE // TYPESCRIPT</span>
                        <Code2 className="w-2.5 h-2.5 text-slate-500" />
                      </div>
                      <pre className="p-2 font-mono text-[8px] leading-relaxed text-slate-100 overflow-x-auto">
                        <span className="text-sky-400">const</span> deploy = <span className="text-sky-400">async</span> () =&gt; &#123;<br/>
                        &nbsp;&nbsp;<span className="text-purple-400">return</span> <span className="text-sky-400">await</span> k8s.<span className="text-amber-400">rollout</span>(&#123; <span className="text-emerald-400">replicas</span>: <span className="text-purple-400">3</span> &#125;);<br/>
                        &#125;;
                      </pre>
                    </div>

                    {/* 3. High-Fidelity Data Table */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-[8px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-2 py-1">Service</th>
                            <th className="px-2 py-1">Replicas</th>
                            <th className="px-2 py-1">Memory</th>
                            <th className="px-2 py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                          <tr className="bg-white dark:bg-slate-900">
                            <td className="px-2 py-0.5 font-mono text-indigo-600 dark:text-indigo-400">api-core</td>
                            <td className="px-2 py-0.5">5</td>
                            <td className="px-2 py-0.5">2Gi</td>
                            <td className="px-2 py-0.5 text-emerald-600 font-semibold">Active</td>
                          </tr>
                          <tr className="bg-slate-50 dark:bg-slate-850">
                            <td className="px-2 py-0.5 font-mono text-indigo-600 dark:text-indigo-400">worker-daemon</td>
                            <td className="px-2 py-0.5">3</td>
                            <td className="px-2 py-0.5">1Gi</td>
                            <td className="px-2 py-0.5 text-emerald-600 font-semibold">Healthy</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Running Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[8px] text-slate-400">
                      <span>CompanyWiki Enterprise Edition</span>
                      <span>Page {currentTabObj.pageNum} of {totalPages}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
