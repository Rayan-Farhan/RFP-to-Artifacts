import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, Zap, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadRFP } from "@/lib/api";
import { toast } from "sonner";

const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
const MAX_SIZE = 50 * 1024 * 1024;

const FEATURES = [
  { icon: Zap, title: "AI-Powered Extraction", description: "Multi-agent pipeline processes your RFP in parallel" },
  { icon: BarChart3, title: "Complete Artifacts", description: "Requirements, features, personas, roadmap & SOW" },
  { icon: Shield, title: "Quality Governance", description: "Automated validation ensures thoroughness" },
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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl text-center"
      >
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Zap className="h-3 w-3" />
          AI-Powered RFP Analysis
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Transform RFPs into
          <br />
          <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent [-webkit-background-clip:text]">
            Product Strategy
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          Upload an enterprise RFP and let our AI agents extract requirements, plan features,
          generate personas, and draft your Statement of Work — in minutes.
        </p>

        <motion.div
          className={`mt-10 rounded-2xl border-2 border-dashed p-10 transition-all duration-200 sm:p-12 ${
            dragOver
              ? "border-primary bg-primary/5 shadow-lg"
              : file
              ? "border-success/50 bg-success/5 card-elevated"
              : "border-border bg-card card-elevated hover:border-muted-foreground/40 hover:shadow-md"
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
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="rounded-2xl bg-primary/10 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    Drag & drop your RFP document
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    or{" "}
                    <label className="cursor-pointer font-medium text-primary transition-colors hover:text-primary/80 hover:underline">
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
                  <div className="rounded-xl bg-primary/10 p-2.5">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{file.name}</p>
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
                  className="rounded-full hover:bg-destructive/10 hover:text-destructive"
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
              className="min-w-[200px] rounded-xl text-base shadow-md transition-shadow hover:shadow-lg"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Process RFP"
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3"
      >
        {FEATURES.map((feat) => (
          <div
            key={feat.title}
            className="group rounded-xl border bg-card p-5 text-center card-elevated transition-all duration-200 hover:border-primary/30"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
              <feat.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{feat.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feat.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
