import React from "react";
import { slugifyHeading } from "../utils/headingUtils";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  articleSlug?: string;
  checkedItems?: string[];
  onToggleChecklistItem?: (itemKey: string, isChecked: boolean, totalItems: number) => void;
  readOnlyChecklists?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = "",
  checkedItems,
  onToggleChecklistItem,
  readOnlyChecklists = false,
}) => {
  // Count total checklist items in content
  const totalChecklistItems = React.useMemo(() => {
    let count = 0;
    content.split("\n").forEach((l) => {
      if (l.trim().match(/^[-*]\s+\[([ xX])\]/)) {
        count++;
      }
    });
    return count;
  }, [content]);

  // Simple, safe Markdown parser that parses common markdown tokens into styled React elements
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let checklistItemCounter = 0;

  const renderInline = (text: string): React.ReactNode => {
    // Process inline bold, code, and links
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 text-xs font-mono bg-slate-100 text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 rounded border border-slate-200 dark:border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    // Handle fenced code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${index}`} className="my-4 overflow-x-auto rounded-lg bg-slate-900 p-4 border border-slate-800 text-slate-200">
            <pre className="text-xs sm:text-sm font-mono leading-relaxed">
              <code>{codeBuffer.join("\n")}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Images: ![alt](url)
    const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const altText = imgMatch[1] || "Diagram";
      const srcUrl = imgMatch[2];
      elements.push(
        <figure key={index} className="my-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shadow-xs">
          <img
            src={srcUrl}
            alt={altText}
            loading="lazy"
            className="w-full max-h-[550px] object-contain rounded-t-2xl bg-slate-950/20"
          />
          {altText && (
            <figcaption className="px-4 py-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40">
              {altText}
            </figcaption>
          )}
        </figure>
      );
      return;
    }

    // Headings
    if (line.startsWith("# ")) {
      const headingText = line.slice(2).trim();
      const id = slugifyHeading(headingText);
      elements.push(
        <h1 key={index} id={id} className="scroll-mt-24 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800 group">
          {renderInline(headingText)}
        </h1>
      );
      return;
    }
    if (line.startsWith("## ")) {
      const headingText = line.slice(3).trim();
      const id = slugifyHeading(headingText);
      elements.push(
        <h2 key={index} id={id} className="scroll-mt-24 text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-2.5 flex items-center justify-between group">
          <span>{renderInline(headingText)}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 text-sm transition-opacity ml-2">#</a>
        </h2>
      );
      return;
    }
    if (line.startsWith("### ")) {
      const headingText = line.slice(4).trim();
      const id = slugifyHeading(headingText);
      elements.push(
        <h3 key={index} id={id} className="scroll-mt-24 text-lg font-semibold text-slate-800 dark:text-slate-200 mt-5 mb-2 flex items-center justify-between group">
          <span>{renderInline(headingText)}</span>
          <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 text-xs transition-opacity ml-2">#</a>
        </h3>
      );
      return;
    }

    // Blockquotes
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={index} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 rounded-r">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Markdown SOP Checklist Items (- [ ] or - [x] or * [ ] or * [x])
    const trimmed = line.trim();
    const checklistMatch = trimmed.match(/^([-*])\s+\[([ xX])\]\s*(.*)$/);
    if (checklistMatch) {
      const defaultChecked = checklistMatch[2].toLowerCase() === "x";
      const itemText = checklistMatch[3];
      const checklistIndex = checklistItemCounter;
      checklistItemCounter++;

      const cleanSlug = itemText.slice(0, 30).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const itemKey = `${cleanSlug || "task"}-${checklistIndex}`;

      const isChecked = checkedItems !== undefined ? checkedItems.includes(itemKey) : defaultChecked;

      elements.push(
        <div
          key={`checklist-item-${index}`}
          className={`flex items-start gap-3 my-1.5 p-2 rounded-xl transition-all duration-150 ${
            isChecked
              ? "bg-emerald-50/60 dark:bg-emerald-950/20 text-slate-500 dark:text-slate-400"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
          }`}
        >
          <button
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            disabled={readOnlyChecklists}
            onClick={() => {
              if (!readOnlyChecklists && onToggleChecklistItem) {
                onToggleChecklistItem(itemKey, !isChecked, totalChecklistItems);
              }
            }}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 border ${
              isChecked
                ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-800"
            } ${readOnlyChecklists ? "cursor-default opacity-70" : "cursor-pointer"}`}
          >
            {isChecked && (
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <div className={`text-sm sm:text-base leading-relaxed ${isChecked ? "line-through text-slate-400 dark:text-slate-500" : ""}`}>
            {renderInline(itemText)}
          </div>
        </div>
      );
      return;
    }

    // Unordered lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      elements.push(
        <li key={index} className="ml-5 list-disc text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
          {renderInline(line.trim().slice(2))}
        </li>
      );
      return;
    }

    // Blank lines
    if (!line.trim()) {
      elements.push(<div key={index} className="h-2" />);
      return;
    }

    // Regular paragraphs
    elements.push(
      <p key={index} className="text-slate-700 dark:text-slate-300 leading-relaxed my-2 text-sm sm:text-base">
        {renderInline(line)}
      </p>
    );
  });

  return <div className={`article-content space-y-1 break-words ${className}`}>{elements}</div>;
};

// Typography Token: Monospace code blocks are formatted with dark background and border accents.
