import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function MetricCard({ title, value, subtitle, icon, className, children }: MetricCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 card-elevated transition-all duration-200 hover:border-primary/20", className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-3 border-t pt-3">{children}</div>}
    </div>
  );
}
