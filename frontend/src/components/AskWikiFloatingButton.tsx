import React from "react";
import { Sparkles } from "lucide-react";

export const AskWikiFloatingButton: React.FC = () => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("open-ask-wiki-ai", { detail: {} }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        type="button"
        onClick={handleClick}
        title="Ask Wiki AI Assistant"
        className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="text-xs font-bold pr-1 hidden sm:inline-block">Ask Wiki AI</span>
      </button>
    </div>
  );
};
export default AskWikiFloatingButton;
