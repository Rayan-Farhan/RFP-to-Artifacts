import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Header() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Default to dark on first load
  useEffect(() => {
    if (!document.documentElement.classList.contains("dark") && !document.documentElement.classList.contains("light-set")) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="group flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm transition-transform group-hover:scale-105">
            <span className="text-sm font-bold text-primary-foreground">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight text-foreground">RFP Strategy Engine</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">AI-Powered Analysis</span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDark(!dark)}
          className="rounded-full transition-colors hover:bg-accent"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
