import { motion } from "framer-motion";
import { Scale, Zap, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

const LandingPage = ({ onLogin, onSignup }: LandingPageProps) => {
  const stats = [
    ["2M+", "Searchable Judgments"],
    ["99.2%", "Extraction Accuracy"],
    ["< 30s", "Processing Time"],
    ["256-bit", "Encryption"],
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-auto flex flex-col">
      {/* Glow effects */}
      <div className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--gold)/0.06)_0%,transparent_70%)] pointer-events-none animate-glow-pulse" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.04)_0%,transparent_70%)] pointer-events-none animate-glow-pulse [animation-direction:reverse] [animation-duration:8s]" />

      {/* Nav */}
      <nav className="px-8 md:px-16 py-5 flex items-center justify-between border-b border-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <Scale size={16} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Judify <span className="text-primary">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</button>
          <button onClick={onLogin} className="px-4 py-1.5 text-sm border border-border rounded-md text-muted-foreground hover:border-primary hover:text-primary transition-all">
            Log In
          </button>
          <button onClick={onSignup} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:gold-glow transition-all">
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-10 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-dim border border-primary/20 text-[11px] font-semibold tracking-wider uppercase text-primary mb-7">
            <Zap size={11} /> AI-Powered · Trusted by 2,400+ Legal Professionals
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] max-w-[700px]">
            Legal Case <span className="text-primary">Intelligence</span>,
            <br />Amplified by AI
          </h1>
          <p className="text-base text-muted-foreground max-w-[520px] leading-relaxed mt-5 mb-9">
            Search 2M+ court judgments, extract critical insights from PDFs, and generate professional audio briefings — all in one platform built for serious legal work.
          </p>
          <div className="flex gap-3 items-center">
            <button
              onClick={onSignup}
              className="px-7 py-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold transition-all hover:gold-glow-lg hover:-translate-y-0.5 flex items-center gap-2"
            >
              Start for Free <ArrowRight size={14} />
            </button>
            <button
              onClick={onLogin}
              className="px-7 py-3 border border-border text-muted-foreground rounded-md text-sm font-medium transition-all hover:border-muted-foreground hover:text-foreground"
            >
              View Demo
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-10 mt-12 pt-10 border-t border-border"
        >
          {stats.map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold text-primary font-mono">{val}</div>
              <div className="text-[11px] text-dim mt-1 uppercase tracking-wider">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
