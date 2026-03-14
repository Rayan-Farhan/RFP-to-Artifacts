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
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30",
        className
      )}
    >
      {/* Subtle top gradient line on hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && (
          <div className="ml-3 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/10 p-2.5 text-primary ring-1 ring-primary/10 transition-all duration-200 group-hover:from-primary/25 group-hover:to-violet-500/20">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
