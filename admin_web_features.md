# Admin Web Features

## 1. Admin login page

- This page is for the host/admin to enter the system.
- User enters the admin password and logs in.
- If login is successful, user goes to the admin area.
- If the password is wrong, show an error.
- If the installation has not been set up yet, user must go to first-time setup instead.

## 2. First-time setup page

- This page is for creating the installation for the first time.
- User enters organization name.
- User creates the admin password.
- User adds the first location list.
- At least one location is required.
- Every location needs a name.
- Location names must be unique.
- If setup succeeds, user goes back to login and signs in with the new password.
- If setup already exists, do not allow creating it again.

## 3. Browser access requests page

- This page is for approving browsers that want to use the system.
- Admin sees every pending browser request.
- Each request includes approval code, suggested device name, browser details, platform details, and request time.
- Admin can approve a request.
- When approving, admin chooses the device role: `ADMIN` or `EDITOR`.
- When approving, admin can keep the suggested device name or change it to the final friendly name.
- Admin can reject a request.
- If a request is approved, that browser can finish activation and log in.
- If a request is rejected, that browser must start over with a new request.
- Admin can also see already processed requests for history.

## 4. Mobile pairing page

- This page is for adding iPhones to the system.
- Admin starts a new phone pairing.
- Admin chooses whether the phone should become `ADMIN` or `EDITOR`.
- System creates a short-lived QR/deep-link pairing code.
- Phone scans the QR and sends its device details.
- After scan, admin confirms the final device name.
- If the phone scanned too late and the pairing expired, admin must cancel it and create a new one.
- Admin can cancel any unfinished pairing.
- Completed and cancelled pairings stay visible for history.

## 5. Registered devices page

- This page is for managing all approved browsers and paired phones.
- Admin sees every registered device.
- Each device shows its name, role, type, platform/client details, last seen time, and device ID.
- Admin can change the role of an active device between `ADMIN` and `EDITOR`.
- Admin can revoke an active device.
- If a device is revoked, its active sessions are closed and it loses access.
- Revoked devices stay visible for history/audit.
