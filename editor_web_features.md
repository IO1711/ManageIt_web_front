# Editor Web Features

## 1. Request access page

- This page is for a new browser that is not approved yet.
- User gives the browser a device name.
- User requests access.
- The app sends browser details and platform details automatically.
- If the request succeeds, the app creates an approval code and moves the user to the waiting page.
- If the request fails, show an error.

## 2. Waiting for approval page

- This page is for waiting until host admin approves or rejects the browser.
- User sees the approval code.
- User gives that code to the host admin.
- The app keeps checking the request status automatically.
- If the request is approved, the app finishes activation automatically and logs the browser in.
- If activation fails after approval, user can retry.
- If the request is rejected, user must start over and request a new code.
- If the saved request no longer exists, user must start over.

## 3. Approved browser page

- This page confirms that the browser is now trusted.
- User sees the assigned role, final device name, device ID, and session expiry details.
- User can sign out this browser.
- Future visits can restore the session automatically.
- This is where future inventory/editor pages will start.
- Right now there is no separate editor work page yet.
- Right now `EDITOR` and `ADMIN` browsers land on the same page after approval.
