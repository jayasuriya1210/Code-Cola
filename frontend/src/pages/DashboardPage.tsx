import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Upload, Music, FileText, Zap, ArrowRight, Brain } from "lucide-react";
import { summaryService, SummaryData } from "@/services/summary";
import { toast } from "sonner";

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

const DashboardPage = ({ onNavigate }: DashboardPageProps) => {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selected_case");
    if (saved) {
      try {
        setSelectedCase(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const handleSummarize = async () => {
    if (!selectedCase) return;
    setLoading(true);
    setSummary(null);
    try {
      const text =
        selectedCase.extractedText ||
        selectedCase.summaryFullText ||
        selectedCase.fullText ||
        selectedCase.preview ||
        selectedCase.title ||
        "No content provided";
      const res = await summaryService.generate(text, String(selectedCase.caseId || Date.now()));
      setSummary(res.summary);
      toast.success("Summary generated successfully!");

      const summaryContent = [
        res.summary.background,
        res.summary.legalIssues,
        res.summary.arguments,
        res.summary.courtReasoning,
        res.summary.judgmentOutcome
      ].filter(Boolean).join("\n\n");

      // Save summary inside selected_case for Audio page to pick up
      const updatedCase = {
        ...selectedCase,
        summaryId: res.summaryId,
        summaryText: summaryContent,
        summaryFullText: res.summary.fullText || text,
      };
      localStorage.setItem("selected_case", JSON.stringify(updatedCase));
    } catch (err: any) {
      toast.error(err.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { icon: Search, title: "Search Legal Cases", desc: "AI-powered case discovery across Indian courts with citation analysis and relevance scoring.", nav: "search" },
    { icon: Upload, title: "Upload & Summarize PDF", desc: "Extract key legal arguments, judgments, and critical paragraphs from any case document.", nav: "upload" },
    { icon: Music, title: "Audio Case Briefings", desc: "Generate professional audio summaries with timestamp markers for hands-free review.", nav: "audio" },
  ];

  return (
    <div className="p-7 animate-fade-in">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">AI Summary Dashboard <span className="text-primary">✦</span></h1>
          <p className="text-[13px] text-muted-foreground mt-1">Manage and summarize your selected legal cases</p>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gold-dim border border-primary/20 text-[10px] font-semibold text-primary">
          Active Workspace
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {actions.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            onClick={() => onNavigate(c.nav)}
            className="relative p-6 bg-card border border-border rounded-lg cursor-pointer transition-all duration-250 overflow-hidden group hover:border-primary/30 hover:-translate-y-0.5 shadow-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-11 h-11 bg-gold-dim rounded-[10px] flex items-center justify-center text-primary mb-3.5">
              <c.icon size={20} />
            </div>
            <div className="text-sm font-semibold mb-1.5">{c.title}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{c.desc}</div>
            <div className="absolute top-6 right-6 text-dim group-hover:text-primary group-hover:translate-x-1 transition-all">
              <ArrowRight size={16} />
            </div>
          </motion.div>
        ))}
      </div>

      {selectedCase ? (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-semibold ">{selectedCase.title}</h2>
            {selectedCase.court && <span className="text-xs bg-muted px-2 py-1 rounded">{selectedCase.court}</span>}
          </div>
          <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{selectedCase.preview}</p>

          {!summary && !loading && (
            <button onClick={handleSummarize} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-2 hover:gold-glow transition-all active:scale-95">
              <Brain size={16} /> Generate AI Summary
            </button>
          )}

          {loading && (
            <div className="flex flex-col gap-3 mt-4">
              <div className="text-sm text-dim flex items-center gap-2"><Zap size={14} className="animate-pulse text-primary" /> Analyzing Context & Legal Issues...</div>
              <div className="h-4 w-3/4 bg-border animate-shimmer rounded" />
              <div className="h-4 w-full bg-border animate-shimmer rounded" />
              <div className="h-4 w-5/6 bg-border animate-shimmer rounded" />
            </div>
          )}

          {summary && !loading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-5 border-t border-border pt-6">
              {[
                { label: "Background", text: summary.background },
                { label: "Legal Issues", text: summary.legalIssues },
                { label: "Arguments", text: summary.arguments },
                { label: "Court Reasoning", text: summary.courtReasoning },
                { label: "Judgment Outcome", text: summary.judgmentOutcome }
              ].map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-2">{section.label}</h3>
                  <p className="text-sm text-foreground leading-relaxed bg-surface p-4 rounded-md border border-border">{section.text || "Not available"}</p>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <button onClick={() => onNavigate('audio')} className="px-5 py-2.5 bg-card border border-border text-foreground rounded-md text-sm font-medium flex items-center gap-2 hover:border-primary hover:text-primary transition-all active:scale-95">
                  <Music size={16} /> Synthesize Audio Brief
                </button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center">
          <FileText size={32} className="text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-sm font-semibold mb-2">No active case selected</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-5">Search for a case from the Search Cases tab, or upload a PDF document to begin synthesizing summaries.</p>
          <button onClick={() => onNavigate('search')} className="px-4 py-2 border border-border bg-card rounded-md text-sm hover:border-primary hover:text-primary transition-colors">
            Go to Search
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
