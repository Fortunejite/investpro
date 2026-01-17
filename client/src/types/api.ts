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

// Helper function to check if an error is an Axios error
export const isAxiosError = (error: unknown): error is AxiosError => {
  return error !== null && 
         typeof error === "object" && 
         "response" in error;
};

// Helper function to handle form errors from API responses
export const handleAPIError = <T extends Record<string, unknown>>(
  error: unknown,
  form: {
    setError: (name: keyof T | "root", error: { type: string; message: string }) => void;
  }
) => {
  if (isAxiosError(error)) {
    const errorData = error.response?.data;
    
    if (errorData?.error === "ValidationError" && errorData?.issues) {
      // Handle Zod validation errors - set errors on specific fields
      errorData.issues.forEach((issue) => {
        form.setError(issue.path as keyof T, {
          type: "server",
          message: issue.message,
        });
      });
    } else if (errorData?.message) {
      // Handle other server errors - set root error
      form.setError("root", {
        type: "server",
        message: errorData.message,
      });
    } else {
      // Handle unknown server errors
      form.setError("root", {
        type: "server",
        message: "Something went wrong. Please try again.",
      });
    }
  } else {
    // Handle network or unknown errors
    form.setError("root", {
      type: "server",
      message: "Something went wrong. Please try again.",
    });
  }
};
