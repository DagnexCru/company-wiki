import { useState, type ReactNode } from "react";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { CommandPalette } from "../components/CommandPalette";
import { AskWikiAiDrawer } from "../components/AskWikiAiDrawer";
import { AskWikiFloatingButton } from "../components/AskWikiFloatingButton";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Component */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Interactive Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette />

      {/* AI-Powered Ask Wiki Assistant Drawer & Floating Quick-Action */}
      <AskWikiAiDrawer />
      <AskWikiFloatingButton />
    </div>
  );
};

