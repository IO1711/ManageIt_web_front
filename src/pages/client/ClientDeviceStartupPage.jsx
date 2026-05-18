import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeWebAccessRequest,
  createWebAccessRequest,
  getWebAccessRequestStatus,
  logoutClientDeviceSession,
  refreshClientDeviceSession
} from "../../features/device-startup/api";
import { detectBrowserMetadata } from "../../features/device-startup/browserMetadata";
import {
  clearPendingWebAccessRequest,
  loadPendingWebAccessRequest,
  savePendingWebAccessRequest
} from "../../features/device-startup/pendingWebAccessRequestStorage";
import { ClientAccessRequestForm } from "../../features/device-startup/components/ClientAccessRequestForm";
import {
  getApiErrorMessage,
  isApiErrorCode,
  isApiErrorStatus
} from "../../lib/api";
import { ClientPlaceholderPage } from "./ClientPlaceholderPage";

const CLIENT_SESSION_QUERY_KEY = ["client-device-session"];

export function ClientDeviceStartupPage() {
  const queryClient = useQueryClient();
  const browserMetadata = detectBrowserMetadata(window.navigator);
  const [pendingRequest, setPendingRequest] = useState(() => loadPendingWebAccessRequest());
  const [requestError, setRequestError] = useState(null);
  const [completionError, setCompletionError] = useState(null);
  const [sessionActionError, setSessionActionError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [autoCompletionRequestId, setAutoCompletionRequestId] = useState(null);

  const clientSessionQuery = useQuery({
    queryKey: CLIENT_SESSION_QUERY_KEY,
    queryFn: async () => normalizeClientSession(await refreshClientDeviceSession()),
    retry: false
  });

  const createRequestMutation = useMutation({
    mutationFn: createWebAccessRequest,
    onSuccess: (response, variables) => {
      const nextPendingRequest = {
        requestId: response.requestId,
        approvalCode: response.approvalCode,
        suggestedName: variables.suggestedName,
        createdAt: new Date().toISOString()
      };

      savePendingWebAccessRequest(nextPendingRequest);
      setPendingRequest(nextPendingRequest);
      setRequestError(null);
      setCompletionError(null);
      setSessionActionError(null);
      setFlash({
        tone: "muted",
        title: "Approval code ready",
        message: "The startup screen saved this pending browser request and will keep polling for host approval."
      });
      setAutoCompletionRequestId(null);
    }
  });

  const requestStatusQuery = useQuery({
    queryKey: ["web-access-request-status", pendingRequest?.requestId],
    queryFn: () => getWebAccessRequestStatus(pendingRequest.requestId),
    enabled: !clientSessionQuery.data?.authenticated && Boolean(pendingRequest?.requestId),
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? 3000 : false
  });

  const completeRequestMutation = useMutation({
    mutationFn: (requestId) => completeWebAccessRequest(requestId),
    onError: (error) => {
      setCompletionError(error);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(CLIENT_SESSION_QUERY_KEY, normalizeClientSession(response));
      clearPendingWebAccessRequest();
      setPendingRequest(null);
      setCompletionError(null);
      setSessionActionError(null);
      setFlash({
        tone: "success",
        title: "Browser approved",
        message: `${response.friendlyName} is now registered and the inventory routes can plug into this approved session next.`
      });
      setAutoCompletionRequestId(null);
    }
  });

  const logoutMutation = useMutation({
    mutationFn: logoutClientDeviceSession,
    onSuccess: async () => {
      queryClient.setQueryData(CLIENT_SESSION_QUERY_KEY, null);
      setSessionActionError(null);
      setFlash({
        tone: "muted",
        title: "Browser signed out",
        message: "The current browser device session was cleared and this host returned to the access request screen."
      });
      await queryClient.invalidateQueries({ queryKey: CLIENT_SESSION_QUERY_KEY });
    }
  });

  const clientSession = clientSessionQuery.data;
  const isAuthenticated = Boolean(clientSession?.authenticated);
  const sessionBootstrapError =
    clientSessionQuery.error && !isApiErrorStatus(clientSessionQuery.error, 401)
      ? clientSessionQuery.error
      : null;
  const requestStatus = requestStatusQuery.data?.status ?? (pendingRequest ? "PENDING" : null);
  const requestStatusTone = getRequestStatusTone(requestStatus);
  const requestStatusMessage = getRequestStatusMessage(requestStatus);

  useEffect(() => {
    if (!isAuthenticated || !pendingRequest) {
      return;
    }

    clearPendingWebAccessRequest();
    setPendingRequest(null);
    setAutoCompletionRequestId(null);
  }, [isAuthenticated, pendingRequest]);

  useEffect(() => {
    if (!requestStatusQuery.error) {
      return;
    }

    if (!isApiErrorCode(requestStatusQuery.error, "WEB_ACCESS_REQUEST_NOT_FOUND")) {
      return;
    }

    clearPendingWebAccessRequest();
    setPendingRequest(null);
    setAutoCompletionRequestId(null);
    setFlash({
      tone: "warning",
      title: "Saved request was cleared",
      message: "The pending access request could not be found anymore, so the browser can start a fresh request."
    });
  }, [requestStatusQuery.error]);

  useEffect(() => {
    if (
      requestStatus !== "APPROVED" ||
      !pendingRequest?.requestId ||
      isAuthenticated ||
      completeRequestMutation.isPending ||
      autoCompletionRequestId === pendingRequest.requestId
    ) {
      return;
    }

    setAutoCompletionRequestId(pendingRequest.requestId);
    setCompletionError(null);
    completeRequestMutation.mutate(pendingRequest.requestId);
  }, [
    autoCompletionRequestId,
    completeRequestMutation,
    isAuthenticated,
    pendingRequest?.requestId,
    requestStatus
  ]);

  if (isAuthenticated) {
    return (
      <ClientPlaceholderPage
        session={clientSession}
        flash={flash}
        errorMessage={getApiErrorMessage(sessionActionError)}
        onLogout={async () => {
          setSessionActionError(null);

          try {
            await logoutMutation.mutateAsync(clientSession.accessToken);
          } catch (error) {
            setSessionActionError(error);
          }
        }}
        logoutPending={logoutMutation.isPending}
      />
    );
  }

  async function handleCreateRequest(values) {
    setFlash(null);
    setRequestError(null);
    setCompletionError(null);

    try {
      await createRequestMutation.mutateAsync({
        suggestedName: values.suggestedName,
        platformName: browserMetadata.platformName,
        platformVersion: browserMetadata.platformVersion,
        browserName: browserMetadata.browserName,
        browserVersion: browserMetadata.browserVersion
      });
    } catch (error) {
      setRequestError(error);
    }
  }

  async function handleRetryCompletion() {
    if (!pendingRequest?.requestId) {
      return;
    }

    setCompletionError(null);

    try {
      await completeRequestMutation.mutateAsync(pendingRequest.requestId);
    } catch (error) {
      setCompletionError(error);
    }
  }

  function handleStartOver() {
    clearPendingWebAccessRequest();
    setPendingRequest(null);
    setRequestError(null);
    setCompletionError(null);
    setSessionActionError(null);
    setAutoCompletionRequestId(null);
    setFlash({
      tone: "muted",
      title: "Request cleared",
      message: "This browser can submit a fresh access request now."
    });
  }

  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="hero-panel">
          <span className="eyebrow">Regular Client Host</span>
          <h1>Register this browser once, then come straight back into the app.</h1>
          <p className="hero-copy">
            This slice implements the public desktop startup flow from the architecture:
            the browser requests access, receives an approval code, waits for host-admin
            approval on <code>localhost</code>, and exchanges approval into a device
            session with its access token kept only in memory.
          </p>

          <div className="hero-actions">
            <div className="stat-card">
              <span className="stat-label">Step one</span>
              <strong>Request access from this browser</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Step two</span>
              <strong>Host admin approves the browser code</strong>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-step">
              <span className="timeline-index">01</span>
              <div>
                <h2>Send browser metadata</h2>
                <p>The startup screen submits a suggested name plus detected platform details.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">02</span>
              <div>
                <h2>Wait on the approval code</h2>
                <p>The browser keeps polling until the host-only admin UI approves or rejects it.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">03</span>
              <div>
                <h2>Finalize into a device session</h2>
                <p>When approval lands, the browser exchanges the request for a refresh cookie and in-memory access token.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow eyebrow-soft">Device Startup</span>
              <h2>Browser access</h2>
            </div>
            {clientSessionQuery.isLoading ? (
              <span className="pill">Checking saved approval</span>
            ) : null}
          </header>

          {flash ? (
            <div className={`notice notice-${flash.tone}`}>
              <strong>{flash.title}</strong>
              <p>{flash.message}</p>
            </div>
          ) : null}

          {sessionBootstrapError ? (
            <div className="notice notice-danger">
              <strong>Session bootstrap failed</strong>
              <p>
                {getApiErrorMessage(
                  sessionBootstrapError,
                  "The app could not check the existing browser session."
                )}
              </p>
            </div>
          ) : null}

          {!pendingRequest ? (
            <ClientAccessRequestForm
              browserMetadata={browserMetadata}
              onSubmit={handleCreateRequest}
              isPending={createRequestMutation.isPending}
              errorMessage={getApiErrorMessage(requestError)}
            />
          ) : (
            <div className="panel-stack">
              <div className={`notice notice-${requestStatusTone}`}>
                <strong>{getRequestStatusTitle(requestStatus)}</strong>
                <p>{requestStatusMessage}</p>
              </div>

              <div className="approval-code-card">
                <span className="stat-label">Approval code</span>
                <div className="approval-code">{pendingRequest.approvalCode}</div>
                <p className="approval-copy">
                  Enter or approve this code from the host-admin UI running on
                  <code> localhost </code>.
                </p>
              </div>

              <div className="detail-grid">
                <article className="detail-card">
                  <span className="detail-label">Suggested name</span>
                  <strong>
                    {requestStatusQuery.data?.friendlyName ??
                      requestStatusQuery.data?.suggestedName ??
                      pendingRequest.suggestedName}
                  </strong>
                  <p>{requestStatus === "APPROVED" ? "Approved browser label" : "Submitted browser label"}</p>
                </article>

                <article className="detail-card">
                  <span className="detail-label">Current status</span>
                  <strong>{requestStatus}</strong>
                  <p>
                    {requestStatusQuery.data?.role
                      ? `Assigned role: ${requestStatusQuery.data.role}`
                      : "Role arrives after approval"}
                  </p>
                </article>
              </div>

              {requestStatus === "APPROVED" ? (
                <div className="panel-section">
                  <h3>Approval detected</h3>
                  <p>
                    The startup screen is exchanging this approved browser request for a
                    real device session now.
                  </p>
                  {completeRequestMutation.isPending ? (
                    <span className="pill pill-success">Finalizing browser access</span>
                  ) : null}
                  {completionError ? (
                    <div className="notice notice-danger">
                      <strong>Finalization failed</strong>
                      <p>{getApiErrorMessage(completionError)}</p>
                    </div>
                  ) : null}
                  {completionError && !completeRequestMutation.isPending ? (
                    <button className="button" type="button" onClick={handleRetryCompletion}>
                      Retry completion
                    </button>
                  ) : null}
                </div>
              ) : null}

              {requestStatus === "REJECTED" ? (
                <div className="panel-section">
                  <h3>Request rejected</h3>
                  <p>
                    The host admin decided not to approve this browser request. You can
                    clear it and submit a new one.
                  </p>
                </div>
              ) : null}

              {requestStatusQuery.error &&
              !isApiErrorCode(requestStatusQuery.error, "WEB_ACCESS_REQUEST_NOT_FOUND") ? (
                <div className="notice notice-danger">
                  <strong>Status check failed</strong>
                  <p>{getApiErrorMessage(requestStatusQuery.error)}</p>
                </div>
              ) : null}

              <button
                className="button button-ghost"
                type="button"
                onClick={handleStartOver}
                disabled={completeRequestMutation.isPending}
              >
                {requestStatus === "REJECTED" ? "Request new access code" : "Clear this request"}
              </button>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function normalizeClientSession(session) {
  return {
    authenticated: true,
    deviceId: session.deviceId,
    role: session.role,
    deviceType: session.deviceType ?? "WEB_BROWSER",
    friendlyName: session.friendlyName,
    accessToken: session.accessToken,
    accessTokenExpiresAt: session.accessTokenExpiresAt,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt
  };
}

function getRequestStatusTone(status) {
  if (status === "APPROVED") {
    return "success";
  }

  if (status === "REJECTED") {
    return "danger";
  }

  return "warning";
}

function getRequestStatusTitle(status) {
  if (status === "APPROVED") {
    return "Access approved";
  }

  if (status === "REJECTED") {
    return "Access rejected";
  }

  return "Waiting for approval";
}

function getRequestStatusMessage(status) {
  if (status === "APPROVED") {
    return "The host admin approved this browser request and the startup screen is now completing device activation.";
  }

  if (status === "REJECTED") {
    return "The host admin rejected this browser request, so it cannot exchange into device credentials.";
  }

  return "The host-only admin UI can review this request code and decide whether to approve the browser as an admin or editor device.";
}
