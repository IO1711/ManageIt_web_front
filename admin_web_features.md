# Admin Web Features

## Pages

1. Admin entry page.
2. Host admin workspace page.

## Overall structure

- This is a host-only web app that opens on `localhost`, `127.0.0.1`, `::1`, or `[::1]`.
- It is a single-page app. State changes happen inside the same shell instead of moving across many routes.
- Desktop layout is a 2-column split screen with a large left content area and a narrower right action/summary panel.
- Tablet and mobile collapse the 2 columns into one vertical stack.

## Page 1: Admin entry page

### What this page is

- This is the first screen for the machine acting as host admin.
- It must support both first-time installation setup and sign-in for an existing installation.

### Main layout

- Left panel is a branded explainer panel.
- Right panel is the actual working panel with forms and messages.

### Left panel content

- Eyebrow label: `Host Admin Mode`.
- Large headline about installation setup, sign-in, and approvals.
- Intro copy explaining that this frontend controls onboarding, admin login, browser approvals, iPhone pairing, and device registry.
- Two stat cards: `Ready now` and `Authenticated workspace`.
- One 3-step timeline card with these steps: `Set up installation`, `Sign into host admin`, `Review browser requests`.

### Right panel shell

- Panel header with eyebrow label for entry flow and title `Host access`.
- Optional loading pill while checking whether an admin session already exists.
- Optional flash banner for success, warning, or signed-out messages.
- Optional error banner if the session check fails for reasons other than unauthenticated.
- Two-tab switcher with `Admin sign-in` and `First-time setup`.

### State A: sign-in tab

- Form title: `Admin password login`.
- One required password field.
- Primary action: `Sign in`.
- Secondary action: `New installation? Open first-time setup`.
- Inline validation under the password field when empty.
- Inline error banner when sign-in fails.
- Pending button label: `Signing in...`.

### Sign-in result behavior

- Successful sign-in sends the user to the host admin workspace page.
- If backend returns `ONBOARDING_NOT_COMPLETED`, the UI switches to first-time setup automatically and shows a warning banner.

### State B: first-time setup tab

- Form title: `First-time installation setup`.
- Fields: `Organization name`, `Admin password`, and `Initial locations`.
- `Initial locations` is a dynamic repeater.
- Each location row has one text input and one `Remove` button.
- There is an `Add location` button above the list.
- The form always keeps at least one location row.
- Primary action: `Create installation`.
- Secondary action: `Existing installation? Return to sign-in`.

### First-time setup validation

- Organization name is required.
- Admin password is required.
- Every location name is required.
- At least one location is required.
- Location names must be unique after trimming and case normalization.
- All text inputs are capped at 255 characters.

### First-time setup result behavior

- Successful setup shows a success banner and returns the UI to the sign-in tab.
- If backend returns `ONBOARDING_ALREADY_COMPLETED`, the UI switches back to sign-in and shows a warning banner.

## Page 2: Host admin workspace page

### What this page is

- This is the admin operations dashboard after authentication.
- It is the main control center for approving browsers, pairing iPhones, and managing registered devices.

### Main layout

- Left panel is the large working canvas.
- Right panel is the summary and recent-history rail.

### Left panel top content

- Eyebrow label: `Host Admin Mode`.
- Large headline about approving browsers waiting to join the installation.
- Intro copy about turning pending requests into trusted devices.
- Two stat cards: `Pending approvals` and `Processed requests`.
- One 3-step timeline card with these steps: `Review the browser request`, `Choose role and friendly name`, `Let the browser finish activation`.

## Workspace section 1: Pending browser approvals

### What this section is

- This is the queue of LAN browsers asking to join the installation.
- It refreshes automatically every 5 seconds.

### Section header

- Title: `Pending browser approvals`.
- Helper copy saying newest requests appear first.
- Optional `Refreshing queue` pill while refetching.

### Empty state

- A card explaining that no browser requests are waiting yet.

### Pending request card

- One card per request with status `PENDING`.
- Card header shows the approval code, suggested device name, request timestamp, and status badge.
- The code is treated as a visible approval token, not hidden metadata.
- The card shows platform name/version and browser name/version.
- The card contains an approval form.

### Approval form inside each request card

- Role dropdown with `EDITOR` and `ADMIN`.
- Friendly name text field, prefilled with the suggested name.
- Primary action: `Approve browser`.
- Secondary action: `Reject request`.
- Inline validation and inline request-specific error state.
- Pending labels: `Approving...` and `Rejecting...`.

### Approval rules

- Role is required.
- Friendly name is optional.
- Friendly name is capped at 255 characters.

### Approval outcomes

- Approving removes the card from the pending queue, moves it into processed history, and refreshes the registered-device list.
- Rejecting removes the card from the pending queue, moves it into processed history, and prevents that browser from completing activation with that code.

## Workspace section 2: Mobile pairing studio

