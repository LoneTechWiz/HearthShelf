# Barcode Scanner for ISBN Lookup — Design Spec

**Date:** 2026-06-06

## Summary

Add a "Scan" option to the book form that uses the device camera to read an ISBN
barcode (EAN-13), fills the ISBN field, and automatically runs the existing Open
Library lookup to populate the rest of the form.

---

## Approach

Decode barcodes in-browser with `@zxing/browser`. This works on both iOS Safari
and Android Chrome and reads the EAN-13 format printed on book ISBN barcodes. The
native `BarcodeDetector` API was rejected because iOS Safari does not support it.

The camera capture is isolated in its own component that knows nothing about Open
Library — it only reports a decoded code. The book form wires that code into the
existing lookup flow.

---

## Dependencies

- `@zxing/browser` (pulls in `@zxing/library`) — added to `apps/web`.

---

## Components

### `components/books/barcode-scanner.tsx` (new, client component)

- Full-screen modal overlay containing a live `<video>` camera preview and a
  Cancel button.
- Requests the rear camera via `facingMode: "environment"`.
- Uses zxing's `BrowserMultiFormatReader` to continuously scan video frames.
- On the first successful decode, calls `onDetected(code)` and stops scanning.
- Releases the camera stream on close and on unmount (stops all video tracks) so
  the camera indicator turns off.

**Props:**
- `onDetected(isbn: string): void`
- `onClose(): void`

The component is purely about capturing a code. It does not call Open Library.

### `lib/isbn.ts` (new)

- `normalizeIsbn(raw: string): string | null`
  - Strips spaces and hyphens.
  - Returns the cleaned string if it is a 10- or 13-digit ISBN (digits only,
    final ISBN-10 check character may be `X`).
  - Returns `null` otherwise.

This is the unit-tested piece. It sanitizes a scanned code before lookup.

### `components/books/book-form.tsx` (modified)

- Add a **"Scan"** button next to the ISBN field, beside the existing "Lookup"
  button.
- Tapping "Scan" opens the `BarcodeScanner` modal.
- Extract the ISBN lookup logic into a `runLookup(code: string)` helper so both
  the "Lookup" button and the scanner use the same path. This avoids an
  async-state timing bug where the scanned code is not yet in React state when
  the lookup runs.
- On `onDetected(code)`: normalize the code, close the modal, set the ISBN field,
  and call `runLookup(normalized)`. If the code does not normalize to a valid
  ISBN, surface the existing lookup error message ("No book found for this ISBN").

---

## Data Flow

1. User taps "Scan" → scanner modal opens, camera starts.
2. zxing decodes an EAN-13 → `onDetected(rawCode)`.
3. Form normalizes the code, closes the modal, sets the ISBN field.
4. Form calls `runLookup(normalizedIsbn)` → existing `lookupByIsbn` populates
   title, authors, cover, description.

---

## Error Handling

- **Permission denied / no camera / insecure context:** show a clear message
  inside the modal with a Close button. No silent failure.
- Camera access requires a secure context (HTTPS). The Cloudflare tunnel already
  serves HTTPS, and `localhost` is treated as secure.
- **Unrecognized / invalid code:** if `normalizeIsbn` returns `null`, do not run a
  lookup with junk; show the lookup error message.

---

## Testing

- **Unit tests** for `normalizeIsbn`: hyphenated ISBN-13, spaced input, plain
  ISBN-10, ISBN-10 ending in `X`, plain ISBN-13, and invalid input (too short,
  letters, empty).
- The camera + zxing decode flow is verified manually on a real device, since it
  requires actual camera hardware and media APIs that are impractical to unit
  test.

---

## Out of Scope

- Scanning formats other than book ISBN barcodes (EAN-13). zxing's
  multi-format reader will still decode others, but no special handling is added.
- Batch scanning multiple books in one session.
- A standalone scan page; the scanner is only launched from the book form.
