import { requestJson } from "../../lib/api";

export function getAdminSession() {
  return requestJson("/api/admin/session/me");
}

export function loginAdminSession(payload) {
  return requestJson("/api/admin/session/login", {
    method: "POST",
    body: payload
  });
}

export function logoutAdminSession() {
  return requestJson("/api/admin/session/logout", {
    method: "POST"
  });
}

export function createAdminOnboarding(payload) {
  return requestJson("/api/admin/onboarding", {
    method: "POST",
    body: payload
  });
}

export function getAdminWebAccessRequests() {
  return requestJson("/api/admin/web-access-requests");
}

export function approveAdminWebAccessRequest(requestId, payload) {
  return requestJson(`/api/admin/web-access-requests/${requestId}/approve`, {
    method: "POST",
    body: payload
  });
}

export function rejectAdminWebAccessRequest(requestId) {
  return requestJson(`/api/admin/web-access-requests/${requestId}/reject`, {
    method: "POST"
  });
}

export function createAdminMobilePairing(payload) {
  return requestJson("/api/admin/mobile-pairings", {
    method: "POST",
    body: payload
  });
}

export function getAdminMobilePairings() {
  return requestJson("/api/admin/mobile-pairings");
}

export function finalizeAdminMobilePairing(pairingId, payload) {
  return requestJson(`/api/admin/mobile-pairings/${pairingId}/finalize`, {
    method: "POST",
    body: payload
  });
}

export function cancelAdminMobilePairing(pairingId) {
  return requestJson(`/api/admin/mobile-pairings/${pairingId}/cancel`, {
    method: "POST"
  });
}

export function getAdminDevices() {
  return requestJson("/api/admin/devices");
}

export function updateAdminDeviceRole(deviceId, payload) {
  return requestJson(`/api/admin/devices/${deviceId}/role`, {
    method: "PUT",
    body: payload
  });
}

export function revokeAdminDevice(deviceId) {
  return requestJson(`/api/admin/devices/${deviceId}/revoke`, {
    method: "POST"
  });
}
