export function ClientPlaceholderPage() {
  return (
    <main className="page-shell">
      <section className="page-grid">
        <div className="hero-panel">
          <span className="eyebrow">Regular Client Host</span>
          <h1>Inventory routes land here next.</h1>
          <p className="hero-copy">
            This first slice focuses on the host-only admin entry flow. Open the app on
            <code> localhost </code>
            to complete onboarding or sign into the admin workspace.
          </p>
          <div className="hero-actions">
            <div className="stat-card">
              <span className="stat-label">Current slice</span>
              <strong>Host admin onboarding and sign-in</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Next likely slice</span>
              <strong>Web access request startup screen or inventory list</strong>
            </div>
          </div>
        </div>

        <aside className="side-panel">
          <div className="panel-section">
            <h2>Host detection</h2>
            <p>
              The frontend follows the architecture doc: <code>localhost</code> shows
              host-admin UI, while LAN hosts will show the regular client experience.
            </p>
          </div>

          <div className="panel-section">
            <h2>Why this page exists</h2>
            <p>
              The regular inventory routes are intentionally not scaffolded yet because we
              are building one feature at a time and stopping for validation after each
              completed slice.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
