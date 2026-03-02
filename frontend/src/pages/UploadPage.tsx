import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Check, Music, Download, Clock, Zap, AlertCircle } from "lucide-react";
import { uploadService } from "@/services/upload";
import { summaryService, SummaryData } from "@/services/summary";
import { toast } from "sonner";

interface UploadPageProps {
  onNavigate: (page: string) => void;
}

const UploadPage = ({ onNavigate }: UploadPageProps) => {
  const [stage, setStage] = useState(0); // 0=idle, 1=processing, 2=done, 3=error
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string, size: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = ["Uploading", "Extracting Text", "Generating AI Summary", "Finalizing"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    setFileInfo({ name: file.name, size: file.size });
    executeProcess(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    setFileInfo({ name: file.name, size: file.size });
    executeProcess(file);
  };

  const executeProcess = async (file: File) => {
    setStage(1);
    setStep(0);
    setProgress(5);
    setSummary(null);

    try {
      // Step 0: Upload & Extract
      const uploadRes = await uploadService.uploadFile(file);
      setProgress(40);
      setStep(1);

      if (!uploadRes.text || uploadRes.text.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF");
      }

      // Step 2: Summarize
      setStep(2);
      setProgress(60);
      const summaryRes = await summaryService.generate(uploadRes.text, String(uploadRes.caseId));

      setProgress(90);
      setStep(3);

      setSummary(summaryRes.summary);

      const summaryContent = [
        summaryRes.summary.background,
        summaryRes.summary.legalIssues,
        summaryRes.summary.arguments,
        summaryRes.summary.courtReasoning,
        summaryRes.summary.judgmentOutcome
      ].filter(Boolean).join("\n\n");

      // Save to local storage for Audio page
      const updatedCase = {
        title: file.name.replace(".pdf", ""),
        caseId: uploadRes.caseId,
        preview: uploadRes.text.substring(0, 300) + "...",
        summaryId: summaryRes.summaryId,
        summaryText: summaryContent,
        summaryFullText: summaryRes.summary.fullText || uploadRes.text,
        extractedText: uploadRes.text
      };
      localStorage.setItem("selected_case", JSON.stringify(updatedCase));

      setProgress(100);
      setStage(2);
      toast.success("Document analyzed successfully!");

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process document");
      setStage(3);
    }
  };

  return (
    <div className="p-7 animate-fade-in">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-tight">Upload & Summarize</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Upload any legal document for AI-powered extraction and summarization</p>
      </div>

      {/* Upload zone */}
      {(stage === 0 || stage === 3) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl py-14 px-8 text-center cursor-pointer transition-all hover:bg-gold-glow group ${stage === 3 ? "border-destructive/50 bg-destructive/5" : "border-border hover:border-primary"
            }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
          <div className={`w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto mb-4 ${stage === 3 ? "bg-destructive/10 text-destructive" : "bg-gold-dim text-primary"
            }`}>
            {stage === 3 ? <AlertCircle size={24} /> : <Upload size={24} />}
          </div>
          <div className="text-[15px] font-semibold mb-2">
            {stage === 3 ? "Process failed. Try another file." : "Drop your PDF here"}
          </div>
          <div className="text-[13px] text-muted-foreground mb-5">or click to browse — supports PDF up to 50MB</div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium flex items-center gap-1.5 mx-auto hover:gold-glow transition-all">
            <Upload size={13} /> Choose File
          </button>
        </motion.div>
      )}

      {/* Processing */}
      {stage >= 1 && stage !== 3 && fileInfo && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gold-dim rounded-lg flex items-center justify-center text-primary">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold truncate max-w-[400px]">{fileInfo.name}</div>
              <div className="text-[11px] text-muted-foreground">{(fileInfo.size / (1024 * 1024)).toFixed(2)} MB • PDF Document</div>
            </div>
            {stage === 2 && (
              <span className="px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-[10px] font-semibold text-success flex items-center gap-1">
                <Check size={12} /> Processed
              </span>
            )}
          </div>

          {stage === 1 && (
            <>
              {/* Progress steps */}
              <div className="flex mb-6">
                {steps.map((s, i) => (
                  <div key={s} className="flex-1 flex flex-col items-center relative">
                    {i < steps.length - 1 && (
                      <div className="absolute top-3.5 left-1/2 w-full h-px bg-border" />
                    )}
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold z-10 transition-all duration-300 ${i < step ? "bg-primary border-primary text-primary-foreground" :
                        i === step ? "border-[1.5px] border-primary text-primary shadow-[0_0_12px_hsl(var(--gold)/0.3)] bg-card animate-pulse" :
                          "border-[1.5px] border-border text-dim bg-card"
                      }`}>
                      {i < step ? <Check size={11} /> : i === step ? <Zap size={10} /> : i + 1}
                    </div>
                    <div className={`text-[11px] mt-2 text-center ${i <= step ? "text-muted-foreground" : "text-dim"}`}>{s}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-border rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[11px] text-dim mt-2 text-right font-mono">{progress}%</div>
            </>
          )}
        </div>
      )}

      {/* Summary output */}
      {stage === 2 && summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-2 mb-6">
            <button onClick={() => onNavigate('audio')} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-[13px] font-medium flex items-center gap-2 hover:gold-glow transition-all">
              <Music size={14} /> Generate Audio
            </button>
            <button className="px-4 py-2 border border-border rounded-md text-[13px] text-muted-foreground flex items-center gap-2 hover:border-primary hover:text-primary hover:bg-gold-glow transition-all cursor-not-allowed opacity-50">
              <Download size={14} /> Download PDF
            </button>
          </div>

          {[
            { title: "Background", content: summary.background },
            { title: "Legal Issues", content: summary.legalIssues },
            { title: "Arguments", content: summary.arguments },
            { title: "Court Reasoning", content: summary.courtReasoning },
            { title: "Judgment Outcome", content: summary.judgmentOutcome }
          ].filter(s => !!s.content).map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-5 mb-3"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-primary mb-3">
                {s.title}
                <div className="flex-1 h-px bg-primary/15" />
              </div>
              <p className="text-[13px] text-muted-foreground leading-[1.75]">{s.content}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default UploadPage;
