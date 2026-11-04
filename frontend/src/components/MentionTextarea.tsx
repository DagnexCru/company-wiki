import React, { useState, useEffect, useRef, useCallback } from "react";
import { AtSign, User } from "lucide-react";
import { notificationService } from "../services/notificationService";
import type { MentionUser } from "../types/notifications";

interface MentionTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  placeholder = "Write a note... Type @ to mention a team member",
  rows = 3,
  disabled = false,
  className = "",
  id,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);

  // Detect @mention trigger from cursor position
  const checkMentionTrigger = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);

    // Find the last occurrence of @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      // Must be at start of string or preceded by whitespace/punctuation
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if (/[\s(]/.test(charBeforeAt) || lastAtIndex === 0) {
        const queryText = textBeforeCursor.slice(lastAtIndex + 1);
        // Only allow valid username characters without whitespace
        if (/^[a-zA-Z0-9_.-]*$/.test(queryText)) {
          setMentionQuery(queryText);
          setMentionStartIndex(lastAtIndex);
          return;
        }
      }
    }

    setIsOpen(false);
    setMentionQuery(null);
    setMentionStartIndex(-1);
  }, [value]);

  // Fetch suggestions when mentionQuery changes
  useEffect(() => {
    let active = true;
    if (mentionQuery !== null) {
      notificationService
        .getMentionSuggestions(mentionQuery)
        .then((users) => {
          if (!active) return;
          setSuggestions(users);
          setSelectedIndex(0);
          setIsOpen(users.length > 0);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        });
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    return () => {
      active = false;
    };
  }, [mentionQuery]);

  // Handle suggestion selection
  const insertMention = (user: MentionUser) => {
    if (!textareaRef.current || mentionStartIndex === -1) return;
    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(cursorPos);
    const insertText = `@${user.username} `;
    const newValue = `${beforeMention}${insertText}${afterMention}`;

    onChange(newValue);
    setIsOpen(false);
    setMentionQuery(null);
    setMentionStartIndex(-1);

    // Restore focus and cursor position after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = beforeMention.length + insertText.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  // Keyboard navigation for mention suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        insertMention(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return { label: "Admin", color: "bg-purple-950/60 text-purple-300 border-purple-700/60" };
      case "AUTHOR":
        return { label: "Author", color: "bg-emerald-950/60 text-emerald-300 border-emerald-700/60" };
      case "REVIEWER":
        return { label: "Reviewer", color: "bg-amber-950/60 text-amber-300 border-amber-700/60" };
      default:
        return { label: "Reader", color: "bg-sky-950/60 text-sky-300 border-sky-700/60" };
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          checkMentionTrigger();
        }}
        onKeyUp={checkMentionTrigger}
        onClick={checkMentionTrigger}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-xl border border-slate-700 bg-slate-900/90 text-slate-100 placeholder-slate-500 p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-y ${className}`}
      />

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bottom-full mb-1 left-0 w-80 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-xl shadow-black/50 p-1.5 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800 mb-1">
            <AtSign className="w-3.5 h-3.5 text-brand-400" />
            <span>Mention Team Member</span>
            <span className="ml-auto text-[10px] text-slate-500 font-mono">↑↓ Enter</span>
          </div>

          <div className="space-y-0.5">
            {suggestions.map((user, idx) => {
              const isSelected = idx === selectedIndex;
              const roleInfo = getRoleBadge(user.role);
              return (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent textarea blur
                    insertMention(user);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? "bg-brand-600/30 text-white border border-brand-500/40"
                      : "text-slate-300 hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-brand-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {user.full_name ? user.full_name[0].toUpperCase() : <User className="w-3 h-3" />}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-slate-100 truncate">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-[10px] text-brand-400 font-mono">@{user.username}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 font-medium ${roleInfo.color}`}
                  >
                    {roleInfo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
