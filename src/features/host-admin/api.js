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
