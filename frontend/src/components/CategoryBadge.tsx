import React from "react";
import { Folder, Code, LifeBuoy, Users, Server, Rocket, Shield } from "lucide-react";
import type { Category } from "../types/taxonomy";

interface CategoryBadgeProps {
  category: Category;
  size?: "sm" | "md";
  onClick?: () => void;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = "sm",
  onClick,
  className = "",
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case "code":
        return <Code className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      case "life-buoy":
      case "it":
        return <LifeBuoy className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      case "users":
      case "hr":
        return <Users className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      case "server":
      case "devops":
        return <Server className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      case "rocket":
      case "onboarding":
        return <Rocket className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      case "shield":
      case "security":
        return <Shield className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      default:
        return <Folder className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
    }
  };

  const getColorClasses = (colorName: string) => {
    switch (colorName.toLowerCase()) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "sky":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
      case "purple":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
      case "indigo":
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5 font-medium";

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-md font-medium border transition-colors ${
        onClick ? "cursor-pointer hover:opacity-85" : ""
      } ${getColorClasses(category.color)} ${sizeClasses} ${className}`}
    >
      {getIcon(category.icon || "")}
      <span>{category.name}</span>
    </span>
  );
};

// Accessibility: Interactive category badges support click events with hover opacity transitions.
