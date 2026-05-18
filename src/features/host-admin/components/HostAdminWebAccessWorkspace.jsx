import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  approveAdminWebAccessRequest,
  getAdminWebAccessRequests,
  rejectAdminWebAccessRequest
} from "../api";
import {
  getApiErrorMessage,
  isApiErrorStatus
} from "../../../lib/api";
import { adminWebAccessApprovalSchema } from "../../../validation/hostAdminSchemas";
import { HostAdminMobilePairingSection } from "./HostAdminMobilePairingSection";
import { HostAdminRegisteredDevicesSection } from "./HostAdminRegisteredDevicesSection";

const REQUESTS_QUERY_KEY = ["admin-web-access-requests"];

export function HostAdminWebAccessWorkspace({
  session,
  flash,
  setFlash,
  onLogout,
  logoutPending
}) {
  const queryClient = useQueryClient();
  const [actionState, setActionState] = useState({
    requestId: null,
    type: null,
    error: null
  });

  const requestsQuery = useQuery({
    queryKey: REQUESTS_QUERY_KEY,
    queryFn: getAdminWebAccessRequests,
    retry: false,
    refetchInterval: 5000
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, payload }) => approveAdminWebAccessRequest(requestId, payload),
    onSuccess: async (updatedRequest) => {
      setActionState({ requestId: null, type: null, error: null });
      setFlash({
        tone: "success",
        title: "Browser approved",
        message: `${updatedRequest.friendlyName} is now approved as ${updatedRequest.role}.`
      });
      await queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["admin-devices"] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId) => rejectAdminWebAccessRequest(requestId),
    onSuccess: async (updatedRequest) => {
      setActionState({ requestId: null, type: null, error: null });
      setFlash({
        tone: "warning",
        title: "Browser rejected",
        message: `${updatedRequest.suggestedName} was rejected and can no longer complete its approval flow.`
      });
      await queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
    }
  });

  useEffect(() => {
    if (!isApiErrorStatus(requestsQuery.error, 401)) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["host-admin-session"] });
  }, [queryClient, requestsQuery.error]);

  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests.filter((request) => request.status === "PENDING");
  const processedRequests = requests.filter((request) => request.status !== "PENDING");
  const isMutating = approveMutation.isPending || rejectMutation.isPending;
  const requestListError =
    requestsQuery.error && !isApiErrorStatus(requestsQuery.error, 401)
      ? requestsQuery.error
      : null;

  async function handleApprove(requestId, payload) {
    setFlash(null);
    setActionState({ requestId, type: "approve", error: null });

    try {
      await approveMutation.mutateAsync({ requestId, payload });
    } catch (error) {
      setActionState({ requestId, type: "approve", error });
    }
  }

  async function handleReject(requestId) {
    setFlash(null);
    setActionState({ requestId, type: "reject", error: null });

    try {
      await rejectMutation.mutateAsync(requestId);
    } catch (error) {
      setActionState({ requestId, type: "reject", error });
    }
  }

  function handleUnauthorized() {
    queryClient.invalidateQueries({ queryKey: ["host-admin-session"] });
  }

  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="hero-panel">
          <span className="eyebrow">Host Admin Mode</span>
          <h1>Approve the browsers waiting to join this installation.</h1>
          <p className="hero-copy">
            The host-only admin UI now reviews the pending web access requests created by
            LAN browsers. Approving a request assigns the device role, resolves its final
            friendly name, and lets that browser complete into a real device session.
          </p>

          <div className="hero-actions">
            <div className="stat-card">
              <span className="stat-label">Pending approvals</span>
              <strong>{pendingRequests.length}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Processed requests</span>
              <strong>{processedRequests.length}</strong>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-step">
              <span className="timeline-index">01</span>
              <div>
                <h2>Review the browser request</h2>
                <p>See the approval code, suggested name, and reported platform/browser metadata.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">02</span>
              <div>
                <h2>Choose role and friendly name</h2>
                <p>Approve the browser as an <code>ADMIN</code> or <code>EDITOR</code> device, or reject it.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">03</span>
              <div>
                <h2>Let the browser finish activation</h2>
                <p>The approved browser can then exchange its pending request into a refresh cookie and in-memory access token.</p>
              </div>
            </div>
          </div>

          <section className="panel-section">
            <div className="section-header">
              <div>
                <h2>Pending browser approvals</h2>
                <p>Newest requests appear first and refresh automatically while this workspace is open.</p>
              </div>
              {requestsQuery.isFetching ? <span className="pill">Refreshing queue</span> : null}
            </div>

            {requestListError ? (
              <div className="notice notice-danger">
                <strong>Queue load failed</strong>
                <p>{getApiErrorMessage(requestListError, "The app could not load the browser approval queue.")}</p>
              </div>
            ) : null}

            <div className="request-stack">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((request) => (
                  <PendingWebAccessRequestCard
                    key={request.requestId}
                    request={request}
                    isMutating={isMutating}
                    isApproving={
                      approveMutation.isPending && actionState.requestId === request.requestId
                    }
                    isRejecting={
                      rejectMutation.isPending && actionState.requestId === request.requestId
                    }
                    errorMessage={
                      actionState.requestId === request.requestId
                        ? getApiErrorMessage(actionState.error)
                        : ""
                    }
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              ) : (
                <div className="empty-state-card">
                  <strong>No pending browser requests</strong>
                  <p>
                    When a LAN browser requests access, it will appear here with its approval
                    code and metadata so you can decide how to register it.
                  </p>
                </div>
              )}
            </div>
          </section>

          <HostAdminMobilePairingSection
            setFlash={setFlash}
            onUnauthorized={handleUnauthorized}
          />

          <HostAdminRegisteredDevicesSection
            setFlash={setFlash}
            onUnauthorized={handleUnauthorized}
          />
        </div>

        <aside className="side-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow eyebrow-soft">Host Workspace</span>
              <h2>{session.organizationName}</h2>
            </div>
            <span className="pill pill-success">Authenticated</span>
          </header>

          {flash ? (
            <div className={`notice notice-${flash.tone}`}>
              <strong>{flash.title}</strong>
              <p>{flash.message}</p>
            </div>
          ) : null}

          <div className="session-card">
            <h3>Active host-admin session</h3>
            <p>
              This session can approve browser access requests, pair iPhones into registered
              devices, manage the registered-device list, and expand into more host-only
              settings workflows after that.
            </p>
          </div>

          <div className="detail-grid">
            <article className="detail-card">
              <span className="detail-label">Pending</span>
              <strong>{pendingRequests.length}</strong>
              <p>Browsers waiting for a decision</p>
            </article>

            <article className="detail-card">
              <span className="detail-label">Processed</span>
              <strong>{processedRequests.length}</strong>
              <p>Approved or rejected queue entries</p>
            </article>
          </div>

          <div className="panel-section">
            <div className="section-header">
              <div>
                <h2>Recent processed requests</h2>
                <p>Approved browsers show their assigned role and final name.</p>
              </div>
            </div>

            <div className="compact-request-stack">
              {processedRequests.length > 0 ? (
                processedRequests.map((request) => (
                  <article className="compact-request-card" key={request.requestId}>
                    <div className="request-header">
                      <div>
                        <h3>{request.friendlyName ?? request.suggestedName}</h3>
                        <p className="request-subcopy">
                          {request.browserName} on {request.platformName}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>

                    <div className="compact-request-meta">
                      <div>
                        <span className="detail-label">Approval code</span>
                        <strong>{request.approvalCode}</strong>
                      </div>
                      <div>
                        <span className="detail-label">Role</span>
                        <strong>{request.role ?? "Not assigned"}</strong>
                      </div>
                    </div>

                    <p className="request-subcopy">
                      Updated {formatDateTime(request.updatedAt)}
                    </p>
                  </article>
                ))
              ) : (
                <div className="empty-state-card empty-state-card-compact">
                  <strong>No processed requests yet</strong>
                  <p>Approved and rejected browser requests will collect here once you make decisions.</p>
                </div>
              )}
            </div>
          </div>

          <button
            className="button button-secondary"
            type="button"
            onClick={onLogout}
            disabled={logoutPending || isMutating}
          >
            {logoutPending ? "Signing out..." : "Sign out"}
          </button>
        </aside>
      </section>
    </main>
  );
}

