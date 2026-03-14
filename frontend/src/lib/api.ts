import type { RFPJob, ArtifactsResponse, EvaluationReport } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getWsUrl = (jobId: string) => {
  const wsBase = API_URL.replace(/^http/, "ws");
  return `${wsBase}/ws/${jobId}`;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export async function uploadRFP(file: File): Promise<{ job_id: string; filename: string; status: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/api/upload`, { method: "POST", body: formData });
  return handleResponse(res);
}

export async function getJobStatus(jobId: string): Promise<RFPJob> {
  const res = await fetch(`${API_URL}/api/status/${jobId}`);
  return handleResponse(res);
}

export async function getArtifacts(jobId: string): Promise<ArtifactsResponse> {
  const res = await fetch(`${API_URL}/api/artifacts/${jobId}`);
  return handleResponse(res);
}

export async function getEvaluation(jobId: string): Promise<EvaluationReport> {
  const res = await fetch(`${API_URL}/api/evaluation/${jobId}`);
  const data = await handleResponse<{ job_id: string; evaluation: EvaluationReport }>(res);
  return data.evaluation;
}

export async function rerunEvaluation(jobId: string): Promise<EvaluationReport> {
  const res = await fetch(`${API_URL}/api/evaluation/${jobId}/rerun`, { method: "POST" });
  const data = await handleResponse<{ job_id: string; evaluation: EvaluationReport; rerun: boolean }>(res);
  return data.evaluation;
}

export function getDownloadUrl(jobId: string, artifactType: string): string {
  return `${API_URL}/api/download/${jobId}/${artifactType}`;
}

export async function cancelJob(jobId: string): Promise<{ job_id: string; message: string }> {
  const res = await fetch(`${API_URL}/api/cancel/${jobId}`, { method: "POST" });
  return handleResponse(res);
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`);
  return handleResponse(res);
}
