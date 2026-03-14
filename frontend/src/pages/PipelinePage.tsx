import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ListChecks, Kanban, Users, FileSignature, ShieldCheck,
  Check, X, Loader2, ArrowRight, Target, TrendingUp, BarChart3, Map,
  Zap, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useJobStatus } from "@/hooks/useJobStatus";
import { ORCHESTRATION_PIPELINE, type AgentStatus } from "@/lib/types";

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
  tokens,
}: {
  name: string;
  icon: string;
  description: string;
  status: AgentStatus;
  message?: string;
  duration?: number | null;
  tokens?: number | null;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
        status === "running"
          ? "border-primary/60 glow-primary bg-gradient-to-br from-primary/8 to-violet-500/5"
          : status === "completed"
          ? "border-green-500/40 bg-gradient-to-br from-green-500/5 to-emerald-500/3"
          : status === "failed"
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card opacity-50"
      }`}
    >
      {/* Gradient top accent line */}
      {status === "running" && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      {status === "completed" && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500 to-transparent" />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-xl p-2.5 ${
            status === "running"
              ? "bg-gradient-to-br from-primary/30 to-violet-500/20 text-primary shadow-sm"
              : status === "completed"
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/15 text-green-500 shadow-sm"
              : status === "failed"
              ? "bg-destructive/20 text-destructive"
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
          <p className="mt-0.5 text-xs text-muted-foreground">
            {status === "running" ? message || description : description}
          </p>
          {status === "completed" && (duration || tokens) && (
            <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
              {duration != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration.toFixed(1)}s
                </span>
              )}
              {tokens != null && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {tokens.toLocaleString()} tokens
                </span>
              )}
            </div>
          )}
          {status === "failed" && message && (
            <p className="mt-1.5 text-xs text-destructive">{message}</p>
          )}
        </div>
      </div>
      {status === "running" && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-primary/60"
          animate={{ opacity: [0.2, 0.7, 0.2] }}
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

  const allLogs = job?.agent_logs && job.agent_logs.length > logs.length ? job.agent_logs : logs;
  const status = job?.status;

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

  // Compute overall progress
  const totalAgents = ORCHESTRATION_PIPELINE.flatMap((s) => s.agents).length;
  const completedAgents = ORCHESTRATION_PIPELINE.flatMap((s) => s.agents).filter(
    (a) => getAgentStatus(a.name).status === "completed"
  ).length;
  const progressPct = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  return (
    <div className="container max-w-4xl py-8">
      {/* Job info bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/15 p-2.5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{job?.filename || "Processing…"}</p>
              <p className="text-xs text-muted-foreground">
                Job <span className="font-mono">{jobId?.slice(0, 8)}</span>…
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && <StatusBadge status={status} />}
            {!connected && status !== "completed" && status !== "failed" && (
              <span className="text-xs text-warning">Polling mode</span>
            )}
            <span className="rounded-md bg-muted px-2 py-1 text-sm tabular-nums font-mono text-muted-foreground">
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {status !== "failed" && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Overall progress</span>
              <span className="text-xs font-medium text-foreground">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>

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
              transition={{ delay: si * 0.08 }}
            >
              {/* Stage header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-all ${
                    stageCompleted
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-500/25"
                      : stageRunning
                      ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-blue-500/30"
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
                    <span className="text-xs text-muted-foreground">Parallel execution</span>
                  )}
                </div>
                {stageCompleted && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-auto flex items-center gap-1 text-xs text-green-500 font-medium"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Complete
                  </motion.div>
                )}
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
                      tokens={info.tok}
                    />
                  );
                })}
              </div>

              {/* Stage connector */}
              {si < ORCHESTRATION_PIPELINE.length - 1 && (
                <div className="flex justify-center py-2">
                  <div
                    className={`h-6 w-0.5 rounded-full ${
                      stageCompleted
                        ? "bg-gradient-to-b from-green-500/60 to-green-500/20"
                        : "bg-border"
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
          className="mt-8 flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate(`/job/${jobId}/results`)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-95"
          >
            View Results <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {status === "failed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3"
        >
          <p className="font-medium text-destructive">{job?.error || "Processing failed"}</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Try Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