function PendingWebAccessRequestCard({
  request,
  isMutating,
  isApproving,
  isRejecting,
  errorMessage,
  onApprove,
  onReject
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminWebAccessApprovalSchema),
    defaultValues: {
      role: "EDITOR",
      friendlyName: request.suggestedName ?? ""
    }
  });

  async function submitForm(values) {
    await onApprove(request.requestId, {
      role: values.role,
      friendlyName: values.friendlyName
    });
  }

  return (
    <article className="request-card">
      <div className="request-header">
        <div>
          <div className="approval-code-inline">{request.approvalCode}</div>
          <h3>{request.suggestedName}</h3>
          <p className="request-subcopy">
            Requested {formatDateTime(request.createdAt)}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="request-meta-grid">
        <article className="detail-card">
          <span className="detail-label">Platform</span>
          <strong>{request.platformName}</strong>
          <p>{request.platformVersion}</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Browser</span>
          <strong>{request.browserName}</strong>
          <p>{request.browserVersion}</p>
        </article>
      </div>

      <form className="request-form" onSubmit={handleSubmit(submitForm)} noValidate>
        <div className="detail-grid">
          <label className="field">
            <span className="field-label">Role</span>
            <select
              {...register("role")}
              className={`field-input ${errors.role ? "field-input-error" : ""}`}
              disabled={isMutating}
            >
              <option value="EDITOR">EDITOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            {errors.role ? <span className="field-error">{errors.role.message}</span> : null}
          </label>

          <label className="field">
            <span className="field-label">Friendly name</span>
            <input
              {...register("friendlyName")}
              className={`field-input ${errors.friendlyName ? "field-input-error" : ""}`}
              type="text"
              autoComplete="off"
              disabled={isMutating}
              placeholder={request.suggestedName}
            />
            {errors.friendlyName ? (
              <span className="field-error">{errors.friendlyName.message}</span>
            ) : null}
          </label>
        </div>

        {errorMessage ? (
          <div className="notice notice-danger">
            <strong>Request action failed</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div className="request-action-row">
          <button className="button" type="submit" disabled={isMutating}>
            {isApproving ? "Approving..." : "Approve browser"}
          </button>

          <button
            className="button button-ghost"
            type="button"
            disabled={isMutating}
            onClick={() => onReject(request.requestId)}
          >
            {isRejecting ? "Rejecting..." : "Reject request"}
          </button>
        </div>
      </form>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString();
}
