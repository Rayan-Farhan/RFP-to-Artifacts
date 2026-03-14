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
    if (!document.documentElement.classList.contains("dark") && !document.documentElement.classList.contains("light-set")) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  return (
    <header className="gradient-border-bottom sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-md shadow-blue-500/25">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">
              RFP{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">
                Strategy Engine
              </span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-500">
              <Sparkles className="h-2.5 w-2.5" />
              AI-Powered
            </span>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
