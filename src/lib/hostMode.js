export const HOST_MODES = {
  HOST_ADMIN: "host-admin",
  CLIENT: "client"
};

export function detectHostMode(locationLike) {
  const hostname = locationLike?.hostname ?? "";

  if (isLoopbackHostname(hostname)) {
    return HOST_MODES.HOST_ADMIN;
  }

  return HOST_MODES.CLIENT;
}

function isLoopbackHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}
