# Editor Web Features

## Pages

1. Request access screen.
2. Wait for approval / finalization screen.
3. Approved browser placeholder screen.

## Overall structure

- This is the non-`localhost` browser flow.
- It is the web front a LAN browser sees before and after device approval.
- Desktop layout is a 2-column split screen with a large left guidance panel and a narrower right task panel.
- Tablet and mobile collapse the 2 columns into one vertical stack.
- The current implementation does not yet include the real inventory editor pages.
- After approval, both `EDITOR` and `ADMIN` browsers land on the same placeholder screen. Only the displayed role changes.

## Screen 1: Request access

### What this screen is

- This is the first screen for a browser that is not yet approved.
- Its job is to collect a friendly device name and send browser metadata to the host.

### Main layout

- Left panel is an explainer panel.
- Right panel contains the working form.

### Left panel content

- Eyebrow label: `Regular Client Host`.
- Large headline explaining that this browser only needs to be registered once.
- Intro copy describing the flow: request access, wait for host-admin approval on `localhost`, then exchange approval into a real device session.
- Two stat cards: `Step one` and `Step two`.
- One 3-step timeline card with these steps: `Send browser metadata`, `Wait on the approval code`, `Finalize into a device session`.

### Right panel shell

- Eyebrow label for device startup.
- Title: `Browser access`.
- Optional loading pill while checking whether a previous browser session can be refreshed.
- Optional flash banner.
- Optional error banner if session refresh fails for reasons other than unauthenticated.

### Access request form

- Form title: `Request browser access`.
- One editable field: `Suggested device name`.
- One detected-details area under the field.
- Two detail cards in detected-details area: platform name/version and browser name/version.
- Primary action: `Request access`.
- Pending label: `Sending request...`.
- Inline validation under the name field when empty.
- Inline error banner when request creation fails.

### Default naming behavior

- The app auto-detects platform and browser from browser APIs.
- The default suggested name is built from that metadata.
- Typical patterns are `macOS Chrome`, `Windows Edge`, or `Linux Firefox`.
- If only one side is known, the default name falls back to that label only.
- If nothing useful is known, the fallback name is `Museum Browser`.

### Validation

- Suggested device name is required.
- Suggested device name is capped at 255 characters.

## Screen 2: Wait for approval / finalization

### What this screen is

- This is the waiting state after a request has been created.
- It must keep the approval code visible, poll for decision, and automatically finalize the browser once approved.

### Main layout

- Left explainer panel stays in place.
- Right task panel switches from form mode to status mode.

### Persistent elements

- Top status banner.
- Large approval code card.
- Two device summary cards.
- Bottom reset/clear action.

### Approval code card

- This is the visual center of the screen.
- It displays the approval code in large monospaced type.
- Supporting copy tells the user to use the host-admin UI on `localhost` to approve that code.

### Device summary cards

- One card shows submitted or approved device name.
- One card shows current request status.
- If backend already returned a role, the role is shown here.
- If role is not returned yet, the UI tells the user that role will arrive after approval.

### State A: `PENDING`

- Status banner uses waiting/warning styling.
- Message explains that host admin can approve the browser as `ADMIN` or `EDITOR`.
- The app polls status every 3 seconds.
- User can clear the request and start over.

### State B: `APPROVED`

- Status banner switches to success styling.
- A dedicated `Approval detected` panel appears.
- The UI starts completing activation automatically.
- While completion is running, show success pill: `Finalizing browser access`.
- If completion fails, show inline error banner and a `Retry completion` button.

### State C: `REJECTED`

- Status banner switches to danger styling.
- A rejection explanation panel appears.
- The bottom action label changes to `Request new access code`.
- User must clear and resubmit to continue.

### State D: saved request cannot be found

- If backend says the saved request does not exist anymore, clear local saved state automatically.
- Show warning banner telling the user the browser can start a fresh request.

### State E: other status-check error

- Keep the current waiting screen visible.
- Show inline error banner for the failed status check.

### Bottom action

- In `PENDING` and `APPROVED`, the button label is `Clear this request`.
- In `REJECTED`, the button label is `Request new access code`.
- The button is disabled while approved request completion is running.

## Saved request persistence

- After request creation, the browser saves request ID, approval code, suggested name, and creation timestamp in local storage.
- Reloading the page restores the waiting screen instead of returning to the blank form.
- If the browser becomes authenticated, the saved request is cleared automatically.

## Screen 3: Approved browser placeholder

### What this screen is

- This is the post-approval success screen.
- It confirms that the browser is now trusted and shows the session details that future inventory pages will use.
- This is not yet the real editor workspace.

### Main layout

- Left panel becomes a trust/success summary.
- Right panel becomes a session detail panel.

### Left panel content

- Eyebrow label: `Approved Browser`.
- Large headline saying the browser is ready for inventory routes.
- Intro copy explaining that startup is complete, refresh cookie can restore future sessions, and access token lives only in memory.
- Two stat cards: approved role and registered browser name.
- One 3-step timeline card with these steps: `Browser access is now trusted`, `Future visits can refresh into memory`, `Inventory screens plug in next`.

### Right panel content

- Eyebrow label for approved session.
- Title: `Client device state`.
- Authenticated status pill.
- Optional flash banner.
- Optional inline error banner if logout fails.

### Main content blocks

- Session summary card showing friendly device name and assigned role.
- Detail card for device type.
- Detail card for device ID.
- Detail card for access-token expiry time.
- Detail card for refresh-session expiry time.
- `Next feature boundary` panel explaining that inventory list, item detail, and editing routes should be added from here.
- Sign-out action: `Sign out this browser`.
- Pending label: `Signing out browser...`.

## Role behavior

- Backend can approve this browser as `EDITOR` or `ADMIN`.
- The current approved-browser screen does not branch by role.
- The only role-specific UI implemented right now is the displayed role in status and summary areas.

## System behaviors the designer should account for

- On first load, the browser always attempts silent session refresh before deciding whether to show request screen or approved screen.
- Access token is memory-only and refresh behavior is cookie-backed.
- Major state changes happen inside the same page shell rather than through route changes.
- Flash banners and inline notices are a core part of the UX because this flow is very state-driven.
- This frontend is configured as a PWA, but there is no dedicated install screen in the current UI.
