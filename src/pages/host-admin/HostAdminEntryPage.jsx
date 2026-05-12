import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminOnboarding,
  getAdminSession,
  loginAdminSession,
  logoutAdminSession
} from "../../features/host-admin/api";
import { AdminOnboardingForm } from "../../features/host-admin/components/AdminOnboardingForm";
import { AdminSignInForm } from "../../features/host-admin/components/AdminSignInForm";
import { getApiErrorMessage, isApiErrorStatus } from "../../lib/api";

const ENTRY_MODES = {
  LOGIN: "login",
  ONBOARDING: "onboarding"
};

export function HostAdminEntryPage() {
  const queryClient = useQueryClient();
  const [entryMode, setEntryMode] = useState(ENTRY_MODES.LOGIN);
  const [loginError, setLoginError] = useState(null);
  const [onboardingError, setOnboardingError] = useState(null);
  const [flash, setFlash] = useState(null);

  const adminSessionQuery = useQuery({
    queryKey: ["host-admin-session"],
    queryFn: getAdminSession,
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: loginAdminSession,
    onSuccess: (session) => {
      setLoginError(null);
      queryClient.setQueryData(["host-admin-session"], session);
      setFlash({
        tone: "success",
        title: "Session ready",
        message: `Signed into the host admin workspace for ${session.organizationName}.`
      });
    }
  });

  const onboardingMutation = useMutation({
    mutationFn: createAdminOnboarding,
    onSuccess: (response) => {
      setOnboardingError(null);
      setEntryMode(ENTRY_MODES.LOGIN);
      setFlash({
        tone: "success",
        title: "Installation configured",
        message: `${response.organizationName} is ready. Sign in with the admin password you just created.`
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: logoutAdminSession,
    onSuccess: async () => {
      queryClient.setQueryData(["host-admin-session"], null);
      setFlash({
        tone: "muted",
        title: "Signed out",
        message: "The host admin session cookie was cleared."
      });
      await queryClient.invalidateQueries({ queryKey: ["host-admin-session"] });
    }
  });

  const sessionError =
    adminSessionQuery.error && !isApiErrorStatus(adminSessionQuery.error, 401)
      ? adminSessionQuery.error
      : null;
  const session = adminSessionQuery.data;
  const isAuthenticated = Boolean(session?.authenticated);

  async function handleLogin(values) {
    setFlash(null);
    setLoginError(null);

    try {
      await loginMutation.mutateAsync(values);
    } catch (error) {
      setLoginError(error);

      if (error?.code === "ONBOARDING_NOT_COMPLETED") {
        setEntryMode(ENTRY_MODES.ONBOARDING);
        setFlash({
          tone: "warning",
          title: "Setup still required",
          message: "This installation has not been onboarded yet, so the screen switched to setup."
        });
      }
    }
  }

  async function handleOnboarding(values) {
    setFlash(null);
    setOnboardingError(null);

    try {
      await onboardingMutation.mutateAsync(values);
    } catch (error) {
      setOnboardingError(error);

      if (error?.code === "ONBOARDING_ALREADY_COMPLETED") {
        setEntryMode(ENTRY_MODES.LOGIN);
        setFlash({
          tone: "warning",
          title: "Setup already exists",
          message: "This installation was already onboarded, so the screen switched back to sign-in."
        });
      }
    }
  }

  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="hero-panel">
          <span className="eyebrow">Host Admin Mode</span>
          <h1>ManageIt starts on localhost with installation setup and admin sign-in.</h1>
          <p className="hero-copy">
            This frontend slice uses the implemented backend contract for
            <code> /api/admin/onboarding </code>
            and
            <code> /api/admin/session/* </code>
            so the host computer can configure the installation before approving devices
            or managing inventory.
          </p>

          <div className="hero-actions">
            <div className="stat-card">
              <span className="stat-label">Feature status</span>
              <strong>Implemented first slice</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Backend wiring</span>
              <strong>Session cookie + onboarding JSON</strong>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-step">
              <span className="timeline-index">01</span>
              <div>
                <h2>Set up installation</h2>
                <p>Create organization settings and initial locations with backend validation.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">02</span>
              <div>
                <h2>Sign into host admin</h2>
                <p>Use the session-backed admin login that only exists after onboarding.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">03</span>
              <div>
                <h2>Unlock next features</h2>
                <p>Approvals, devices, settings, and inventory plug into this entry point next.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow eyebrow-soft">Entry Flow</span>
              <h2>Host access</h2>
            </div>
            {adminSessionQuery.isLoading ? <span className="pill">Checking session</span> : null}
          </header>

          {flash ? (
            <div className={`notice notice-${flash.tone}`}>
              <strong>{flash.title}</strong>
              <p>{flash.message}</p>
            </div>
          ) : null}

          {sessionError ? (
            <div className="notice notice-danger">
              <strong>Session check failed</strong>
              <p>{getApiErrorMessage(sessionError, "The app could not verify the current admin session.")}</p>
            </div>
          ) : null}

          {isAuthenticated ? (
            <div className="panel-stack">
              <div className="session-card">
                <span className="pill pill-success">Authenticated</span>
                <h3>{session.organizationName}</h3>
                <p>
                  The host admin session is active. This is the handoff point for the next
                  feature slices.
                </p>
              </div>

              <div className="panel-section">
                <h3>Current slice complete</h3>
                <p>
                  Onboarding and sign-in are working against the real backend endpoints.
                  Device approvals, settings, and inventory routes are intentionally held for
                  the next validation step.
                </p>
              </div>

              <button
                className="button button-secondary"
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <>
              <div className="tab-row" role="tablist" aria-label="Host admin entry modes">
                <button
                  className={`tab-button ${entryMode === ENTRY_MODES.LOGIN ? "active" : ""}`}
                  type="button"
                  onClick={() => setEntryMode(ENTRY_MODES.LOGIN)}
                >
                  Admin sign-in
                </button>
                <button
                  className={`tab-button ${entryMode === ENTRY_MODES.ONBOARDING ? "active" : ""}`}
                  type="button"
                  onClick={() => setEntryMode(ENTRY_MODES.ONBOARDING)}
                >
                  First-time setup
                </button>
              </div>

              {entryMode === ENTRY_MODES.LOGIN ? (
                <AdminSignInForm
                  onSubmit={handleLogin}
                  isPending={loginMutation.isPending}
                  errorMessage={getApiErrorMessage(loginError)}
                  onSwitchToOnboarding={() => setEntryMode(ENTRY_MODES.ONBOARDING)}
                />
              ) : (
                <AdminOnboardingForm
                  onSubmit={handleOnboarding}
                  isPending={onboardingMutation.isPending}
                  errorMessage={getApiErrorMessage(onboardingError)}
                  onSwitchToLogin={() => setEntryMode(ENTRY_MODES.LOGIN)}
                />
              )}
            </>
          )}
        </aside>
      </section>
    </main>
  );
}
