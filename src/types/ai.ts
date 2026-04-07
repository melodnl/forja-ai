export interface GenerateParams {
  model: string;
  prompt: string;
  imageUrls?: string[];
  aspectRatio?: string;
  resolution?: string;
  format?: string;
  variants?: number;
}

export interface JobStatus {
  status: "processing" | "completed" | "failed";
  outputUrls?: string[];
  error?: string;
}

export interface AIProvider {
  name: string;
  generate(params: GenerateParams): Promise<{ jobId: string }>;
  getStatus(jobId: string): Promise<JobStatus>;
}
