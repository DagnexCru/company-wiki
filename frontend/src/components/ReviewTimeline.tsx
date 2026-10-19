import React from "react";
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  MessageSquare,
  ArrowRight,
  User,
} from "lucide-react";
import type { ReviewRecord } from "../types/workflow";
import { WorkflowStatusBadge } from "./WorkflowStatusBadge";

interface ReviewTimelineProps {
  records: ReviewRecord[];
  isLoading?: boolean;
}

export const ReviewTimeline: React.FC<ReviewTimelineProps> = ({
  records,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="py-6 flex justify-center items-center gap-2 text-sm text-slate-500">
        <Clock className="w-4 h-4 animate-spin text-indigo-600" />
        <span>Loading review history...</span>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
        <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No workflow events recorded yet
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Review submissions, approvals, and revision requests will appear here.
        </p>
      </div>
    );
  }

  const getActionConfig = (action: string) => {
    switch (action.toLowerCase()) {
      case "submit":
        return {
          icon: Send,
          color: "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800",
          title: "Submitted for Review",
        };
      case "approve":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800",
          title: "Approved & Published",
        };
      case "reject":
        return {
          icon: XCircle,
          color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800",
          title: "Changes Requested (Rejected)",
        };
      default:
        return {
          icon: Clock,
          color: "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
          title: action,
        };
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {records.map((record) => {
        const config = getActionConfig(record.action);
        const ActionIcon = config.icon;
        const formattedDate = new Date(record.created_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });

        return (
          <div key={record.id} className="relative group">
            {/* Timeline icon dot */}
            <div
              className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 shadow-xs ${config.color}`}
            >
              <ActionIcon className="w-3.5 h-3.5" />
            </div>

            {/* Event Content Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {config.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {record.actor.full_name || record.actor.username}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase">
                      {record.actor.role}
                    </span>
                  </div>
                </div>
                <time className="text-xs text-slate-400">{formattedDate}</time>
              </div>

              {/* Status Transition flow */}
              <div className="flex items-center gap-2 text-xs py-1 text-slate-500 mb-2">
                <span>Transition:</span>
                <WorkflowStatusBadge status={record.from_status} size="sm" showIcon={false} />
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <WorkflowStatusBadge status={record.to_status} size="sm" showIcon={false} />
              </div>

              {/* Feedback text */}
              {record.feedback && (
                <div
                  className={`mt-2.5 p-3 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 ${
                    record.action === "reject"
                      ? "bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40"
                      : "bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                  <p className="whitespace-pre-wrap">{record.feedback}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewTimeline;
