import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import AppLayout from "./components/AppLayout";

const App = () => {
  const [screen, setScreen] = useState<"landing" | "login" | "signup" | "app">("landing");

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {screen === "landing" && (
        <LandingPage onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />
      )}
      {(screen === "login" || screen === "signup") && (
        <AuthPage
          mode={screen}
          onAuth={() => setScreen("app")}
          onToggle={() => setScreen(screen === "login" ? "signup" : "login")}
          onBack={() => setScreen("landing")}
        />
      )}
      {screen === "app" && <AppLayout onLogout={() => setScreen("landing")} />}
    </TooltipProvider>
  );
};

export default App;
