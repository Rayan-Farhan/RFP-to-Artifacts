import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Loader2, Sparkles, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadRFP } from "@/lib/api";
import { toast } from "sonner";

const ACCEPTED = [".pdf", ".docx", ".doc", ".txt"];
const MAX_SIZE = 50 * 1024 * 1024;

const FEATURES = [
  {
    icon: Zap,
    title: "10 AI Agents",
    desc: "Specialized agents process your RFP in parallel for speed and accuracy",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: BarChart3,
    title: "9 Artifacts",
    desc: "Requirements, features, roadmap, personas, SOW and more",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Governance Built-in",
    desc: "Quality validation and compliance checks on every output",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
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
    <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center overflow-hidden px-4 py-16">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-60 right-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-60 left-0 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3 w-3" />
            Powered by Azure OpenAI &amp; Semantic Kernel
          </motion.span>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
            Turn RFPs into
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
              Product Strategy
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
            Our multi-agent AI pipeline extracts requirements, plans features, generates personas,
            and drafts your Statement of Work — in minutes.
          </p>
        </div>

        {/* Upload zone */}
        <motion.div
          className={`mt-10 cursor-default rounded-2xl border-2 border-dashed p-10 transition-all duration-200 ${
            dragOver
              ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
              : file
              ? "border-emerald-500/60 bg-emerald-500/5"
              : "border-border bg-card/60 hover:border-primary/30 hover:bg-card/80"
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
                className="flex flex-col items-center gap-4 text-center"
              >
                <div
                  className={`rounded-2xl p-5 transition-colors ${
                    dragOver ? "bg-primary/15" : "bg-muted"
                  }`}
                >
                  <Upload
                    className={`h-9 w-9 transition-colors ${
                      dragOver ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    Drag &amp; drop your RFP document
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  PDF · DOCX · DOC · TXT &nbsp;|&nbsp; Max 50 MB
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-emerald-500/15 p-3">
                    <FileText className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to process
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit button */}
        <AnimatePresence>
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 flex justify-center"
            >
              <Button
                size="lg"
                onClick={onSubmit}
                disabled={uploading}
                className="min-w-[200px] gap-2 bg-gradient-to-r from-primary to-violet-600 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:opacity-95"
              >
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
        </AnimatePresence>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-14 grid gap-3 sm:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
              <div className={`mb-3 inline-flex rounded-lg p-2 ${feature.bg}`}>
                <feature.icon className={`h-4 w-4 ${feature.color}`} />
              </div>
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
