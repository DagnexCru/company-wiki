import React from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
} from "lucide-react";
import type { ArticleStatus } from "../types/article";

interface WorkflowStatusBadgeProps {
  status: ArticleStatus | string;
  statusDisplay?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  statusDisplay,
  size = "md",
  showIcon = true,
}) => {
  const normStatus = (status || "").toLowerCase();

  const config = {
    draft: {
      label: statusDisplay || "Draft",
      bg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      dot: "bg-slate-400",
      icon: FileText,
    },
    in_review: {
      label: statusDisplay || "In Review",
      bg: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      dot: "bg-amber-500 animate-pulse",
      icon: Clock,
    },
    published: {
      label: statusDisplay || "Published",
      bg: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    },
    rejected: {
      label: statusDisplay || "Changes Requested",
      bg: "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
      dot: "bg-rose-500",
      icon: AlertCircle,
    },
    archived: {
      label: statusDisplay || "Archived",
      bg: "bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      dot: "bg-purple-400",
      icon: Archive,
    },
  }[normStatus] || {
    label: statusDisplay || status,
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    icon: FileText,
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs font-medium tracking-wide transition-all ${config.bg} ${sizeStyles}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <IconComponent className={iconSizes} />}
      <span>{config.label}</span>
    </span>
  );
};

export default WorkflowStatusBadge;
