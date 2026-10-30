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
  User,
  ExternalLink,
} from "lucide-react";
import type { AskWikiAiResponse, AiSource } from "../types/ai";
import { aiService } from "../services/aiService";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  sources?: AiSource[];
  suggestedQuestions?: string[];
  timestamp: string;
}

export const AskWikiAiDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Hello! I am your **Company Wiki AI Assistant**. Ask me anything about standard operating procedures, architecture guidelines, or team documentation.",
      suggestedQuestions: [
        "What are our standard deployment procedures?",
        "How do I submit an article for review?",
        "Where can I find our engineering style guide?",
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for global custom event: open-ask-wiki-ai
  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ query?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.query) {
        setQuery(customEvent.detail.query);
        handleSendQuery(customEvent.detail.query);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    };

    window.addEventListener("open-ask-wiki-ai", handleOpenEvent);
    return () => window.removeEventListener("open-ask-wiki-ai", handleOpenEvent);
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || query).trim();
    if (!textToSend || loading) return;

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
      const res: AskWikiAiResponse = await aiService.askWikiAi({ query: textToSend });
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

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
              </div>
              <p className="text-[11px] text-slate-400">
                Direct answers synthesized from internal documentation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
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
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2.5 ${
                  msg.sender === "user"
                    ? "bg-brand-600 text-white rounded-br-none shadow-xs"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-bl-none shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {msg.sender === "user" ? "You" : "Wiki AI Assistant"}
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

                {/* Message Text with simple formatting */}
                <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                  {msg.text}
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
                  <User className="w-4 h-4" />
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
