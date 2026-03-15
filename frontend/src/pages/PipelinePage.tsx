import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ListChecks, Kanban, Users, FileSignature, ShieldCheck,
  Check, X, Loader2, ArrowRight, Target, TrendingUp, BarChart3, Map, Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useJobStatus } from "@/hooks/useJobStatus";
import { cancelJob } from "@/lib/api";
import { ORCHESTRATION_PIPELINE, type AgentStatus } from "@/lib/types";
import { toast } from "sonner";

const ICONS: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-5 w-5" />,
  ListChecks: <ListChecks className="h-5 w-5" />,
  Kanban: <Kanban className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  FileSignature: <FileSignature className="h-5 w-5" />,
  ShieldCheck: <ShieldCheck className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Map: <Map className="h-5 w-5" />,
};

function AgentCard({
  name,
  icon,
  description,
  status,
  message,
  duration,
}: {
  name: string;
  icon: string;
  description: string;
  status: AgentStatus;
  message?: string;
  duration?: number | null;
}) {
  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-200 ${
        status === "running"
          ? "border-primary glow-primary bg-primary/5"
          : status === "completed"
          ? "border-success/40 bg-success/5 card-elevated"
          : status === "failed"
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg p-2 transition-colors ${
            status === "running"
              ? "bg-primary/15 text-primary"
              : status === "completed"
              ? "bg-success/15 text-success"
              : status === "failed"
              ? "bg-destructive/15 text-destructive"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status === "running" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === "completed" ? (
            <Check className="h-5 w-5" />
          ) : status === "failed" ? (
            <X className="h-5 w-5" />
          ) : (
            ICONS[icon]
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
            {status === "running" ? message || description : description}
          </p>
          {status === "completed" && duration != null && (
            <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
              <span className="rounded-md bg-muted px-1.5 py-0.5">{duration.toFixed(1)}s</span>
            </div>
          )}
          {status === "failed" && message && (
            <p className="mt-1.5 text-xs text-destructive">{message}</p>
          )}
        </div>
      </div>
      {status === "running" && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-primary"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

export default function PipelinePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { logs, connected } = useWebSocket(jobId);
  const { data: job } = useJobStatus(jobId, true);
  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const allLogs = job?.agent_logs && job.agent_logs.length > logs.length ? job.agent_logs : logs;
  const status = job?.status;

  const isRunning = status !== "completed" && status !== "failed";

  const handleCancel = async () => {
    if (!jobId || cancelling) return;
    setCancelling(true);
    try {
      await cancelJob(jobId);
      toast.success("Pipeline cancelled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const getAgentStatus = (name: string): { status: AgentStatus; msg?: string; dur?: number | null; tok?: number | null } => {
    const log = allLogs.find((l) => l.agent_name === name);
    if (!log) return { status: "idle" };
    return { status: log.status, msg: log.message, dur: log.duration_seconds, tok: log.tokens_used };
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:py-10">
      {/* Job info bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5 card-elevated">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{job?.filename || "Processing…"}</p>
            <p className="text-xs text-muted-foreground">
              {jobId?.slice(0, 8)}… • {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && <StatusBadge status={status} />}
          {!connected && status !== "completed" && status !== "failed" && (
            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">Polling mode</span>
          )}
          <span className="rounded-md bg-muted px-2 py-1 text-sm tabular-nums text-muted-foreground">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </span>
          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={cancelling}
              className="gap-1.5 rounded-lg"
            >
              {cancelling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Ban className="h-3.5 w-3.5" />
              )}
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Stage-based pipeline */}
      <div className="space-y-6">
        {ORCHESTRATION_PIPELINE.map((stage, si) => {
          const stageAgentStatuses = stage.agents.map((a) => getAgentStatus(a.name));
          const stageCompleted = stageAgentStatuses.every((s) => s.status === "completed");
          const stageRunning = stageAgentStatuses.some((s) => s.status === "running");
          const stageFailed = stageAgentStatuses.some((s) => s.status === "failed");

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1 }}
            >
              {/* Stage header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    stageCompleted
                      ? "bg-success text-success-foreground shadow-sm"
                      : stageRunning
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : stageFailed
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {stageCompleted ? <Check className="h-3.5 w-3.5" /> : stage.stage}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Stage {stage.stage}: {stage.title}
                  </h2>
                  {stage.parallel && (
                    <span className="text-[11px] text-muted-foreground">Parallel execution</span>
                  )}
                </div>
              </div>

              {/* Agent cards — parallel stages use grid columns */}
              <div
                className={
                  stage.parallel
                    ? `grid gap-3 ${
                        stage.agents.length === 3
                          ? "md:grid-cols-3"
                          : stage.agents.length === 2
                          ? "md:grid-cols-2"
                          : ""
                      }`
                    : "space-y-3"
                }
              >
                {stage.agents.map((agent) => {
                  const info = getAgentStatus(agent.name);
                  return (
                    <AgentCard
                      key={agent.name}
                      name={agent.name}
                      icon={agent.icon}
                      description={agent.description}
                      status={info.status}
                      message={info.msg}
                      duration={info.dur}
                    />
                  );
                })}
              </div>

              {/* Stage connector */}
              {si < ORCHESTRATION_PIPELINE.length - 1 && (
                <div className="flex justify-center py-2">
                  <div
                    className={`h-6 w-0.5 rounded-full transition-colors ${
                      stageCompleted ? "bg-success/40" : "bg-border"
                    }`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      {status === "completed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate(`/job/${jobId}/results`)}
            className="gap-2 rounded-xl px-8 shadow-md transition-shadow hover:shadow-lg"
          >
            View Results <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {status === "failed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="text-sm text-destructive">{job?.error || "Processing failed"}</p>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-lg">
            Try Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
