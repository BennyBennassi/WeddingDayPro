import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse JSON response first
      const errorData = await res.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      }
      
      // Provide user-friendly error messages based on status
      if (res.status === 401) {
        throw new Error("Please check your username and password and try again.");
      } else if (res.status === 403) {
        throw new Error("You don't have permission to access this resource.");
      } else if (res.status === 404) {
        throw new Error("The requested resource could not be found.");
      } else if (res.status >= 500) {
        throw new Error("Something went wrong on our end. Please try again later.");
      } else {
        throw new Error("An error occurred. Please try again.");
      }
    } catch (jsonError) {
      // If JSON parsing fails, provide user-friendly messages based on status code
      if (res.status === 401) {
        throw new Error("Please check your username and password and try again.");
      } else if (res.status === 403) {
        throw new Error("You don't have permission to access this resource.");
      } else if (res.status === 404) {
        throw new Error("The requested resource could not be found.");
      } else if (res.status >= 500) {
        throw new Error("Something went wrong on our end. Please try again later.");
      } else {
        throw new Error("An error occurred. Please try again.");
      }
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
