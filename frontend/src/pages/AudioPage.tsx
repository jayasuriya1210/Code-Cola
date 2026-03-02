import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Download, Plus, Trash2, Zap } from "lucide-react";
import { ttsService, TtsGenerateResponse } from "@/services/tts";
import { summaryService, SummaryData } from "@/services/summary";
import { toast } from "sonner";

const WaveformViz = ({ playing }: { playing: boolean }) => {
  const heights = [20, 35, 55, 42, 68, 52, 80, 65, 48, 72, 58, 40, 62, 45, 30, 55, 70, 48, 62, 38, 75, 52, 44, 68, 55, 40, 72, 58, 35, 60, 50, 42, 65, 48, 30, 58, 44, 70, 52, 36];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setTick((x) => x + 1), 80);
    return () => clearInterval(t);
  }, [playing]);

  const progress = (tick % (heights.length * 3)) / (heights.length * 3);
  const filled = Math.floor(progress * heights.length);

  return (
    <div className="flex items-center gap-0.5 h-12 my-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`rounded-sm flex-1 transition-all duration-300 ${i <= filled ? "bg-primary" : "bg-border"}`}
          style={{ height: `${h}%`, opacity: playing && i === filled ? 1 : i <= filled ? 0.85 : 0.3 }}
        />
      ))}
    </div>
  );
};

const AudioPage = () => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [progVal, setProgVal] = useState(0);
  const [ttsResponse, setTtsResponse] = useState<TtsGenerateResponse | null>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const buildSummaryOnlyNarration = (summary: Partial<SummaryData> | null | undefined): string => {
    if (!summary) return "";
    const sections = [
      ["Background", summary.background],
      ["Legal Issues", summary.legalIssues],
      ["Arguments", summary.arguments],
      ["Court Reasoning", summary.courtReasoning],
      ["Judgment Outcome", summary.judgmentOutcome],
    ] as const;

    return sections
      .map(([label, content]) => {
        const clean = String(content || "").trim();
        return clean ? `${label}: ${clean}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  };

  useEffect(() => {
    const saved = localStorage.getItem("selected_case");
    if (saved) {
      try {
        setSelectedCase(JSON.parse(saved));
      } catch (e) { }
    }
  }, []);

  const handleGenerateTTS = async () => {
    if (!selectedCase) return toast.error("No case selected");

    setLoading(true);
    setTtsResponse(null);
    setAudioUrl(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      let textToSynthesize = String(selectedCase.summaryText || "").trim();

      // Enforce summary-only TTS. If missing locally, pull latest summary and compose section text.
      if (!textToSynthesize && selectedCase.caseId) {
        try {
          const latest = await summaryService.getLatest(String(selectedCase.caseId));
          textToSynthesize = buildSummaryOnlyNarration(latest?.summary);

          if (textToSynthesize) {
            const updatedCase = { ...selectedCase, summaryText: textToSynthesize };
            setSelectedCase(updatedCase);
            localStorage.setItem("selected_case", JSON.stringify(updatedCase));
          }
        } catch (_error) {
          // If summary fetch fails, we'll show a clear action message below.
        }
      }

      if (!textToSynthesize) {
        return toast.error("Summary not found. Generate summary first, then synthesize audio.");
      }

      const res = await ttsService.generate(
        textToSynthesize,
        "en",
        selectedCase.caseId ? String(selectedCase.caseId) : undefined,
        selectedCase.summaryId,
        selectedCase.title,
        selectedCase.link,
        selectedCase.pdf
      );
      setTtsResponse(res);

      if (res.caseId && res.caseId !== selectedCase.caseId) {
        const updatedCase = { ...selectedCase, caseId: res.caseId };
        setSelectedCase(updatedCase);
        localStorage.setItem("selected_case", JSON.stringify(updatedCase));
      }

      // If the backend returns a proxyable URL or direct path:
      const absoluteAudioUrl = res.audioURL.startsWith("http") ? res.audioURL : `http://localhost:5000${res.audioURL}`;
      setAudioUrl(absoluteAudioUrl);
      toast.success("Audio synthesized successfully. Ready to play.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate audio");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgVal(p || 0);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgVal(0);
  };

  const fmtTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const t = Math.round(secs);
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  };

  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="p-7 animate-fade-in">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-tight">Audio Case Brief</h1>
        <p className="text-[13px] text-muted-foreground mt-1">AI-narrated legal summary powered by Deep TTS Models</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          {/* Audio Player */}
          {selectedCase && !audioUrl && !loading && (
            <div className="bg-card border border-border rounded-2xl p-7 mb-4 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-semibold mb-2">{selectedCase.title}</h3>
              <p className="text-xs text-muted-foreground mb-6">You have selected this case. Click below to generate its narrated brief.</p>
              <button onClick={handleGenerateTTS} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center gap-2 hover:gold-glow transition-all active:scale-95">
                <Zap size={16} /> Synthesize Audio Now
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-card border border-border rounded-2xl p-7 mb-4 flex flex-col items-center justify-center text-center min-h-[250px]">
              <Zap size={24} className="animate-pulse text-primary mb-3" />
              <h3 className="text-sm font-semibold mb-2">Synthesizing audio models via API...</h3>
            </div>
          )}

          {audioUrl && (
            <div className="bg-card border border-border flex flex-col justify-between rounded-2xl p-7 mb-4">
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                className="hidden"
              />

              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-[15px] font-semibold">{selectedCase?.title || "Audio Generated"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">tts_provider: {ttsResponse?.ttsProvider}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gold-dim border border-primary/20 text-[10px] font-semibold text-primary">AI Narrated</span>
              </div>

              <WaveformViz playing={playing} />

              <div
                className="w-full h-[3px] bg-border rounded cursor-pointer my-3 overflow-hidden"
                onClick={(e) => {
                  if (!audioRef.current) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const targetTime = ((e.clientX - r.left) / r.width) * audioRef.current.duration;
                  audioRef.current.currentTime = targetTime;
                }}
              >
                <div className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300" style={{ width: `${progVal}%` }} />
              </div>

              <div className="flex justify-between text-[11px] text-dim font-mono">
                <span>{fmtTime(audioRef.current?.currentTime || 0)}</span>
                <span>{fmtTime(audioRef.current?.duration || 0)}</span>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 bg-primary rounded-full flex items-center justify-center text-primary-foreground transition-all hover:scale-105 shadow-[0_0_16px_hsl(var(--gold)/0.25)] hover:shadow-[0_0_24px_hsl(var(--gold)/0.4)]"
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 border rounded-md text-xs font-semibold font-mono transition-all ${speed === s
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                      }`}
                  >
                    {s}×
                  </button>
                ))}
                <a href={audioUrl} download target="_blank" className="ml-auto px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground flex items-center gap-1.5 hover:border-primary hover:text-primary hover:bg-gold-glow transition-all">
                  <Download size={13} /> MP3
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Notes panel */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-[13px] font-semibold mb-4">Case Notes</div>
          <textarea
            className="w-full min-h-[100px] bg-surface border border-border rounded-md px-3.5 py-3 text-[13px] text-foreground resize-y outline-none transition-colors focus:border-primary placeholder:text-dim mb-3"
            placeholder="Add your notes, annotations, and key observations here..."
          />
          <button className="w-full py-2 border border-border rounded-md text-xs text-muted-foreground flex items-center justify-center gap-1.5 hover:border-primary hover:text-primary hover:bg-gold-glow transition-all">
            <Plus size={13} /> Save Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPage;

