import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, ArrowRight, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth";
import { toast } from "sonner";

interface AuthPageProps {
  mode: "login" | "signup";
  onAuth: () => void;
  onToggle: () => void;
  onBack: () => void;
}

const AuthPage = ({ mode, onAuth, onToggle, onBack }: AuthPageProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await authService.login(email, password);
        toast.success("Successfully logged in.");
      } else {
        await authService.register(name, email, password);
        // After registering, usually you need to login, but authService might return the token.
        // Assuming we need to login right after:
        await authService.login(email, password);
        toast.success("Account created successfully!");
      }
      onAuth();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${mode}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse,hsl(var(--gold)/0.05)_0%,transparent_60%)] pointer-events-none animate-glow-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-[420px] relative z-10 bg-surface/90 backdrop-blur-xl border border-border rounded-2xl p-9 auth-shadow"
      >
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <Scale size={16} className="text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">
            Judify <span className="text-primary">AI</span>
          </span>
        </div>

        <h2 className="text-xl font-semibold mb-1.5">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-[13px] text-muted-foreground mb-6">
          {mode === "login"
            ? "Sign in to your legal intelligence workspace"
            : "Join 2,400+ legal professionals using Judify AI"}
        </p>

        {mode === "signup" && (
          <div className="mb-4">
            <label className="block text-[11.5px] font-medium tracking-wide text-muted-foreground mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface border border-border rounded-md px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--gold)/0.08)] placeholder:text-dim"
              placeholder="Alexandra Chen"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-[11.5px] font-medium tracking-wide text-muted-foreground mb-1.5">Email Address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--gold)/0.08)] placeholder:text-dim"
            type="email"
            placeholder="you@lawfirm.com"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[11.5px] font-medium tracking-wide text-muted-foreground mb-1.5">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3.5 py-2.5 text-[13px] text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--gold)/0.08)] placeholder:text-dim"
            type="password"
            placeholder="••••••••••"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-1 py-2.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium flex items-center justify-center gap-2 transition-all hover:gold-glow disabled:opacity-75"
        >
          {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          {!loading && <ArrowRight size={14} />}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-dim">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button className="w-full py-2.5 bg-card border border-border rounded-md flex items-center justify-center gap-2.5 text-muted-foreground text-[13px] transition-all hover:border-muted-foreground/30 hover:text-foreground">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-5 text-[12.5px] text-muted-foreground">
          {mode === "login" ? (
            <>Don't have an account?{" "}<button onClick={onToggle} className="text-primary font-medium hover:underline">Sign up free</button></>
          ) : (
            <>Already have an account?{" "}<button onClick={onToggle} className="text-primary font-medium hover:underline">Sign in</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
