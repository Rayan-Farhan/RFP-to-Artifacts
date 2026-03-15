import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pass" | "warning" | "fail" | "pending" | "processing" | "completed" | "failed" | "idle" | "running";
  label?: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pass: "bg-success/10 text-success border-success/25",
  completed: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  processing: "bg-primary/10 text-primary border-primary/25",
  running: "bg-primary/10 text-primary border-primary/25",
  pending: "bg-muted text-muted-foreground border-border",
  idle: "bg-muted text-muted-foreground border-border",
  fail: "bg-destructive/10 text-destructive border-destructive/25",
  failed: "bg-destructive/10 text-destructive border-destructive/25",
};

const statusDot: Record<string, string> = {
  pass: "bg-success",
  completed: "bg-success",
  warning: "bg-warning",
  processing: "bg-primary animate-pulse",
  running: "bg-primary animate-pulse",
  pending: "bg-muted-foreground",
  idle: "bg-muted-foreground",
  fail: "bg-destructive",
  failed: "bg-destructive",
};

const statusLabels: Record<string, string> = {
  pass: "Pass",
  completed: "Completed",
  warning: "Warning",
  processing: "Processing",
  running: "Running",
  pending: "Pending",
  idle: "Idle",
  fail: "Fail",
  failed: "Failed",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {label || statusLabels[status]}
    </span>
  );
}
