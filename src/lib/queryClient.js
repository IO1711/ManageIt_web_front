import { QueryClient } from "@tanstack/react-query";
import { ApiRequestError } from "./api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: shouldRetry
    },
    mutations: {
      retry: false
    }
  }
});

function shouldRetry(failureCount, error) {
  if (!(error instanceof ApiRequestError)) {
    return failureCount < 1;
  }

  if ([400, 401, 403, 404, 409].includes(error.status)) {
    return false;
  }

  return failureCount < 1;
}
