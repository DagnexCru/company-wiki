import React, { useState, useEffect, useCallback } from "react";
import {
  Award,
  ShieldCheck,
  Printer,
  X,
  CheckCircle2,
} from "lucide-react";
import { checklistService } from "../services/checklistService";
import type { SopCertificateData } from "../types/checklist";

interface SopCertificateModalProps {
  isOpen: boolean;
  articleSlug: string;
  articleTitle?: string;
  onClose: () => void;
}

export const SopCertificateModal: React.FC<SopCertificateModalProps> = ({
  isOpen,
  articleSlug,
  articleTitle,
  onClose,
}) => {
  const [cert, setCert] = useState<SopCertificateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCert = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checklistService.getCertificate(articleSlug);
      setCert(data);
    } catch {
      setError("Unable to generate certificate. Ensure all SOP steps are 100% completed.");
    } finally {
      setLoading(false);
    }
  }, [articleSlug]);

  useEffect(() => {
    if (isOpen) {
      fetchCert();
    }
  }, [isOpen, fetchCert]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = cert?.completed_at
    ? new Date(cert.completed_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently Verified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-auto print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Official Verifiable Compliance Certificate</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">
              Generating cryptographically signed certificate {articleTitle ? `for "${articleTitle}"` : ""}...
            </p>
          </div>
        ) : error || !cert ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-600">{error || "Failed to load certificate."}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Close
            </button>
          </div>
        ) : (
          /* THE CERTIFICATE CANVAS (PRINTABLE) */
          <div
            id="verifiable-certificate-document"
            className="relative p-6 sm:p-10 rounded-2xl bg-amber-50/20 dark:bg-slate-950 border-4 border-double border-amber-600/40 text-center space-y-6 shadow-xs overflow-hidden select-text"
          >
            {/* Background Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
              <Award className="w-96 h-96 text-amber-900 dark:text-amber-100" />
            </div>

            {/* Certificate Header */}
            <div className="space-y-1 relative z-10">
              <div className="w-14 h-14 mx-auto rounded-full bg-linear-to-tr from-amber-500 via-yellow-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-amber-700 dark:text-amber-400 block">
                Company Wiki Compliance Bureau
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-wide uppercase font-serif">
                Certificate of Completion
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Standard Operating Procedure & Operational Runbook Execution
              </p>
            </div>

            {/* Recipient Details */}
            <div className="space-y-2 py-3 border-y border-amber-500/20 relative z-10">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                This document certifies and officially verifies that
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight underline decoration-amber-500/60 decoration-2 underline-offset-4">
                {cert.recipient_name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {cert.recipient_email} • <span className="uppercase font-semibold">{cert.recipient_role}</span>
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-lg mx-auto pt-2 leading-relaxed">
                has successfully executed, tested, and validated all{" "}
                <strong className="text-slate-900 dark:text-white">
                  {cert.total_steps} required operational checklist steps
                </strong>{" "}
                with 100% compliance for:
              </p>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 pt-1">
                "{cert.article_title}"
              </p>
            </div>

            {/* Verification Metadata & Official Seal */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left pt-2 relative z-10 text-[11px]">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium block">Verification ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white block">
                  {cert.certificate_id}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Status: {cert.status}
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-medium block">Completion Date</span>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {formattedDate}
                </span>
                <span className="text-slate-400 block font-mono text-[10px]">
                  {cert.verification_code}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 flex flex-col items-center sm:items-end justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/60 flex flex-col items-center justify-center p-1 text-center bg-amber-500/5">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[8px] font-extrabold uppercase tracking-tighter text-amber-800 dark:text-amber-300">
                    Official Seal
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Trust Inscription */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between relative z-10">
              <span>Issuer: {cert.issuer}</span>
              <span className="font-mono text-[9px]">Cryptographically Signed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