### What this section is

- This is the iPhone onboarding area.
- It creates QR-based pairing sessions, waits for scan, and finalizes the device into the registry.
- It refreshes automatically every 5 seconds.

### Section header

- Title: `Mobile pairing studio`.
- Helper copy describing the `generate -> scan -> finalize` flow.
- Optional `Refreshing pairings` pill while refetching.

### Summary row

- Stat card: `Open pairings`.
- Stat card: `Scanned now`.
- Stat card: `Completed`.

### Create-pairing card

- This card sits at the top of the section.
- Title: `Start a new iPhone pairing`.
- It explains that backend creates a 15-minute pairing token and QR deep link.
- One role dropdown with `EDITOR` and `ADMIN`.
- Primary action: `Generate iPhone pairing`.
- Pending label: `Generating QR...`.
- Small pill indicating whether scanned phones are waiting for finalization.
- Inline error banner when creation fails.

### Pairing session cards

- One card per pairing session.
- Cards stay visible for history even after completion or cancellation.
- Every card shows a title, creation timestamp, status badge, assigned role, expiry time, and pairing ID.

### Pairing state: `GENERATED`

- Show the QR image preview in a dedicated panel.
- Show the raw QR deep-link payload in a monospaced block.
- Show muted notice: waiting for scan.
- Show action: `Cancel pairing`.

### Pairing state: `SCANNED`

- Keep the QR area visible.
- Show scanned device data: suggested name, platform name/version, model name, and scanned timestamp.
- Show finalization form with required `Final friendly name` field.
- Primary action: `Finalize iPhone`.
- Pending label: `Finalizing...`.
- Show action: `Cancel pairing`.

### Pairing state: `SCANNED` but expired

- Replace the finalization form with a warning notice.
- The notice explains that the phone scanned the QR but the session expired before activation.
- Keep `Cancel pairing` available so the admin can clear it and create a new session.

### Pairing state: `COMPLETED`

- Show final friendly name.
- Show completion timestamp.
- Show registered device ID.
- Show device metadata summary such as model and platform.
- No further action button.

### Pairing state: `CANCELLED`

- Show muted notice explaining that the QR session no longer works.
- Keep the card visible as history.
- No further action button.

### Pairing rules

- Pairing creation requires role.
- Final friendly name is required.
- Final friendly name is capped at 255 characters.

## Workspace section 3: Registered devices

### What this section is

- This is the master list of all approved browsers and paired iPhones.
- It refreshes automatically every 5 seconds.

### Section header

- Title: `Registered devices`.
- Helper copy explaining that devices come from browser approval and iPhone pairing.
- Optional `Refreshing devices` pill while refetching.

### Summary row

- Stat card: `Active`.
- Stat card: `Revoked`.
- Stat card: `Browsers`.
- Stat card: `iPhones`.

### Empty state

- A card explaining that no devices are registered yet.

### Device card

- One card per registered device.
- Header shows friendly name, human-readable device type, registration timestamp, and status badge.
- Device type text is `Browser device` for web devices and `iPhone device` for iOS devices.
- Metadata grid shows role, original suggested name, platform name/version, client metadata, last seen timestamp, and device ID.
- Client metadata is browser name/version for web devices and model name for iPhone devices.

### Active device state

- Show editable role form.
- Role dropdown with `EDITOR` and `ADMIN`.
- Primary action: `Update role`.
- Secondary action: `Revoke device`.
- Pending labels: `Updating role...` and `Revoking...`.

### Revoked device state

- Remove editable actions.
- Show notice explaining that backend sessions were closed when the device was revoked.
- Show revoked timestamp.
- Keep the card visible for audit/history.

## Right panel on workspace page

### Top area

- Eyebrow label for host workspace.
- Organization name as the main title.
- Authenticated status pill.
- Shared flash banner area for success, warning, and muted system feedback.

### Session summary card

- Short explanation that this admin session can approve browser requests, pair iPhones, and manage registered devices.

### Mini stats

- One card for `Pending`.
- One card for `Processed`.

### Recent processed requests list

- One compact card per approved or rejected browser request.
- Each card shows final friendly name or fallback suggested name, browser name + platform name, status badge, approval code, role or `Not assigned`, and updated timestamp.
- Show empty state if nothing has been processed yet.

### Footer action

- One sign-out button.
- Pending label: `Signing out...`.
- The button is disabled while sign-out is running or another approve/reject mutation is active.

## System behaviors the designer should account for

- Admin pages are cookie-session based, so the UI can jump between authenticated and unauthenticated states without route changes.
- Flash banners are reused heavily for feedback after setup, sign-in, approve, reject, pair, revoke, and sign-out actions.
- Unauthorized API responses inside the workspace should return the user to the entry page.
- This frontend is configured as a PWA, but there is no separate install or splash screen in the current UI.
