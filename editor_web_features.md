# Editor Web Features

Editor pages are the regular browser pages after a browser is approved as `EDITOR`.

## 1. Request access page

- This page is for a new browser that is not approved yet.
- User gives the browser a device name.
- User requests access.
- The app sends browser details and platform details automatically.
- If request succeeds, the browser receives an approval code and moves to the waiting page.
- If request fails, show an error.

## 2. Waiting for approval page

- This page is for waiting until host admin approves or rejects the browser.
- User sees the approval code.
- User gives the code to the host admin.
- The app keeps checking the request status automatically.
- If approved as `EDITOR`, the browser enters the editor inventory app.
- If activation fails after approval, user can retry.
- If rejected, user must start over and request a new code.
- If the saved request no longer exists, user must start over.

## 3. Inventory list and search page

- This is the main page after an editor browser is approved.
- User sees the item list.
- User can search by main inventory number, secondary inventory number, title, author name, and current location name.
- Search is partial and case-insensitive.
- List uses backend pagination, sorting, and filtering.
- Non-archived items are shown by default.
- Editor cannot include archived items.
- Future visits from the same approved browser should go straight into the app unless the device was revoked.

## 4. Create item page

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

## 5. Item detail page

- This page is for viewing one item.
- User sees the current real location of the item.
- If item is inside the museum, show the internal location.
- If item is outside, show the external organization.
- User also sees the planning information: promised organization and expected leave date.
- User sees the full actual movement history of the item.
- Planning information is visible, but planning by itself is not a history event.
- From this page, editor should be able to open edit, planning, and movement actions.

## 6. Edit item page

- This page is for changing the core item information without moving the item.
- User can change the main inventory number, title, secondary inventory numbers, and authors.
- User can select existing authors or create new authors during this flow.
- Archived items should not be editable.

## 7. Planning update page

- This page is for recording future plans for an item.
- User can set or change the promised organization.
- User can set or change the expected leave date.
- User can select an existing organization or create a new organization during this flow.
- The app should show suggestions, but should not assume that typed text is automatically an existing organization.
- Planning updates do not create history rows.
- Editor only works with normal active organization suggestions and cannot include archived ones.

## 8. Movement page

- This page is for recording a real move or rental event.
- User can move an item to another internal location.
- User can send an item to an external organization.
- User can record a return back into the museum.
- User enters the move-in date for the new real placement.
- For an external move, user can also enter the expected return date.
- User can select an existing organization or create a new one during an external move.
- User can only choose active locations for real internal placement.
- When a new movement is saved, the previous active placement is closed automatically and the new placement becomes the current real state.

## Shared editor rules

- Editor can create items.
- Editor can edit item metadata.
- Editor can update planning fields.
- Editor can create authors during item flows.
- Editor can create organizations during planning or external movement flows.
- Editor can add move, rental, and return events.
- Editor cannot archive items.
- Editor cannot create, rename, or archive locations.
- Editor cannot use archived visibility options that are reserved for admin.
