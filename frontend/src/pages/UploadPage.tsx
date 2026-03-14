import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, Sparkles, Search, BarChart3, FileSignature, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadRFP } from "@/lib/api";
import { toast } from "sonner";

const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
const MAX_SIZE = 50 * 1024 * 1024;

const FEATURES = [
  { icon: <Search className="h-4 w-4" />, label: "Requirements Analysis" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Market Research" },
  { icon: <FileSignature className="h-4 w-4" />, label: "SOW Generation" },
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
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background grid dots */}
      <div className="pointer-events-none absolute inset-0 hero-gradient" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl text-center"
      >
        {/* Floating badge */}
        <motion.div
          className="animate-float mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-500"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Analysis
        </motion.div>

        {/* Hero heading */}
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Transform RFPs into
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            Product Strategy
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
          Upload an enterprise RFP and let our AI agents extract requirements, plan features,
          generate personas, and draft your Statement of Work — in minutes.
        </p>

        {/* Feature highlights */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground shadow-sm"
            >
              <span className="text-primary">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <motion.div
          className={`mt-10 relative rounded-2xl border-2 border-dashed p-12 transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : file
              ? "border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/10"
              : "border-border bg-card/50 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          whileHover={{ scale: 1.005 }}
          transition={{ duration: 0.15 }}
        >
          {/* Gradient border glow on drag */}
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/40 ring-offset-0" />
          )}

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5"
              >
                <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 p-5 ring-1 ring-blue-500/20">
                  <Upload className="h-9 w-9 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Drag & drop your RFP document
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    or{" "}
                    <label className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline">
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
                <p className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                  PDF · DOCX · DOC · TXT · Max 50 MB
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
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-3 ring-1 ring-green-500/30">
                    <FileText className="h-7 w-7 text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to process
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit button */}
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
              className="relative min-w-[220px] overflow-hidden bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-95 transition-all"
            >
              {!uploading && (
                <span className="pointer-events-none absolute inset-0 shimmer" />
              )}
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Process RFP
                </>
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
