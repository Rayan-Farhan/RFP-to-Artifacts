import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Copy, CheckCheck, Sparkles, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArtifacts } from "@/hooks/useArtifacts";
import { OverviewTab } from "@/components/results/OverviewTab";
import { ParsedRFPTab } from "@/components/results/ParsedRFPTab";
import { ProblemStatementTab } from "@/components/results/ProblemStatementTab";
import { MarketResearchTab } from "@/components/results/MarketResearchTab";
import { RequirementsTab } from "@/components/results/RequirementsTab";
import { FeaturesTab } from "@/components/results/FeaturesTab";
import { SuccessMetricsTab } from "@/components/results/SuccessMetricsTab";
import { RoadmapTab } from "@/components/results/RoadmapTab";
import { PersonasTab } from "@/components/results/PersonasTab";
import { SOWTab } from "@/components/results/SOWTab";
import { GovernanceTab } from "@/components/results/GovernanceTab";
import { EvaluationTab } from "@/components/results/EvaluationTab";
import { DownloadsTab } from "@/components/results/DownloadsTab";
import { getDownloadUrl } from "@/lib/api";
import { DOWNLOAD_ARTIFACTS } from "@/lib/types";

export default function ResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useArtifacts(jobId);
  const [copied, setCopied] = useState(false);

  // If still processing, redirect back to pipeline
  if (response && response.status === "processing") {
    navigate(`/job/${jobId}`, { replace: true });
    return null;
  }

  const artifacts = response?.artifacts;
  const downloadUrls = response?.download_urls;

  const handleCopyJobId = () => {
    if (jobId) {
      navigator.clipboard.writeText(jobId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden h-24 rounded-xl bg-muted"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !artifacts) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center max-w-md">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive/70" />
          <p className="font-semibold text-foreground">Failed to load artifacts</p>
          <p className="mt-1 text-sm text-muted-foreground">Job may still be processing.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(`/job/${jobId}`)}>
            Back to Pipeline
          </Button>
        </div>
      </div>
    );
  }

  const handleDownloadAll = () => {
    DOWNLOAD_ARTIFACTS.forEach((a) => {
      const url = getDownloadUrl(jobId!, a.key);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${a.key}.${a.ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const TABS = [
    "Overview",
    "Parsed RFP",
    "Problem Statement",
    "Market Research",
    "Requirements",
    "Features",
    "Success Metrics",
    "Roadmap",
    "Personas",
    "SOW",
    "Governance",
    "Evaluation",
    "Downloads",
  ];

  return (
    <div className="container max-w-7xl py-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Top bar */}
        <div className="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/15 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Results Dashboard</h1>
                  <button
                    onClick={handleCopyJobId}
                    aria-label="Copy job ID"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span className="font-mono">Job {jobId?.slice(0, 8)}…</span>
                    {copied ? (
                      <CheckCheck className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleDownloadAll}
              className="gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Download All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase().replace(/ /g, "-")}
                className="rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium transition-all data-[state=active]:border-primary/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/15 data-[state=active]:to-violet-500/15 data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab artifacts={artifacts} />
          </TabsContent>
          <TabsContent value="parsed-rfp">
            <ParsedRFPTab parsedRfp={artifacts.parsed_rfp} />
          </TabsContent>
          <TabsContent value="problem-statement">
            <ProblemStatementTab data={artifacts.problem_statement} />
          </TabsContent>
          <TabsContent value="market-research">
            <MarketResearchTab data={artifacts.market_research} />
          </TabsContent>
          <TabsContent value="requirements">
            <RequirementsTab requirements={artifacts.requirements} />
          </TabsContent>
          <TabsContent value="features">
            <FeaturesTab features={artifacts.features} />
          </TabsContent>
          <TabsContent value="success-metrics">
            <SuccessMetricsTab data={artifacts.success_metrics} />
          </TabsContent>
          <TabsContent value="roadmap">
            <RoadmapTab data={artifacts.roadmap} />
          </TabsContent>
          <TabsContent value="personas">
            <PersonasTab personas={artifacts.personas} questions={artifacts.interview_questions} />
          </TabsContent>
          <TabsContent value="sow">
            <SOWTab sow={artifacts.sow} />
          </TabsContent>
          <TabsContent value="governance">
            <GovernanceTab report={artifacts.governance_report} />
          </TabsContent>
          <TabsContent value="evaluation">
            <EvaluationTab evaluation={artifacts.foundry_evaluation} jobId={jobId!} />
          </TabsContent>
          <TabsContent value="downloads">
            <DownloadsTab jobId={jobId!} downloadUrls={downloadUrls} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
