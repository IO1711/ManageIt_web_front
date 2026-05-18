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
import { HostAdminWebAccessWorkspace } from "../../features/host-admin/components/HostAdminWebAccessWorkspace";
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

  if (isAuthenticated) {
    return (
      <HostAdminWebAccessWorkspace
        session={session}
        flash={flash}
        setFlash={setFlash}
        onLogout={() => logoutMutation.mutate()}
        logoutPending={logoutMutation.isPending}
      />
    );
  }

  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="hero-panel">
          <span className="eyebrow">Host Admin Mode</span>
          <h1>ManageIt starts on localhost with installation setup, sign-in, and approvals.</h1>
          <p className="hero-copy">
            This frontend uses the implemented backend contract for
            <code> /api/admin/onboarding </code>
            and
            <code> /api/admin/session/* </code>
            plus browser approvals, iPhone pairings, and registered-device management once
            the host admin session is active.
          </p>

          <div className="hero-actions">
            <div className="stat-card">
              <span className="stat-label">Ready now</span>
              <strong>Onboarding and sign-in</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Authenticated workspace</span>
              <strong>Approvals, pairings, and device registry</strong>
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
                <h2>Review browser requests</h2>
                <p>After sign-in, the host-only workspace can approve browsers, pair iPhones, manage registered devices, and expand into more admin tools later.</p>
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
        </aside>
      </section>
    </main>
  );
}
