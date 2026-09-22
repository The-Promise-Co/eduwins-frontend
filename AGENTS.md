# AGENTS — Frontend Booking & LiveKit Video Sessions

## Core Constraints & Architecture Rules
- **Full-Width Layout**: All `/app` pages use wrapper `<div className="space-y-6 pb-12">`. No `max-w-*`/`mx-auto` wrappers, no per-page horizontal padding — rely on `<main className="p-4 md:p-6">` and `space-y-6` gaps.
- **Session Page Layout**: Authenticated session pages use 2/5–3/5 desktop split: `grid gap-6 lg:grid-cols-5` with `lg:col-span-2` (details) and `lg:col-span-3` (live preview).
- **Booking Data Normalization**: `useBooking(id)` normalizes `{ booking, parent, teacher, children }` into an enriched `Booking` object. Scheduled date/time/duration are rendered directly without fallback missing-date mock data.
- **Time Display**: Always 12-hour AM/PM via `misc/utils/time.ts` (`formatTime`/`formatTimeRange` or `hour12: true`). Payloads remain standard `HH:MM:SS`.
- **Media Stability**: Pre-join preview media is ref-owned (`streamRef`, `videoRef`, `levelBarRef`, `*Ref` mirrors). Preview tracks are explicitly stopped before entering call to release webcam hardware.
- **Session Lifecycle & Full-Bleed Call**:
  - `SessionUiContext` manages `inCall`, `isFullscreen`, `theme` ('light' | 'dark'), and `isDarkMode`.
  - While `inCall` is true, app navigation locks collapsed and `main` becomes full-bleed (`p-0`).
  - When `isFullscreen` is active, `AppHeader` and `AppSidebar` are completely hidden, filling 100% of viewport.
  - When `isDarkMode` is true, `AppHeader` and layout background adapt to dark mode.
- **In-Call Video & Presentation Architecture**:
  - Composed LiveKit primitives (no prefab): custom `ParticipantTile`s, responsive 2×2 grid, single-participant fluid fill.
  - Participant names sync via data channel (`type: 'profile'`) and `localParticipant.setName()`.
  - Tutor is outlined with distinct badge in participant listings.
  - Custom chat sidebar (`useChat()` data layer, auto-scroll, unread badge).
  - Dual Presentation (Option 1): Screen Share + TLDraw Whiteboard simultaneously supported with a top tab switcher, right `w-[200px]` preview swapping, and participant camera strip.
  - TLDraw Whiteboard: Teacher-exclusive launch controls with student collaboration permission toggle (`isReadonly`), syncing peer-to-peer via LiveKit reliable data channel.

## Key Files
- `app/app/booking-requests/page.tsx` — booking requests list, modals, status banners, payment trigger
- `app/app/session/[bookingId]/page.tsx` — authenticated session page (pre-join preview + live call)
- `app/(public)/join/[code]/page.tsx` — child join page (code-based Google Meet style)
- `misc/context/SessionUiContext.tsx` — call lifecycle, fullscreen, and dark/light theme state
- `misc/components/LiveKitSession.tsx` — in-call room, video grid, toolbar, chat, presentation switcher
- `misc/components/SessionWhiteboard.tsx` — collaborative TLDraw canvas with teacher permissions & data sync
- `misc/components/SessionNotesSidebar.tsx` — in-call notes sidebar with tabs for Shared & Personal notes
- `misc/components/SessionNotesModal.tsx` — modal for viewing and exporting session notes from bookings
- `misc/hooks/api/notes.ts` — session notes query, personal/shared save mutations, and local caching
- `misc/hooks/api/bookings.ts` — booking request, lifecycle, and status hooks
- `misc/hooks/api/session.ts` — LiveKit tokens, child join codes, session events

## Upcoming Phases
- **Phase 8**: Email notification templates for booking lifecycle.
- **Backend Integrations**: `/livekit/token`, `/livekit/join/{code}`, `/livekit/codes/{bookingId}`, `/sessions/{bookingId}/events`, session notes API endpoints.
- **Phase 11**: Session recording via LiveKit Egress.
