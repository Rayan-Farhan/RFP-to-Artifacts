import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, X, Loader2,
  ListChecks, Users, FileSignature, BarChart3, ShieldCheck, Map
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadRFP } from "@/lib/api";
import { toast } from "sonner";

const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
const MAX_SIZE = 50 * 1024 * 1024;

const FEATURES = [
  { icon: ListChecks, title: "Requirements", desc: "Extract and categorize requirements" },
  { icon: Users, title: "Personas", desc: "Generate user personas & interview questions" },
  { icon: Map, title: "Roadmap", desc: "Build a phased product roadmap" },
  { icon: FileSignature, title: "SOW", desc: "Draft a Statement of Work" },
  { icon: BarChart3, title: "Metrics", desc: "Define success metrics & KPIs" },
  { icon: ShieldCheck, title: "Governance", desc: "Quality checks & compliance scoring" },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = useCallback((f: File) => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast.error("Unsupported file type. Please upload PDF, DOCX, DOC, or TXT.");
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 50MB.");
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onSubmit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadRFP(file);
      toast.success("RFP uploaded successfully");
      navigate(`/job/${res.job_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.4] dark:opacity-[0.07]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl text-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          AI-Powered Multi-Agent Pipeline
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="text-foreground">Transform RFPs into</span>
          <br />
          <span className="text-gradient">Product Strategy</span>
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          Upload an enterprise RFP and let our AI agents extract requirements, plan features,
          generate personas, and draft your Statement of Work — in minutes.
        </p>

        <motion.div
          className={`mt-10 rounded-xl border-2 border-dashed p-12 transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
              : file
              ? "border-success/50 bg-success/5"
              : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.15 }}
        >
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="rounded-full bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    Drag & drop your RFP document
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    or{" "}
                    <label className="cursor-pointer font-medium text-primary hover:underline">
                      browse files
                      <input
                        type="file"
                        className="hidden"
                        accept={ACCEPTED.join(",")}
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      />
                    </label>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, DOC, TXT • Max 50MB
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {file && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button
              size="lg"
              onClick={onSubmit}
              disabled={uploading}
              className="min-w-[200px] shadow-lg shadow-primary/20"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Process RFP"
              )}
            </Button>
          </motion.div>
        )}

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="group rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <f.icon className="mb-2 h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
