import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutGrid, List, Eye, Download, Trash2, Music } from "lucide-react";

const HISTORY = [
  { id: 1, title: "Vinod Textiles v. HDFC Bank", date: "Feb 24, 2026", type: "PDF Summary", duration: "4m 32s", size: "2.1 MB" },
  { id: 2, title: "Tata Sons v. Cyrus Investments", date: "Feb 22, 2026", type: "Case Search", duration: "6m 15s", size: "1.8 MB" },
  { id: 3, title: "Securities Exchange Commission Guidelines 2023", date: "Feb 20, 2026", type: "PDF Summary", duration: "9m 08s", size: "4.2 MB" },
  { id: 4, title: "Pioneer Urban Land v. Union of India", date: "Feb 18, 2026", type: "Case Search", duration: "3m 44s", size: "1.3 MB" },
  { id: 5, title: "NCLAT Procedure Rules Analysis", date: "Feb 15, 2026", type: "PDF Summary", duration: "11m 52s", size: "5.6 MB" },
];

const HistoryPage = () => {
  const [view, setView] = useState<"table" | "grid">("table");
  const [deleteModal, setDeleteModal] = useState<typeof HISTORY[number] | null>(null);

  return (
    <div className="p-7 animate-fade-in">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">History</h1>
          <p className="text-[13px] text-muted-foreground mt-1">All your processed cases, summaries, and audio briefings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-[220px] h-[34px] pl-9 pr-3 bg-surface border border-border rounded-md text-xs text-foreground outline-none focus:border-primary placeholder:text-dim" placeholder="Search history..." />
          </div>
          <button onClick={() => setView("grid")}
            className={`w-[34px] h-[34px] border rounded-md flex items-center justify-center transition-all ${view === "grid" ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setView("table")}
            className={`w-[34px] h-[34px] border rounded-md flex items-center justify-center transition-all ${view === "table" ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
            <List size={14} />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Case Title", "Type", "Date", "Audio", "Size", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-wider uppercase text-dim border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="group hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5 text-[13px] font-medium">{h.title}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      h.type === "PDF Summary" ? "bg-gold-dim border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
                    }`}>{h.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-muted-foreground font-mono">{h.date}</td>
                  <td className="px-4 py-3.5 text-[11px] text-muted-foreground font-mono">{h.duration}</td>
                  <td className="px-4 py-3.5 text-[11px] text-muted-foreground font-mono">{h.size}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-gold-glow transition-all"><Eye size={13} /></button>
                      <button className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-gold-glow transition-all"><Download size={13} /></button>
                      <button onClick={() => setDeleteModal(h)} className="w-7 h-7 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-destructive hover:text-destructive transition-all"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HISTORY.map((h) => (
            <motion.div key={h.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-lg p-5 transition-all hover:border-primary/30 hover:-translate-y-0.5 hover:card-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  h.type === "PDF Summary" ? "bg-gold-dim border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
                }`}>{h.type}</span>
                <span className="text-[11px] font-mono text-dim">{h.date}</span>
              </div>
              <div className="text-[13px] font-semibold leading-snug mb-2">{h.title}</div>
              <div className="flex gap-3 mb-4">
                <span className="text-[11px] text-dim flex items-center gap-1"><Music size={11} />{h.duration}</span>
                <span className="text-[11px] text-dim">{h.size}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-1.5 border border-border rounded-md text-xs text-muted-foreground flex items-center justify-center gap-1 hover:border-primary hover:text-primary hover:bg-gold-glow transition-all"><Eye size={12} /> View</button>
                <button className="w-8 h-8 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-gold-glow transition-all"><Download size={13} /></button>
                <button onClick={() => setDeleteModal(h)} className="w-8 h-8 border border-border rounded-md flex items-center justify-center text-muted-foreground hover:border-destructive hover:text-destructive transition-all"><Trash2 size={13} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-7 min-w-[360px] max-w-[420px] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            >
              <h3 className="text-base font-semibold mb-2.5">Delete Case?</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
                Are you sure you want to delete <strong className="text-foreground">{deleteModal.title}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 border border-border rounded-md text-[13px] text-muted-foreground text-center hover:border-muted-foreground hover:text-foreground transition-all">Cancel</button>
                <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 bg-destructive/15 border border-destructive/25 text-destructive rounded-md text-[13px] font-medium flex items-center justify-center gap-1.5 hover:bg-destructive/25 transition-all">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;
