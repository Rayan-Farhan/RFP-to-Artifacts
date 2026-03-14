import { Moon, Sun, Sparkles } from "lucide-react";
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
    if (
      !document.documentElement.classList.contains("dark") &&
      !document.documentElement.classList.contains("light-set")
    ) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 shadow-md shadow-primary/30">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">
            RFP Strategy Engine
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDark(!dark)}
          className="rounded-lg"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
