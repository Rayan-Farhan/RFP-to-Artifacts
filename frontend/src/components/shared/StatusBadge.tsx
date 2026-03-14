import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pass" | "warning" | "fail" | "pending" | "processing" | "completed" | "failed" | "idle" | "running";
  label?: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  pass: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  processing: "bg-primary/15 text-primary border-primary/30",
  running: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-muted text-muted-foreground border-border",
  idle: "bg-muted text-muted-foreground border-border",
  fail: "bg-destructive/15 text-destructive border-destructive/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
        className
      )}
    >
      {label || statusLabels[status]}
    </span>
  );
}
