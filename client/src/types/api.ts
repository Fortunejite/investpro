// API Error Types for better error handling

export interface ValidationError {
  error: "ValidationError";
  issues: Array<{
    path: string;
    message: string;
  }>;
}

export interface APIErrorResponse {
  error?: string;
  message?: string;
  issues?: Array<{
    path: string;
    message: string;
  }>;
}

export interface AxiosError {
  response?: {
    data?: APIErrorResponse;
    status?: number;
  };
}
