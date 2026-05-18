import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cancelAdminMobilePairing,
  createAdminMobilePairing,
  finalizeAdminMobilePairing,
  getAdminMobilePairings
} from "../api";
import {
  getApiErrorMessage,
  isApiErrorStatus
} from "../../../lib/api";
import {
  adminMobilePairingCreateSchema,
  adminMobilePairingFinalizeSchema
} from "../../../validation/hostAdminSchemas";

const PAIRINGS_QUERY_KEY = ["admin-mobile-pairings"];

export function HostAdminMobilePairingSection({ setFlash, onUnauthorized }) {
  const queryClient = useQueryClient();
  const [createError, setCreateError] = useState(null);
  const [actionState, setActionState] = useState({
    pairingId: null,
    type: null,
    error: null
  });

  const pairingsQuery = useQuery({
    queryKey: PAIRINGS_QUERY_KEY,
    queryFn: getAdminMobilePairings,
    retry: false,
    refetchInterval: 5000
  });

  const createMutation = useMutation({
    mutationFn: createAdminMobilePairing,
    onSuccess: async () => {
      setCreateError(null);
      setFlash({
        tone: "success",
        title: "Pairing QR ready",
        message: "A new iPhone pairing session is live and ready to scan."
      });
      await queryClient.invalidateQueries({ queryKey: PAIRINGS_QUERY_KEY });
    }
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ pairingId, payload }) => finalizeAdminMobilePairing(pairingId, payload),
    onSuccess: async (updatedPairing) => {
      setActionState({ pairingId: null, type: null, error: null });
      setFlash({
        tone: "success",
        title: "iPhone paired",
        message: `${updatedPairing.friendlyName} is now active as ${updatedPairing.role}.`
      });
      await queryClient.invalidateQueries({ queryKey: PAIRINGS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["admin-devices"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelAdminMobilePairing,
    onSuccess: async () => {
      setActionState({ pairingId: null, type: null, error: null });
      setFlash({
        tone: "warning",
        title: "Pairing cancelled",
        message: "The selected mobile pairing session can no longer be scanned or finalized."
      });
      await queryClient.invalidateQueries({ queryKey: PAIRINGS_QUERY_KEY });
    }
  });

  useEffect(() => {
    if (!isApiErrorStatus(pairingsQuery.error, 401)) {
      return;
    }

    onUnauthorized?.();
  }, [onUnauthorized, pairingsQuery.error]);

  const pairings = pairingsQuery.data ?? [];
  const activePairings = pairings.filter(
    (pairing) => pairing.status === "GENERATED" || pairing.status === "SCANNED"
  );
  const scannedPairings = pairings.filter((pairing) => pairing.status === "SCANNED");
  const completedPairings = pairings.filter((pairing) => pairing.status === "COMPLETED");
  const pairingsError =
    pairingsQuery.error && !isApiErrorStatus(pairingsQuery.error, 401)
      ? pairingsQuery.error
      : null;

  async function handleCreate(values) {
    setFlash(null);
    setCreateError(null);

    try {
      await createMutation.mutateAsync(values);
    } catch (error) {
      setCreateError(error);
    }
  }

  async function handleFinalize(pairingId, payload) {
    setFlash(null);
    setActionState({ pairingId, type: "finalize", error: null });

    try {
      await finalizeMutation.mutateAsync({ pairingId, payload });
    } catch (error) {
      setActionState({ pairingId, type: "finalize", error });
    }
  }

  async function handleCancel(pairingId) {
    setFlash(null);
    setActionState({ pairingId, type: "cancel", error: null });

    try {
      await cancelMutation.mutateAsync(pairingId);
    } catch (error) {
      setActionState({ pairingId, type: "cancel", error });
    }
  }

  return (
    <section className="panel-section workspace-section">
      <div className="section-header">
        <div>
          <h2>Mobile pairing studio</h2>
          <p>
            Generate short-lived iPhone pairing sessions, wait for the phone to scan the
            QR, then finalize the friendly name once its metadata arrives.
          </p>
        </div>
        {pairingsQuery.isFetching ? <span className="pill">Refreshing pairings</span> : null}
      </div>

      <div className="workspace-stat-grid">
        <article className="detail-card">
          <span className="detail-label">Open pairings</span>
          <strong>{activePairings.length}</strong>
          <p>Generated or scanned sessions still in progress</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Scanned now</span>
          <strong>{scannedPairings.length}</strong>
          <p>iPhones waiting for a final friendly name</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Completed</span>
          <strong>{completedPairings.length}</strong>
          <p>Paired mobile devices already activated</p>
        </article>
      </div>

      {pairingsError ? (
        <div className="notice notice-danger">
          <strong>Mobile pairing load failed</strong>
          <p>{getApiErrorMessage(pairingsError, "The app could not load the mobile pairing sessions.")}</p>
        </div>
      ) : null}

      <div className="pairing-stack">
        <CreateMobilePairingCard
          onSubmit={handleCreate}
          isPending={createMutation.isPending}
          errorMessage={getApiErrorMessage(createError)}
          scannedCount={scannedPairings.length}
        />

        <div className="section-header">
          <div>
            <h3>Recent mobile pairing sessions</h3>
            <p>
              Generated sessions show their QR code, scanned sessions expose finalization,
              and completed sessions keep the paired device details visible.
            </p>
          </div>
        </div>

        {pairings.length > 0 ? (
          pairings.map((pairing) => (
            <MobilePairingCard
              key={pairing.pairingId}
              pairing={pairing}
              isFinalizing={
                finalizeMutation.isPending && actionState.pairingId === pairing.pairingId
              }
              isCancelling={
                cancelMutation.isPending && actionState.pairingId === pairing.pairingId
              }
              errorMessage={
                actionState.pairingId === pairing.pairingId
                  ? getApiErrorMessage(actionState.error)
                  : ""
              }
              onFinalize={handleFinalize}
              onCancel={handleCancel}
            />
          ))
        ) : (
          <div className="empty-state-card">
            <strong>No mobile pairings yet</strong>
            <p>
              Create the first short-lived QR pairing session here when you are ready to
              onboard an iPhone into this installation.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CreateMobilePairingCard({ onSubmit, isPending, errorMessage, scannedCount }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminMobilePairingCreateSchema),
    defaultValues: {
      role: "EDITOR"
    }
  });

  return (
    <article className="pairing-card pairing-create-card">
      <div className="section-header">
        <div>
          <h3>Start a new iPhone pairing</h3>
          <p>
            The backend issues a 15-minute pairing token and QR deep link, which the iPhone
            app can scan to send its device metadata back into this queue.
          </p>
        </div>
        <span className="pill">
          {scannedCount > 0
            ? `${scannedCount} scanned waiting finalization`
            : "No scanned phones waiting"}
        </span>
      </div>

      <form className="request-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <label className="field">
          <span className="field-label">Device role</span>
          <select
            {...register("role")}
            className={`field-input ${errors.role ? "field-input-error" : ""}`}
            disabled={isPending}
          >
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          {errors.role ? <span className="field-error">{errors.role.message}</span> : null}
        </label>

        {errorMessage ? (
          <div className="notice notice-danger">
            <strong>Pairing creation failed</strong>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div className="request-action-row">
          <button className="button" type="submit" disabled={isPending}>
            {isPending ? "Generating QR..." : "Generate iPhone pairing"}
          </button>
        </div>
      </form>
    </article>
  );
}

function MobilePairingCard({
  pairing,
  isFinalizing,
  isCancelling,
  errorMessage,
  onFinalize,
  onCancel
}) {
  const isExpired = isPairingExpired(pairing.expiresAt);
  const canCancel = pairing.status !== "COMPLETED" && pairing.status !== "CANCELLED";

  return (
    <article className={`pairing-card ${isExpired && canCancel ? "pairing-card-expired" : ""}`}>
      <div className="request-header">
        <div>
          <h3>{resolvePairingTitle(pairing)}</h3>
          <p className="request-subcopy">
            Created {formatDateTime(pairing.createdAt)}
          </p>
        </div>
        <StatusBadge status={pairing.status} />
      </div>

      <div className="pairing-meta-grid">
        <article className="detail-card">
          <span className="detail-label">Role</span>
          <strong>{pairing.role}</strong>
          <p>Assigned when the device is activated</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Expires</span>
          <strong>{formatDateTime(pairing.expiresAt)}</strong>
          <p>{isExpired ? "This pairing session has expired." : "This QR is still usable."}</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Pairing id</span>
          <strong className="detail-strong-compact">{pairing.pairingId}</strong>
          <p>Recent sessions remain visible for audit and retry context</p>
        </article>
      </div>

      {pairing.status !== "COMPLETED" && pairing.status !== "CANCELLED" ? (
        <div className="pairing-qr-layout">
          <div className="pairing-qr-shell">
            <PairingQrPreview value={pairing.qrUrl} label={resolvePairingTitle(pairing)} />
          </div>

          <div className="pairing-qr-copy">
            <div className="detail-label">QR payload</div>
            <p className="pairing-deeplink">{pairing.qrUrl}</p>
            <p className="request-subcopy">
              The phone app scans this QR deep link, then posts its metadata so this card
              can move from <code>GENERATED</code> to <code>SCANNED</code>.
            </p>
          </div>
        </div>
      ) : null}

      {pairing.status === "GENERATED" ? (
        <div className="notice notice-muted">
          <strong>Waiting for scan</strong>
          <p>
            The iPhone has not scanned this QR yet. Once it does, this card will refresh
            with the detected device name and finalization form.
          </p>
        </div>
      ) : null}

      {pairing.status === "SCANNED" ? (
        <ScannedMobilePairingDetails
          pairing={pairing}
          isExpired={isExpired}
          isFinalizing={isFinalizing}
          onFinalize={onFinalize}
        />
      ) : null}

      {pairing.status === "COMPLETED" ? (
        <div className="detail-grid">
          <article className="detail-card">
            <span className="detail-label">Friendly name</span>
            <strong>{pairing.friendlyName}</strong>
            <p>Completed {formatDateTime(pairing.completedAt)}</p>
          </article>

          <article className="detail-card">
            <span className="detail-label">Registered device</span>
            <strong className="detail-strong-compact">{pairing.registeredDeviceId}</strong>
            <p>
              {pairing.modelName
                ? `${pairing.modelName} on ${pairing.platformName}`
                : pairing.platformName ?? "Device metadata available"}
            </p>
          </article>
        </div>
      ) : null}

      {pairing.status === "CANCELLED" ? (
        <div className="notice notice-muted">
          <strong>Pairing cancelled</strong>
          <p>
            This QR session was intentionally cancelled and will no longer work if someone
            tries to scan it again.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="notice notice-danger">
          <strong>Pairing action failed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {canCancel ? (
        <div className="request-action-row">
          <button
            className="button button-ghost"
            type="button"
            onClick={() => onCancel(pairing.pairingId)}
            disabled={isFinalizing || isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel pairing"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function ScannedMobilePairingDetails({ pairing, isExpired, isFinalizing, onFinalize }) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminMobilePairingFinalizeSchema),
    defaultValues: {
      friendlyName: pairing.suggestedName ?? pairing.modelName ?? ""
    }
  });

  async function submitForm(values) {
    await onFinalize(pairing.pairingId, values);
  }

  return (
    <>
      <div className="pairing-meta-grid">
        <article className="detail-card">
          <span className="detail-label">Suggested name</span>
          <strong>{pairing.suggestedName ?? "Unknown"}</strong>
          <p>Scanned {formatDateTime(pairing.scannedAt)}</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Platform</span>
          <strong>{pairing.platformName ?? "Unknown"}</strong>
          <p>{pairing.platformVersion ?? "Version unavailable"}</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Model</span>
          <strong>{pairing.modelName ?? "Unknown"}</strong>
          <p>Review the final friendly name before activation</p>
        </article>
      </div>

      {isExpired ? (
        <div className="notice notice-warning">
          <strong>Pairing expired before finalization</strong>
          <p>
            This phone did scan the QR, but the session expired before activation. Cancel it
            and generate a fresh pairing when the device is ready again.
          </p>
        </div>
      ) : (
        <form className="request-form" onSubmit={handleSubmit(submitForm)} noValidate>
          <label className="field">
            <span className="field-label">Final friendly name</span>
            <input
              {...register("friendlyName")}
              className={`field-input ${errors.friendlyName ? "field-input-error" : ""}`}
              type="text"
              autoComplete="off"
              disabled={isFinalizing}
              placeholder={pairing.suggestedName ?? pairing.modelName ?? "iPhone"}
            />
            {errors.friendlyName ? (
              <span className="field-error">{errors.friendlyName.message}</span>
            ) : null}
          </label>

          <div className="request-action-row">
            <button className="button" type="submit" disabled={isFinalizing}>
              {isFinalizing ? "Finalizing..." : "Finalize iPhone"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function PairingQrPreview({ value, label }) {
  const [dataUrl, setDataUrl] = useState("");
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let active = true;

    if (!value) {
      setDataUrl("");
      setRenderError("");
      return undefined;
    }

    setRenderError("");

    QRCode.toDataURL(value, {
      margin: 1,
      width: 280,
      color: {
        dark: "#2f211b",
        light: "#fff9f2"
      }
    })
      .then((url) => {
        if (!active) {
          return;
        }

        setDataUrl(url);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setRenderError(error?.message ?? "Could not render the QR preview.");
      });

    return () => {
      active = false;
    };
  }, [value]);

  if (renderError) {
    return (
      <div className="notice notice-warning">
        <strong>QR preview unavailable</strong>
        <p>{renderError}</p>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className="pairing-qr-placeholder">
        <span>Preparing QR</span>
      </div>
    );
  }

  return <img className="pairing-qr-image" src={dataUrl} alt={`QR code for ${label}`} />;
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}

function resolvePairingTitle(pairing) {
  return pairing.friendlyName ?? pairing.suggestedName ?? "Unscanned iPhone pairing";
}

function isPairingExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString();
}
