export function ClientPlaceholderPage({
  session,
  flash,
  errorMessage,
  onLogout,
  logoutPending
}) {
  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="hero-panel">
          <span className="eyebrow">Approved Browser</span>
          <h1>This browser is ready for the inventory routes.</h1>
          <p className="hero-copy">
            The browser startup flow is complete for this device profile. The refresh
            cookie can rehydrate a new access token on future visits, while the current
            access token stays in memory only.
          </p>
          <div className="hero-actions">
            <div className="stat-card">
              <span className="stat-label">Approved role</span>
              <strong>{session.role}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Registered browser</span>
              <strong>{session.friendlyName}</strong>
            </div>
          </div>
          <div className="timeline-card">
            <div className="timeline-step">
              <span className="timeline-index">01</span>
              <div>
                <h2>Browser access is now trusted</h2>
                <p>The host-admin approval created a registered device and an active refresh session.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">02</span>
              <div>
                <h2>Future visits can refresh into memory</h2>
                <p>The browser can exchange its refresh cookie for a fresh in-memory access token on load.</p>
              </div>
            </div>
            <div className="timeline-step">
              <span className="timeline-index">03</span>
              <div>
                <h2>Inventory screens plug in next</h2>
                <p>This approved-device placeholder is the handoff point for list, detail, and editing routes.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <header className="panel-header">
            <div>
              <span className="eyebrow eyebrow-soft">Approved Session</span>
              <h2>Client device state</h2>
            </div>
            <span className="pill pill-success">Authenticated</span>
          </header>

          {flash ? (
            <div className={`notice notice-${flash.tone}`}>
              <strong>{flash.title}</strong>
              <p>{flash.message}</p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="notice notice-danger">
              <strong>Client action failed</strong>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          <div className="panel-stack">
            <div className="session-card">
              <h3>{session.friendlyName}</h3>
              <p>
                This browser is registered as a <strong>{session.role}</strong> device and
                is ready for the inventory application branch.
              </p>
            </div>

            <div className="detail-grid">
              <article className="detail-card">
                <span className="detail-label">Device type</span>
                <strong>{session.deviceType}</strong>
                <p>Approved desktop browser profile</p>
              </article>

              <article className="detail-card">
                <span className="detail-label">Device id</span>
                <strong className="detail-strong-compact">{session.deviceId}</strong>
                <p>Backend registered device identifier</p>
              </article>
            </div>

            <div className="detail-grid">
              <article className="detail-card">
                <span className="detail-label">Access token expires</span>
                <strong>{formatDateTime(session.accessTokenExpiresAt)}</strong>
                <p>Kept in memory only</p>
              </article>

              <article className="detail-card">
                <span className="detail-label">Refresh session expires</span>
                <strong>{formatDateTime(session.refreshTokenExpiresAt)}</strong>
                <p>Restored from the browser refresh cookie</p>
              </article>
            </div>

            <div className="panel-section">
              <h2>Next feature boundary</h2>
              <p>
                The browser approval flow is implemented end-to-end. Inventory list, item
                detail, and editing routes should now build on top of this approved client
                session.
              </p>
            </div>

            <button
              className="button button-secondary"
              type="button"
              onClick={onLogout}
              disabled={logoutPending}
            >
              {logoutPending ? "Signing out browser..." : "Sign out this browser"}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString();
}
