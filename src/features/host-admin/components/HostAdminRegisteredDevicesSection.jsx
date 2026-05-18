import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getAdminDevices,
  revokeAdminDevice,
  updateAdminDeviceRole
} from "../api";
import {
  getApiErrorMessage,
  isApiErrorStatus
} from "../../../lib/api";
import { adminDeviceRoleUpdateSchema } from "../../../validation/hostAdminSchemas";

const DEVICES_QUERY_KEY = ["admin-devices"];

export function HostAdminRegisteredDevicesSection({ setFlash, onUnauthorized }) {
  const queryClient = useQueryClient();
  const [actionState, setActionState] = useState({
    deviceId: null,
    type: null,
    error: null
  });

  const devicesQuery = useQuery({
    queryKey: DEVICES_QUERY_KEY,
    queryFn: getAdminDevices,
    retry: false,
    refetchInterval: 5000
  });

  const roleMutation = useMutation({
    mutationFn: ({ deviceId, payload }) => updateAdminDeviceRole(deviceId, payload),
    onSuccess: async (updatedDevice) => {
      setActionState({ deviceId: null, type: null, error: null });
      setFlash({
        tone: "success",
        title: "Role updated",
        message: `${updatedDevice.friendlyName} is now ${updatedDevice.role}.`
      });
      await queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    }
  });

  const revokeMutation = useMutation({
    mutationFn: revokeAdminDevice,
    onSuccess: async (updatedDevice) => {
      setActionState({ deviceId: null, type: null, error: null });
      setFlash({
        tone: "warning",
        title: "Device revoked",
        message: `${updatedDevice.friendlyName} was revoked and its sessions were closed.`
      });
      await queryClient.invalidateQueries({ queryKey: DEVICES_QUERY_KEY });
    }
  });

  useEffect(() => {
    if (!isApiErrorStatus(devicesQuery.error, 401)) {
      return;
    }

    onUnauthorized?.();
  }, [devicesQuery.error, onUnauthorized]);

  const devices = devicesQuery.data ?? [];
  const activeDevices = devices.filter((device) => device.status === "ACTIVE");
  const revokedDevices = devices.filter((device) => device.status === "REVOKED");
  const browserDevices = devices.filter((device) => device.deviceType === "WEB_BROWSER");
  const mobileDevices = devices.filter((device) => device.deviceType === "IOS_APP");
  const devicesError =
    devicesQuery.error && !isApiErrorStatus(devicesQuery.error, 401)
      ? devicesQuery.error
      : null;

  async function handleRoleUpdate(deviceId, payload) {
    setFlash(null);
    setActionState({ deviceId, type: "role", error: null });

    try {
      await roleMutation.mutateAsync({ deviceId, payload });
    } catch (error) {
      setActionState({ deviceId, type: "role", error });
    }
  }

  async function handleRevoke(deviceId) {
    setFlash(null);
    setActionState({ deviceId, type: "revoke", error: null });

    try {
      await revokeMutation.mutateAsync(deviceId);
    } catch (error) {
      setActionState({ deviceId, type: "revoke", error });
    }
  }

  return (
    <section className="panel-section workspace-section">
      <div className="section-header">
        <div>
          <h2>Registered devices</h2>
          <p>
            Review every approved browser and paired iPhone, adjust the stored role for
            active devices, and revoke devices that should no longer access the app.
          </p>
        </div>
        {devicesQuery.isFetching ? <span className="pill">Refreshing devices</span> : null}
      </div>

      <div className="device-stat-grid">
        <article className="detail-card">
          <span className="detail-label">Active</span>
          <strong>{activeDevices.length}</strong>
          <p>Devices that can still access the inventory app</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Revoked</span>
          <strong>{revokedDevices.length}</strong>
          <p>Devices that the host admin has disabled</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Browsers</span>
          <strong>{browserDevices.length}</strong>
          <p>Approved LAN browser devices</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">iPhones</span>
          <strong>{mobileDevices.length}</strong>
          <p>Paired mobile devices from the QR flow</p>
        </article>
      </div>

      {devicesError ? (
        <div className="notice notice-danger">
          <strong>Device list failed</strong>
          <p>{getApiErrorMessage(devicesError, "The app could not load the registered devices.")}</p>
        </div>
      ) : null}

      <div className="pairing-stack">
        {devices.length > 0 ? (
          devices.map((device) => (
            <RegisteredDeviceCard
              key={device.deviceId}
              device={device}
              isUpdatingRole={
                roleMutation.isPending && actionState.deviceId === device.deviceId
              }
              isRevoking={
                revokeMutation.isPending && actionState.deviceId === device.deviceId
              }
              errorMessage={
                actionState.deviceId === device.deviceId
                  ? getApiErrorMessage(actionState.error)
                  : ""
              }
              onRoleUpdate={handleRoleUpdate}
              onRevoke={handleRevoke}
            />
          ))
        ) : (
          <div className="empty-state-card">
            <strong>No registered devices yet</strong>
            <p>
              Devices approved from the browser queue or completed through the iPhone QR
              pairing flow will appear here once they become real registered devices.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function RegisteredDeviceCard({
  device,
  isUpdatingRole,
  isRevoking,
  errorMessage,
  onRoleUpdate,
  onRevoke
}) {
  const isRevoked = device.status === "REVOKED";

  return (
    <article className={`pairing-card ${isRevoked ? "device-card-revoked" : ""}`}>
      <div className="request-header">
        <div>
          <h3>{device.friendlyName}</h3>
          <p className="request-subcopy">
            {formatDeviceType(device.deviceType)} registered {formatDateTime(device.createdAt)}
          </p>
        </div>
        <StatusBadge status={device.status} />
      </div>

      <div className="device-meta-grid">
        <article className="detail-card">
          <span className="detail-label">Role</span>
          <strong>{device.role}</strong>
          <p>{isRevoked ? "Role is frozen on revoked devices" : "Can be changed while active"}</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Suggested name</span>
          <strong>{device.suggestedName ?? "Unknown"}</strong>
          <p>Original approval or pairing suggestion</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Platform</span>
          <strong>{device.platformName ?? "Unknown"}</strong>
          <p>{device.platformVersion ?? "Version unavailable"}</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Client</span>
          <strong>{describeClient(device)}</strong>
          <p>Stored device-specific metadata</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Last seen</span>
          <strong>{formatDateTime(device.lastSeenAt)}</strong>
          <p>Copied from the registered device record</p>
        </article>

        <article className="detail-card">
          <span className="detail-label">Device id</span>
          <strong className="detail-strong-compact">{device.deviceId}</strong>
          <p>Use this as the host-admin reference for audits</p>
        </article>
      </div>

      {isRevoked ? (
        <div className="notice notice-muted">
          <strong>Device revoked</strong>
          <p>
            Revoked {formatDateTime(device.revokedAt)}. Any active backend sessions for this
            device were revoked at the same time.
          </p>
        </div>
      ) : (
        <ActiveRegisteredDeviceActions
          device={device}
          isUpdatingRole={isUpdatingRole}
          isRevoking={isRevoking}
          onRoleUpdate={onRoleUpdate}
          onRevoke={onRevoke}
        />
      )}

      {errorMessage ? (
        <div className="notice notice-danger">
          <strong>Device action failed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}
    </article>
  );
}

function ActiveRegisteredDeviceActions({
  device,
  isUpdatingRole,
  isRevoking,
  onRoleUpdate,
  onRevoke
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminDeviceRoleUpdateSchema),
    defaultValues: {
      role: device.role
    }
  });

  async function submitForm(values) {
    await onRoleUpdate(device.deviceId, values);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit(submitForm)} noValidate>
      <label className="field">
        <span className="field-label">Change stored role</span>
        <select
          {...register("role")}
          className={`field-input ${errors.role ? "field-input-error" : ""}`}
          disabled={isUpdatingRole || isRevoking}
        >
          <option value="EDITOR">EDITOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        {errors.role ? <span className="field-error">{errors.role.message}</span> : null}
      </label>

      <div className="request-action-row">
        <button className="button" type="submit" disabled={isUpdatingRole || isRevoking}>
          {isUpdatingRole ? "Updating role..." : "Update role"}
        </button>

        <button
          className="button button-ghost"
          type="button"
          onClick={() => onRevoke(device.deviceId)}
          disabled={isUpdatingRole || isRevoking}
        >
          {isRevoking ? "Revoking..." : "Revoke device"}
        </button>
      </div>
    </form>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}

function formatDeviceType(deviceType) {
  if (deviceType === "WEB_BROWSER") {
    return "Browser device";
  }

  if (deviceType === "IOS_APP") {
    return "iPhone device";
  }

  return deviceType;
}

function describeClient(device) {
  if (device.deviceType === "WEB_BROWSER") {
    return device.browserName
      ? `${device.browserName}${device.browserVersion ? ` ${device.browserVersion}` : ""}`
      : "Browser unavailable";
  }

  return device.modelName ?? "Model unavailable";
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString();
}
