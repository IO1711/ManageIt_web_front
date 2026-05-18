import { ClientDeviceStartupPage } from "./client/ClientDeviceStartupPage";
import { HostAdminEntryPage } from "./host-admin/HostAdminEntryPage";
import { detectHostMode, HOST_MODES } from "../lib/hostMode";

export function RootRoute() {
  const hostMode = detectHostMode(window.location);

  if (hostMode === HOST_MODES.HOST_ADMIN) {
    return <HostAdminEntryPage />;
  }

  return <ClientDeviceStartupPage />;
}
