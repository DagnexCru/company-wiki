import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Folder,
  Copy,
  Check,
  Bot,
  User as UserIcon,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import type { AskWikiAiResponse, AiSource } from "../types/ai";
import { aiService } from "../services/aiService";
import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: AiSource[];
  suggestedQuestions?: string[];
  timestamp: string;
}

const QUICK_TOPICS = [
  { label: "🚨 SEV-1 Escalation", query: "How do we escalate SEV-1 incidents?" },
  { label: "💻 $1,500 Remote Stipend", query: "What is our remote work stipend and home office budget?" },
  { label: "🛡️ Zero-Trust YubiKey", query: "What are our Zero-Trust and YubiKey security requirements?" },
  { label: "🐘 PostgreSQL 16 HA", query: "How is our PostgreSQL 16 HA clustering configured?" },
  { label: "☁️ ArgoCD Canary", query: "How do automated canary rollbacks work in ArgoCD?" },
  { label: "📋 SOC 2 Audit Logging", query: "What are our SOC 2 Type II audit logging requirements?" },
];

export const AskWikiAiDrawer: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastUserIdRef = useRef<string | undefined>(user?.id);

  /**
   * Intelligently extract the user's preferred first name or display name
   * from full_name, username, or email.
   */
  const getPersonName = (): string => {
    if (!user) return "there";
    const raw = (user.full_name || "").trim();
    if (raw && raw.toLowerCase() !== "hacker attempt") {
      const parts = raw.split(/\s+/);
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    if (user.username) {
      const clean = user.username.replace(/[._-]+/g, " ").trim();
      const parts = clean.split(/\s+/);
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    if (user.email) {
      const prefix = user.email.split("@")[0].replace(/[._-]+/g, " ").trim();
      const parts = prefix.split(/\s+/);
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
    return "there";
  };

  const getInitialWelcome = (name: string): ChatMessage => ({
    id: "welcome-1",
    sender: "ai",
    text: `### 👋 Welcome, ${name}!\n\nI am your **Company Wiki AI Assistant**. What can I help you with today?\n\nI have direct access to our verified corporate knowledge base across these core areas:\n\n- 🚨 **Incident Response & SRE**: SEV-1 to SEV-4 escalation runbooks, on-call paging, and SLA commitments.\n- 🛡️ **Security & Compliance**: Zero-Trust access, YubiKey hardware 2FA keys, and SOC 2 Type II audit logging.\n- 🏗️ **Engineering & Architecture**: High-availability PostgreSQL 16 clustering, PgBouncer pooling, and REST API idempotency.\n- ☁️ **DevOps & Cloud Infrastructure**: ArgoCD Canary GitOps deployments, Kubernetes manifests, and automated rollbacks.\n- 👥 **People Operations & HR**: Global remote work stipends ($1,500 budget), core working hours, and 30-day onboarding checklists.\n- 💻 **IT Support & Workplace**: MDM workstation security, BitLocker / FileVault enforcement, and hardware provisioning.\n- 🎨 **Product & Design System**: Tailwind design tokens, semantic palettes, and WCAG 2.1 AA accessibility standards.\n- 📊 **Data Engineering & Analytics**: Snowflake dbt data warehouse staging models and analytics pipelines.\n- 🤝 **Customer Support & Success**: Enterprise client SLAs, tier-3 support escalation matrices, and 99.9% uptime guarantees.\n- ⚖️ **Legal & Privacy Governance**: GDPR Right-to-be-Forgotten data subject erasure protocols.\n\n💡 *Feel free to ask any question in plain English (e.g., **"What is our remote work stipend?"** or **"How do we escalate SEV-1 incidents?"**), or tap any suggested question below!*`,
    suggestedQuestions: [
      "What is our remote work stipend and home office budget?",
      "How do we escalate SEV-1 incidents?",
      "What are our Zero-Trust and YubiKey security requirements?",
      "How is our PostgreSQL 16 HA clustering configured?",
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getInitialWelcome(getPersonName()),
  ]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || query).trim();
    if (!textToSend || loading) return;

    const isFirst = messages.filter((m) => m.sender === "user").length === 0;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res: AskWikiAiResponse = await aiService.askWikiAi({
        query: textToSend,
        is_first_interaction: isFirst,
        user_name: getPersonName(),
      });

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: res.answer,
        sources: res.sources,
        suggestedQuestions: res.suggested_questions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to retrieve an answer from Wiki AI.";
      const errorResponse: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Error**: ${errorMsg}. Please ensure you are logged in and try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize personalized name and detect when user account switches / registers / logs in
  useEffect(() => {
    const currentName = getPersonName();
    if (lastUserIdRef.current !== user?.id) {
      // Account changed: Reset message thread with new user's greeting
      lastUserIdRef.current = user?.id;
      setMessages([getInitialWelcome(currentName)]);
      setQuery("");
    } else {
      // Same user: update welcome message if thread hasn't started yet
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome-1") {
          return [getInitialWelcome(currentName)];
        }
        return prev;
      });
    }
  }, [user]);

  // Listen for global custom event: open-ask-wiki-ai
  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string }>;
      setIsOpen(true);
      // Ensure welcome card has the latest name on open
      const currentName = getPersonName();
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome-1") {
          return [getInitialWelcome(currentName)];
        }
        return prev;
      });

      if (customEvent.detail?.query) {
        setQuery(customEvent.detail.query);
        handleSendQuery(customEvent.detail.query);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    };

    window.addEventListener("open-ask-wiki-ai", handleOpenEvent);
    return () => window.removeEventListener("open-ask-wiki-ai", handleOpenEvent);
  }, [user]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleResetChat = () => {
    setMessages([getInitialWelcome(getPersonName())]);
    setQuery("");
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /**
   * Safe inline Markdown formatter:
   * Formats headers, quotes, bullet points, bolding, code tokens, and internal article links cleanly.
   */
  const renderFormattedAiText = (rawText: string) => {
    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];

    const parseInlineTokens = (lineText: string, keyPrefix: string): React.ReactNode => {
      const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
      const parts = lineText.split(regex);

      return parts.map((part, pIdx) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={`${keyPrefix}-c-${pIdx}`}
              className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-[11px] text-indigo-300 border border-slate-700/60"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={`${keyPrefix}-b-${pIdx}`} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return (
            <em key={`${keyPrefix}-i-${pIdx}`} className="italic text-slate-300">
              {part.slice(1, -1)}
            </em>
          );
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const linkTitle = linkMatch[1];
          const linkHref = linkMatch[2];
          if (linkHref.startsWith("/")) {
            return (
              <Link
                key={`${keyPrefix}-l-${pIdx}`}
                to={linkHref}
                onClick={() => setIsOpen(false)}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium transition-colors"
              >
                {linkTitle}
              </Link>
            );
          }
          return (
            <a
              key={`${keyPrefix}-a-${pIdx}`}
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              {linkTitle}
            </a>
          );
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4
            key={`h4-${idx}`}
            className="text-xs sm:text-sm font-bold text-indigo-200 mt-2 mb-1"
          >
            {parseInlineTokens(trimmed.slice(4), `h4-${idx}`)}
          </h4>
        );
      } else if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote
            key={`bq-${idx}`}
            className="border-l-2 border-indigo-400 pl-2.5 py-1 my-1.5 italic text-slate-300 bg-slate-900/60 rounded-r text-[11px] leading-relaxed"
          >
            {parseInlineTokens(trimmed.slice(2), `bq-${idx}`)}
          </blockquote>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <div key={`li-${idx}`} className="flex items-start gap-1.5 my-1 ml-1 text-slate-300">
            <span className="text-indigo-400 font-bold shrink-0 leading-relaxed">•</span>
            <span className="leading-relaxed">{parseInlineTokens(trimmed.slice(2), `li-${idx}`)}</span>
          </div>
        );
      } else if (!trimmed) {
        elements.push(<div key={`sp-${idx}`} className="h-1.5" />);
      } else {
        elements.push(
          <p key={`p-${idx}`} className="leading-relaxed text-slate-200 my-0.5">
            {parseInlineTokens(line, `p-${idx}`)}
          </p>
        );
      }
    });

    return <div className="space-y-0.5">{elements}</div>;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50 duration-150"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Wiki AI Assistant"
    >
      <div
        className="relative w-full max-w-xl h-full sm:h-[95vh] sm:my-auto sm:mr-4 bg-slate-900 border-l sm:border border-slate-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Ask Wiki AI</h3>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Assistant
                </span>
                {user && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 flex items-center gap-1">
                    <UserIcon className="w-2.5 h-2.5" />
                    {getPersonName()}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Direct answers synthesized from internal documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Reset / Start New Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Topic Shortcut Chips */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
          <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0 mr-1">
            Quick Ask:
          </span>
          {QUICK_TOPICS.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(topic.query)}
              disabled={loading}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-700/60 transition whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
            >
              {topic.label}
            </button>
          ))}
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 space-y-2.5 ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white rounded-br-none shadow-xs"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {msg.sender === "user" ? (user ? getPersonName() : "You") : "Wiki AI Assistant"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="hover:text-white transition cursor-pointer"
                      title="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body with clean formatting */}
                <div className="font-sans text-xs">
                  {msg.sender === "user" ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    renderFormattedAiText(msg.text)
                  )}
                </div>

                {/* Cited Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      Cited Sources ({msg.sources.length})
                    </span>
                    <div className="space-y-1">
                      {msg.sources.map((src) => (
                        <Link
                          key={src.id}
                          to={`/articles/${src.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 hover:border-indigo-500/50 transition group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Folder className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="truncate font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                              {src.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/80">
                              {Math.round(src.relevance_score * 100)}% match
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Follow-up Questions */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-400" />
                      Suggested Follow-ups
                    </span>
                    <div className="flex flex-col gap-1">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendQuery(q)}
                          className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/40 hover:border-slate-600 transition flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate">{q}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-brand-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-medium">Synthesizing answer from docs...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer Bar */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-xl p-1.5 focus-within:border-indigo-500 transition"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about our company wiki..."
              disabled={loading}
              className="flex-1 bg-transparent px-2.5 py-1 text-xs text-white placeholder-slate-400 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition cursor-pointer"
              title="Send Question"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskWikiAiDrawer;
