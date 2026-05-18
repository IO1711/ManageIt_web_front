import { requestJson } from "../../lib/api";

export function refreshClientDeviceSession() {
  return requestJson("/api/auth/refresh", {
    method: "POST"
  });
}

export function logoutClientDeviceSession(accessToken) {
  return requestJson("/api/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function createWebAccessRequest(payload) {
  return requestJson("/api/web/access-requests", {
    method: "POST",
    body: payload
  });
}

export function getWebAccessRequestStatus(requestId) {
  return requestJson(`/api/web/access-requests/${requestId}`);
}

export function completeWebAccessRequest(requestId) {
  return requestJson(`/api/web/access-requests/${requestId}/complete`, {
    method: "POST"
  });
}
