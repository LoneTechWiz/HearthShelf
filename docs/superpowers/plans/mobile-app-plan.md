# HearthShelf React Native App Plan

## Summary
Build a native Expo app in `apps/mobile` that mirrors the current mobile web experience, but uses native navigation, native controls, and a server-owned JSON API instead of sharing web UI code.

The first version should support:
- OAuth sign-in with the existing Google/GitHub providers
- Home, Shelf, Collections, Checkouts, Contacts, Events, item details, and review flows
- Full CRUD for books, movies, games, contacts, checkouts, events, and reviews
- ISBN barcode scanning on the add-book flow
- Native push notifications
- Read caching for recently loaded data, with network required for writes

## Key Changes
- Scaffold `apps/mobile` as an Expo Router app.
- Use a native tab structure that matches the current mobile web IA:
  - Primary tabs: Home, Shelf, Collections, Checkouts
  - More screen or sheet: Events, Contacts, Account, Sign out
- Add a mobile auth bridge:
  - OAuth opens in the browser
  - The web app finishes sign-in
  - The backend mints a mobile session token for the app
  - The app stores that token securely and sends it on every API request
- Add a JSON API layer in the web app for mobile:
  - `GET /me`, `GET /dashboard`
  - CRUD for books, movies, games, contacts, checkouts, events, and reviews
  - Search/autofill endpoints for Open Library, OMDb, and BGG
  - Import endpoints for CSV workflows
- Add native device features:
  - Barcode scanning for book lookup/add
  - Native push notification support
  - Subscription storage for device tokens
- Reuse shared types in `packages/types` for mobile DTOs and API payloads.

## Implementation Notes
- Keep the mobile UI visually close to the web app, but use native patterns and gestures.
- Use a read cache for dashboard, shelf, collections, checkouts, contacts, and events.
- Keep writes online-only for v1; do not add offline mutation syncing in the first pass.
- Support the same shelf grouping logic already present in the web app, including collections by author/series for books and the equivalent grouping for movies and games.
- Preserve current web-server ownership of database access and business logic where possible.

## Test Plan
- Verify mobile sign-in completes and the token is accepted by the API.
- Verify shelf list/detail/create/update/delete flows for books, movies, and games.
- Verify checkout create/return flows.
- Verify contacts and contact requests.
- Verify events with multiple assigned items.
- Verify review create/update/delete.
- Verify barcode scanning returns a usable ISBN.
- Verify push opt-in and receipt of at least one notification.
- Verify cached reads render before network refresh.

## Assumptions
- PR #27 and the push-notification work are already merged into `main`.
- The mobile app will not talk directly to Supabase; it will use the web app as its backend.
- The first version does not need offline write sync.
- Native push should be opt-in and may degrade gracefully when VAPID/device support is missing.
