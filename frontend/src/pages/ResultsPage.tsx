import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
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

export default function ResultsPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useArtifacts(jobId);

  // If still processing, redirect back to pipeline
  if (response && response.status === "processing") {
    navigate(`/job/${jobId}`, { replace: true });
    return null;
  }

  const artifacts = response?.artifacts;
  const downloadUrls = response?.download_urls;

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-12">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-muted"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !artifacts) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">Failed to load artifacts. Job may still be processing.</p>
          <Button variant="outline" onClick={() => navigate(`/job/${jobId}`)} className="mt-4 rounded-lg">
            Back to Pipeline
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="container max-w-7xl py-6 sm:py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Top bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Results Dashboard</h1>
              <p className="text-sm text-muted-foreground">Job {jobId?.slice(0, 8)}…</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <TabsList className="mb-8 inline-flex w-max gap-1 bg-transparent p-0 sm:flex sm:w-full sm:flex-wrap sm:justify-start">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase().replace(/ /g, "-")}
                  className="shrink-0 rounded-lg border border-transparent px-3 py-1.5 text-sm transition-colors data-[state=active]:border-primary/30 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

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
