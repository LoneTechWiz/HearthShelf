# Mobile-First Design — Design Spec

**Date:** 2026-06-06

## Summary

Make the My Shelf app mobile-first responsive. The primary change is a navigation redesign: a fixed bottom tab bar on mobile, with the existing left sidebar retained on desktop. Content padding is tightened on mobile. No page-level restructuring required.

---

## Approach

Single responsive `Nav` component with two visual modes driven entirely by Tailwind breakpoints — no JavaScript resize logic. The library layout adjusts to accommodate the fixed bottom bar on mobile.

---

## Navigation Component (`components/nav.tsx`)

### Mobile (below `md`)
- Fixed to the bottom of the viewport (`fixed bottom-0 left-0 right-0`)
- White background, top border (`border-t border-zinc-200`)
- Height ~56px (`h-14`)
- Four items in a flex row, each equal width: **Books**, **Contacts**, **Checkouts**, **Sign Out**
- Each item: inline SVG icon (24×24) above a text label (`text-xs`)
- Active item: `text-zinc-900`, inactive: `text-zinc-400`
- Sign Out renders as a form submit button to match current behavior

### Desktop (`md+`)
- Left sidebar, `w-48`, unchanged from current implementation
- Hidden on mobile via `hidden md:flex`

### Icons (inline SVG, no new dependencies)
- Books: book/stack icon
- Contacts: person icon
- Checkouts: arrow-right-left icon
- Sign Out: arrow-left-on-rectangle icon

---

## Library Layout (`app/(library)/layout.tsx`)

- Content wrapper padding: `p-4 md:p-8` (was `p-8`)
- Add `pb-20 md:pb-0` to content wrapper to prevent content hiding behind the fixed bottom bar on mobile
- Layout structure unchanged on desktop (`flex min-h-screen` with sidebar + content)

---

## Out of Scope

- Individual page restructuring (existing layouts work on mobile as-is)
- Sign-in page changes (already centered, works on mobile)
- Adding a dedicated profile/settings page
