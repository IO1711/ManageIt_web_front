# Admin Web Features

Admin has 2 kinds of web pages in the prototype:

1. Host-only admin pages on `localhost`
2. Regular browser pages after a browser is approved as `ADMIN`

## Host-only admin pages on `localhost`

### 1. Admin login page

- This page is for the host machine admin to enter the host-only admin area.
- User enters the installation admin password.
- If login is correct, user goes into the host-only admin area.
- If login is wrong, show an error.
- If onboarding was never completed, user must go to first-time setup instead.

### 2. First-time setup page

- This page is for creating the installation for the first time.
- User enters the organization name.
- User creates the installation admin password.
- User adds the first list of museum locations.
- At least one location is required before the system is ready.
- Every location must have a name.
- Location names must be unique.
- If setup succeeds, user goes back to login and signs in.
- If setup already exists, user cannot create it again.

### 3. Installation settings page

- This page is for changing installation-wide settings.
- In the prototype, the main setting is the organization name.
- User can view the current organization name.
- User can change the organization name.
- Blank organization names are not allowed.

### 4. Change admin password page

- This page is for changing the host-only admin password.
- User enters the current password.
- User enters the new password.
- The new password must be different from the current password.
- If password change succeeds, future logins use the new password.
- The current admin session stays active after the change.

### 5. Browser access requests page

- This page is for approving or rejecting browser devices that want to use the system.
- Admin sees every pending browser request.
- Each request shows the approval code, suggested device name, browser details, platform details, and request time.
- Admin can approve a request as `ADMIN` or `EDITOR`.
- Admin can keep the suggested device name or change it to the final device name.
- Admin can reject a request.
- If approved, that browser can enter the app.
- If rejected, that browser must start over and request access again.
- Processed requests stay visible for history.
- In the prototype, desktop browser requests stay pending until admin approves or rejects them.

### 6. Mobile pairing page

- This page is for adding iPhones to the system.
- Admin starts a new phone pairing.
- Admin chooses whether the phone should become `ADMIN` or `EDITOR`.
- System creates a short-lived QR/deep-link pairing code.
- Phone scans the code and sends its device details.
- Admin confirms the final device name.
- If pairing expires before finalization, admin must cancel it and create a new one.
- Admin can cancel any unfinished pairing.
- Completed and cancelled pairings stay visible for history.
- For phones, generating the pairing is already the approval step.

### 7. Registered devices page

- This page is for managing all approved browsers and paired phones.
- Admin sees every registered device.
- Each device shows the final device name, role, device type, browser or phone details, last seen time, and device ID.
- Admin can change the role of an active device between `ADMIN` and `EDITOR`.
- Admin can revoke an active device.
- If a device is revoked, its active session is closed and it loses access.
- Revoked devices stay visible for history and audit.

## Regular browser pages after approval as `ADMIN`

### 8. Request access page

- This page is for a new browser that is not approved yet.
- User gives the browser a device name.
- User requests access.
- The app sends browser details and platform details automatically.
- If request succeeds, the browser receives an approval code and moves to the waiting page.
- If request fails, show an error.

### 9. Waiting for approval page

- This page is for waiting until host admin approves or rejects the browser.
- User sees the approval code.
- User gives the code to the host admin.
- The app keeps checking the request status automatically.
- If approved as `ADMIN`, the browser enters the admin inventory app.
- If activation fails after approval, user can retry.
- If rejected, user must start over and request a new code.
- If the saved request no longer exists, user must start over.

### 10. Inventory list and search page

- This is the main page after an admin browser is approved.
- User sees the item list.
- User can search by main inventory number, secondary inventory number, title, author name, and current location name.
- Search is partial and case-insensitive.
- List uses backend pagination, sorting, and filtering.
- Non-archived items are shown by default.
- Admin can choose to also include archived items.
- Future visits from the same approved browser should go straight into the app unless the device was revoked.

### 11. Create item page

- This page is for adding a new inventory item.
- User enters the main inventory number.
- User enters the title.
- User can add zero or more secondary inventory numbers.
- User must add at least one author.
- User can select existing authors or create new authors during this flow.
- User chooses the initial internal location.
- User enters the move-in date.
- The main inventory number must be unique.
- If the main inventory number already exists, the app should show the conflicting item details so the user can open the existing item or change the number.

### 12. Item detail page

- This page is for viewing one item.
- User sees the current real location of the item.
- If item is inside the museum, show the internal location.
- If item is outside, show the external organization.
- User also sees the planning information: promised organization and expected leave date.
- User sees the full actual movement history of the item.
- Planning information is visible, but planning by itself is not a history event.
- From this page, admin should be able to open edit, planning, movement, and archive actions.

### 13. Edit item page

- This page is for changing the core item information without moving the item.
- User can change the main inventory number, title, secondary inventory numbers, and authors.
- User can select existing authors or create new authors during this flow.
- Archived items should not be editable.

### 14. Planning update page

- This page is for recording future plans for an item.
- User can set or change the promised organization.
- User can set or change the expected leave date.
- User can select an existing organization or create a new organization during this flow.
- The app should show suggestions, but should not assume that typed text is automatically an existing organization.
- Planning updates do not create history rows.
- Admin can choose to include archived organizations in suggestion lists when needed.

### 15. Movement page

- This page is for recording a real move or rental event.
- User can move an item to another internal location.
- User can send an item to an external organization.
- User can record a return back into the museum.
- User enters the move-in date for the new real placement.
- For an external move, user can also enter the expected return date.
- User can select an existing organization or create a new one during an external move.
- User can only choose active locations for real internal placement.
- When a new movement is saved, the previous active placement is closed automatically and the new placement becomes the current real state.

### 16. Archive item page or action

- This is for hiding an item from normal active work without deleting its history.
- Only admin can archive an item.
- Archived items are hidden from the default item list.
- Archived items stay in the system and keep their history.
- Archived items keep their main inventory number reserved permanently.

### 17. Location management page

- This page is for managing museum locations.
- Admin can see the full location list.
- Admin can add a new location.
- Admin can rename an active location.
- Admin can archive a location.
- Archived locations are hidden by default.
- Admin can choose to include archived locations.
- Archived locations stay in the system and are not deleted.

## Shared admin browser behavior

- Admin can do everything an editor can do in the regular inventory app.
- Admin also has extra regular-browser powers: include archived items, include archived authors in suggestions, include archived organizations in suggestions, include archived locations, archive items, and create, rename, and archive locations.
