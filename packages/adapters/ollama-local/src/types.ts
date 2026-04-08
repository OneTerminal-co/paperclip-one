export interface OllamaConfig {
  endpoint?: string;
  model?: string;
  temperature?: number;
  numPredict?: number;
  topP?: number;
  topK?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  temperature?: number;
  num_predict?: number;
  top_p?: number;
  top_k?: number;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_duration?: number;
  eval_duration?: number;
  eval_count?: number;
}

export interface OllamaModelsResponse {
  models: OllamaModelInfo[];
}

export interface OllamaModelInfo {
  name: string;
  digest: string;
  size: number;
  modified_at: string;
}
