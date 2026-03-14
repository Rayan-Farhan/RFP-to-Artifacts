import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, ListChecks, Kanban, Users, FileSignature, ShieldCheck,
  Check, X, Loader2, ArrowRight, Target, TrendingUp, BarChart3, Map
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
      className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
        status === "running"
          ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
          : status === "completed"
          ? "border-success/40 bg-success/5"
          : status === "failed"
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg p-2 ${
            status === "running"
              ? "bg-primary/20 text-primary"
              : status === "completed"
              ? "bg-success/20 text-success"
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
            <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
              {duration != null && <span>{duration.toFixed(1)}s</span>}
              {tokens != null && <span>{tokens.toLocaleString()} tokens</span>}
            </div>
          )}
          {status === "failed" && message && (
            <p className="mt-1.5 text-xs text-destructive">{message}</p>
          )}
        </div>
      </div>
      {status === "running" && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary"
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

  const totalAgents = ORCHESTRATION_PIPELINE.reduce((sum, s) => sum + s.agents.length, 0);
  const completedAgents = ORCHESTRATION_PIPELINE.reduce(
    (sum, s) => sum + s.agents.filter((a) => getAgentStatus(a.name).status === "completed").length,
    0
  );
  const progressPct = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  return (
    <div className="container max-w-4xl py-8">
      {/* Job info bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{job?.filename || "Processing…"}</p>
            <p className="text-xs text-muted-foreground">
              {jobId?.slice(0, 8)}… • {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status && <StatusBadge status={status} />}
          {!connected && status !== "completed" && status !== "failed" && (
            <span className="text-xs text-warning">Polling mode</span>
          )}
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-mono tabular-nums text-muted-foreground">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Overall progress bar */}
      {status !== "completed" && status !== "failed" && (
        <div className="mb-8">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Pipeline Progress</span>
            <span>{completedAgents} / {totalAgents} agents</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

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
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    stageCompleted
                      ? "bg-success text-success-foreground"
                      : stageRunning
                      ? "bg-primary text-primary-foreground"
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
                    className={`h-6 w-0.5 ${
                      stageCompleted ? "bg-success/50" : "bg-border"
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
          className="mt-8 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2 text-sm text-success">
            <Check className="h-4 w-4" />
            <span>All agents completed successfully</span>
          </div>
          <Button
            size="lg"
            onClick={() => navigate(`/job/${jobId}/results`)}
            className="gap-2 shadow-lg shadow-primary/20"
          >
            View Results <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {status === "failed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-3 text-center"
        >
          <p className="text-destructive">{job?.error || "Processing failed"}</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Try Again
          </Button>
        </motion.div>
      )}
    </div>
  );
}
