import { useState } from "react";
import {
  LayoutDashboard, Search, Upload, Music, Clock, Settings, LogOut,
  Scale, ChevronLeft, ChevronRight, Bell, Zap,
} from "lucide-react";
import DashboardPage from "@/pages/DashboardPage";
import SearchPage from "@/pages/SearchPage";
import UploadPage from "@/pages/UploadPage";
import AudioPage from "@/pages/AudioPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Search Cases", icon: Search },
  { id: "upload", label: "Upload & Summarize", icon: Upload },
  { id: "audio", label: "Audio & Notes", icon: Music },
  { id: "history", label: "History", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type PageId = typeof NAV[number]["id"];

interface AppLayoutProps {
  onLogout: () => void;
}

const AppLayout = ({ onLogout }: AppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState<PageId>("dashboard");

  const titles: Record<PageId, string> = {
    dashboard: "Dashboard", search: "Search Cases", upload: "Upload & Summarize",
    audio: "Audio & Notes", history: "History", settings: "Settings",
  };

  const handleNavigate = (targetPage: string) => {
    setPage(targetPage as PageId);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage onNavigate={handleNavigate} />;
      case "search": return <SearchPage onNavigate={handleNavigate} />;
      case "upload": return <UploadPage onNavigate={handleNavigate} />;
      case "audio": return <AudioPage />;
      case "history": return <HistoryPage />;
      case "settings": return <SettingsPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`relative z-20 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? "w-[68px] min-w-[68px]" : "w-60 min-w-[240px]"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-[18px] py-5 border-b border-sidebar-border min-h-[64px]">
          <div className="w-8 h-8 min-w-[32px] bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <Scale size={16} className="text-primary-foreground" />
          </div>
          <div className={`transition-all duration-200 overflow-hidden ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
            <div className="text-[13px] font-semibold tracking-tight whitespace-nowrap">Judify</div>
            <div className="text-[10px] text-muted-foreground tracking-widest uppercase">AI</div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-2.5 overflow-y-auto">
          <div className={`px-5 py-3 text-[9px] font-semibold tracking-[0.12em] uppercase text-dim transition-opacity ${collapsed ? "opacity-0" : ""}`}>
            Navigation
          </div>
          {NAV.map((n) => {
            const active = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className={`w-full flex items-center gap-3 px-[18px] py-2.5 text-[13.5px] font-[450] whitespace-nowrap border-l-2 transition-all duration-200 ${active
                  ? "text-primary bg-gold-glow border-l-primary"
                  : "text-sidebar-foreground hover:text-foreground hover:bg-muted/30 border-l-transparent"
                  }`}
              >
                <n.icon size={17} className="min-w-[18px]" />
                <span className={`transition-all duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}>
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-sidebar-border py-3">
          <div className="flex items-center gap-2.5 px-[18px] py-2.5 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="w-[30px] h-[30px] min-w-[30px] bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center text-[11px] font-semibold text-primary-foreground">
              AC
            </div>
            <div className={`transition-all duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}>
              <div className="text-xs font-medium text-foreground">Alexandra Chen</div>
              <div className="text-[10px] text-dim">Senior Associate</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-[18px] py-2.5 text-[13.5px] text-sidebar-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-l-transparent transition-all"
          >
            <LogOut size={17} className="min-w-[18px]" />
            <span className={`transition-all duration-200 ${collapsed ? "opacity-0 w-0 overflow-hidden" : ""}`}>Logout</span>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all z-30"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 min-h-[64px] bg-surface border-b border-border flex items-center justify-between px-7">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Scale size={14} />
            <span>/</span>
            <span className="text-foreground font-medium">{titles[page]}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gold-dim border border-primary/20 text-[10px] font-semibold text-primary">
              <Zap size={10} /> AI Active
            </span>
            <button className="w-[34px] h-[34px] border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-gold-glow transition-all">
              <Bell size={15} />
            </button>
            <button className="w-[34px] h-[34px] border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-gold-glow transition-all">
              <Search size={15} />
            </button>
            <div className="w-[34px] h-[34px] bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center text-[12px] font-semibold text-primary-foreground cursor-pointer">
              AC
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
