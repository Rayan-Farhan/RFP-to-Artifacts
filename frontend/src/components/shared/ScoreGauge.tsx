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
  // Coerce to number — LLMs sometimes return numeric strings (e.g. "8.5" instead of 8.5)
  const numericScore = Number(score) || 0;
  const resolvedStatus = status || getAutoStatus(numericScore, maxScore);
  const color = statusColor[resolvedStatus] ?? statusColor.fail;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(numericScore / maxScore, 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={6}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{numericScore.toFixed(1)}</span>
        </div>
      </div>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
