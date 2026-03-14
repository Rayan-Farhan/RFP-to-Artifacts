import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ListChecks, Kanban, Users, FileSignature, ShieldCheck,
  Check, X, Loader2, ArrowRight, Target, TrendingUp, BarChart3, Map,
  StopCircle, Clock, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useJobStatus } from "@/hooks/useJobStatus";
import { ORCHESTRATION_PIPELINE, type AgentStatus } from "@/lib/types";
import { cancelJob } from "@/lib/api";
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
          ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
          : status === "completed"
          ? "border-emerald-500/30 bg-emerald-500/5"
          : status === "failed"
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-card opacity-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${
            status === "running"
              ? "bg-primary/20 text-primary"
              : status === "completed"
              ? "bg-emerald-500/20 text-emerald-500"
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {status === "running" ? message || description : description}
          </p>
          {status === "completed" && (duration != null || tokens != null) && (
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {duration != null && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {duration.toFixed(1)}s
                </span>
              )}
              {tokens != null && <span>{tokens.toLocaleString()} tokens</span>}
            </div>
          )}
          {status === "failed" && message && (
            <p className="mt-1.5 line-clamp-2 text-xs text-destructive">{message}</p>
          )}
        </div>
      </div>
      {status === "running" && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-violet-500"
          animate={{ width: ["0%", "100%", "0%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
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
  const isActive = status !== "completed" && status !== "failed";

  useEffect(() => {
    if (!isActive) return;
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const handleCancel = async () => {
    if (!jobId || cancelling) return;
    setCancelling(true);
    try {
      await cancelJob(jobId);
      toast.info("Cancellation requested");
    } catch {
      toast.error("Failed to cancel — please try again");
    } finally {
      setCancelling(false);
    }
  };

  const getAgentStatus = (name: string): { status: AgentStatus; msg?: string; dur?: number | null; tok?: number | null } => {
    const log = allLogs.find((l) => l.agent_name === name);
    if (!log) return { status: "idle" };
    return { status: log.status, msg: log.message, dur: log.duration_seconds, tok: log.tokens_used };
  };

  const totalAgents = ORCHESTRATION_PIPELINE.flatMap((s) => s.agents).length;
  const completedAgents = ORCHESTRATION_PIPELINE.flatMap((s) => s.agents).filter(
    (a) => getAgentStatus(a.name).status === "completed"
  ).length;
  const progressPct = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  return (
    <div className="container max-w-4xl py-8">
      {/* Job info bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-xl border bg-card p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {job?.filename || "Processing…"}
              </p>
              <p className="text-xs text-muted-foreground">Job {jobId?.slice(0, 8)}…</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status && <StatusBadge status={status} />}
            {!connected && isActive && (
              <span className="flex items-center gap-1 text-xs text-warning">
                <WifiOff className="h-3 w-3" />
                Polling
              </span>
            )}
            {connected && isActive && (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <Wifi className="h-3 w-3" />
                Live
              </span>
            )}
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {Math.floor(elapsed / 60).toString().padStart(2, "0")}:
              {(elapsed % 60).toString().padStart(2, "0")}
            </span>
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {cancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <StopCircle className="h-3.5 w-3.5" />
                )}
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>
                {completedAgents} of {totalAgents} agents complete
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Stage-based pipeline */}
      <div className="space-y-5">
        {ORCHESTRATION_PIPELINE.map((stage, si) => {
          const stageStatuses = stage.agents.map((a) => getAgentStatus(a.name));
          const stageCompleted = stageStatuses.every((s) => s.status === "completed");
          const stageRunning = stageStatuses.some((s) => s.status === "running");
          const stageFailed = stageStatuses.some((s) => s.status === "failed");

          return (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
            >
              {/* Stage header */}
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    stageCompleted
                      ? "bg-emerald-500 text-white"
                      : stageRunning
                      ? "bg-primary text-white"
                      : stageFailed
                      ? "bg-destructive text-white"
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
                    <p className="text-xs text-muted-foreground">Parallel execution</p>
                  )}
                </div>
              </div>

              {/* Agent cards */}
              <div
                className={
                  stage.parallel
                    ? `grid gap-3 ${
                        stage.agents.length === 3
                          ? "md:grid-cols-3"
                          : "md:grid-cols-2"
                      }`
                    : ""
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
                    className={`h-6 w-px ${stageCompleted ? "bg-emerald-500/40" : "bg-border"}`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Completion action */}
      {status === "completed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => navigate(`/job/${jobId}/results`)}
            className="gap-2 bg-gradient-to-r from-primary to-violet-600 text-white shadow-lg shadow-primary/20"
          >
            View Results
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Failure state */}
      {status === "failed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="mb-3 text-sm font-medium text-destructive">
            {job?.error || "Processing failed"}
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Try Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
