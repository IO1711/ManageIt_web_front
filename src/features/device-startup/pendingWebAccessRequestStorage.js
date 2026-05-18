const STORAGE_KEY = "manageit.pending_web_access_request";

export function loadPendingWebAccessRequest() {
  if (!hasStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (
      typeof parsedValue?.requestId !== "string" ||
      typeof parsedValue?.approvalCode !== "string"
    ) {
      return null;
    }

    return {
      requestId: parsedValue.requestId,
      approvalCode: parsedValue.approvalCode,
      suggestedName:
        typeof parsedValue.suggestedName === "string" ? parsedValue.suggestedName : "",
      createdAt: typeof parsedValue.createdAt === "string" ? parsedValue.createdAt : null
    };
  } catch {
    return null;
  }
}

export function savePendingWebAccessRequest(request) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(request));
}

export function clearPendingWebAccessRequest() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
