import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  label?: string;
  status?: "pass" | "warning" | "fail";
}

const statusColor = {
  pass: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  fail: "hsl(var(--destructive))",
};

function getAutoStatus(score: number, max: number): "pass" | "warning" | "fail" {
  const pct = score / max;
  if (pct >= 0.8) return "pass";
  if (pct >= 0.6) return "warning";
  return "fail";
}

export function ScoreGauge({ score, maxScore = 10, size = 120, label, status }: ScoreGaugeProps) {
  const resolvedStatus = status || getAutoStatus(score, maxScore);
  const color = statusColor[resolvedStatus];
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / maxScore, 1);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={5}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{score.toFixed(1)}</span>
          <span className="text-[10px] text-muted-foreground">/ {maxScore}</span>
        </div>
      </div>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
