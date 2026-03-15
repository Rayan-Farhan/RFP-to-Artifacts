import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/lib/api";
import { DOWNLOAD_ARTIFACTS } from "@/lib/types";

export function DownloadsTab({
  jobId,
  downloadUrls,
}: {
  jobId: string;
  downloadUrls?: Record<string, string>;
}) {
  const handleDownload = (artifactKey: string, ext: string) => {
    // Always use the backend API endpoint — direct blob URLs require auth
    const url = getDownloadUrl(jobId, artifactKey);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artifactKey}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Download Generated Artifacts</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DOWNLOAD_ARTIFACTS.map((artifact) => (
          <div
            key={artifact.key}
            className="group flex items-center justify-between rounded-xl border bg-card p-4 card-elevated transition-all duration-200 hover:border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                {artifact.ext === "xlsx" ? (
                  <FileSpreadsheet className="h-5 w-5 text-success" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{artifact.label}</p>
                <p className="text-[11px] text-muted-foreground">.{artifact.ext}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDownload(artifact.key, artifact.ext)}
              className="rounded-full opacity-60 transition-opacity group-hover:opacity-100"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
