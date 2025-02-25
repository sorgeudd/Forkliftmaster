import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add retry logic
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      // If request succeeds, return response
      if (res.ok) return res;

      // If it's a 401 or 404, don't retry
      if (res.status === 401 || res.status === 404) {
        await throwIfResNotOk(res);
      }

      // For other errors, retry
      attempt++;
      if (attempt === maxRetries) {
        await throwIfResNotOk(res);
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      attempt++;
    }
  }

  throw new Error("Maximum retries reached");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        signal, // Add AbortController signal for request cancellation
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // Handle cancelled requests
        console.log("Request cancelled:", queryKey);
        throw error;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5000, // Cache data for 5 seconds
      retry: (failureCount, error) => {
        // Don't retry on 401/404
        if (error instanceof Error && error.message.startsWith("401:")) return false;
        if (error instanceof Error && error.message.startsWith("404:")) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on 401/404
        if (error instanceof Error && error.message.startsWith("401:")) return false;
        if (error instanceof Error && error.message.startsWith("404:")) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    },
  },
});