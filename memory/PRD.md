# DROPFIX — Product Requirements Document

## Original Problem Statement
Build DROPFIX: a smart water-quality reporting, monitoring, response and citizen-safety
full-stack platform for South India. Tagline: "SPOT IT. REPORT IT. FIX IT."
Multilingual (English, Tamil, Telugu, Kannada, Malayalam), voice-assisted reporting,
anonymous reporting with tracking codes, real-time public incident map, role-based
experience (Citizen, Municipal Officer, Super Admin), Gemini AI assistance (server-side only),
and an Android-ready mobile experience.

> Stack note: The original prompt requested Supabase + Node + Capacitor. Per the Emergent
> platform, the enforced stack is **Expo React Native (frontend) + FastAPI + MongoDB (backend)**
> with the **Emergent LLM Key** powering **Gemini 3.5 Flash**. All Supabase-specific features
> (Auth, Storage, Realtime, RLS) are realized through equivalent FastAPI/MongoDB patterns.

## Architecture
- **Frontend:** Expo Router (React Native), TypeScript. Single-screen app `app/index.tsx`
  with context providers: `LanguageContext`, `AuthContext`, `IncidentContext`. i18n dictionaries
  in `src/i18n/{en,ta,te,kn,ml}.json`. Custom components: Splash3DAnimation, RoleSwitcherModal,
  VoiceAssistantModal, GuideNavigatorModal, InteractivePublicMap, CategoryChips, HeaderNav,
  StatusTimeline.
- **Backend:** FastAPI (`server.py`), all routes prefixed `/api`. Motor async MongoDB.
  `services/gemini_service.py` for Gemini structuring/translation + officer AI briefs.
  `seed_data.py` for labelled South India demo data. `models.py` with PyObjectId/BaseDocument.
- **AI:** Gemini 3.5 Flash via `emergentintegrations` using `EMERGENT_LLM_KEY`.

## User Personas
- **Citizen:** Reports suspected water issues (typed or voice), tracks status anonymously via
  Report ID + tracking code, views public map, reads advisories/safety guidance.
- **Municipal Officer:** Reviews incident queue, self-assigns, adds field investigation notes,
  updates status/priority, uploads resolution.
- **Super Admin:** Multi-state analytics, incident clusters, public advisory broadcasting,
  audit logs, moderation (public visibility toggle).

## Core Requirements (static)
- 5-language UI + voice assistant (en, ta, te, kn, ml).
- Cautious, non-diagnostic language ("suspected", "requires field verification").
- Anonymous reporting + secure tracking code workflow.
- Privacy-safe approximate map coordinates (jittered ~300-400m).
- Role-based Citizen/Officer/Admin experiences.
- Server-side Gemini only; secrets in `.env`.

## Implemented (with dates)
### 2026-09-02
- Backend: full REST API — reports CRUD/track/status/moderate, voice/structure, officer-ai-summary,
  advisories, clusters, analytics, audit-logs, demo-users, seed. South India demo seeding on startup.
- Frontend: 3D splash + 5-language selector, home, report flow (typed + voice), track flow,
  public map + list toggle with cluster markers, role switcher, officer & admin dashboards,
  advisories/water-safety, guide navigator.
- i18n dictionaries for all 5 languages.
- **BUG FIX:** Added missing `import uuid` in `server.py` — resolved HTTP 500 on POST /api/reports.
- **BUG FIX:** Fixed `load_dotenv` timing in `gemini_service.py` — Gemini 3.5 Flash now performs
  real transcript structuring + translation (previously silently used rule-based fallback).
- **Verified:** testing_agent iteration_2 — 17/17 backend + 7/7 frontend flows PASS.

### 2026-09-03
- **Photo/Video Evidence:** `services/storage_service.py` (Emergent Object Storage handshake),
  `POST /api/upload` + `GET /api/files/{path}`; report form evidence picker (gallery + camera)
  with permission handling, thumbnails, remove; `src/utils/uploadMedia.ts` (web/native FormData split).
- **Live Refresh:** `IncidentContext` polls every 20s (paused when app backgrounded via AppState);
  Home shows a live-updates indicator; map/dashboards reflect new approved incidents automatically.
- **Offline Drafts:** NetInfo-based connectivity monitor; failed submits queue to local storage and
  auto-submit on reconnect; Home offline/sync banner + "Saved Offline" modal.
- **Nearby Alerts:** Home "Alerts Near You" with a persisted area (state) picker; empty state when none.
- **Home + Nav redesign (white + medium/light blue):** Report hero card, stat counters, Quick
  Services & Tools grid; new bottom tab bar Home | Map | [center voice mic] | AI Assistant | Settings;
  added AI Assistant screen and Settings screen (language + role + dashboard access).
- i18n: added all new keys (nav/home/report-evidence/offline/perm/ai/settings) in all 5 languages.
- app.json: camera + media-library permissions and expo-image-picker plugin.
- **Verified:** testing_agent iteration_3 — 20/20 backend + 100% frontend flows PASS.

## Backlog (prioritized)
- **P1:** Split `app/index.tsx` (>2400 lines) into route files for maintainability.
- **P1:** Exercise offline auto-submit on a real device / native build (not simulatable in web preview).
- **P2:** Add dedicated testIDs to Officer/Admin dashboards & Map/List toggle.
- **P2:** Harden non-demo endpoints (incl. `/api/seed`) with auth before production.
- **P2:** Replace deprecated `shadow*`/`pointerEvents` style props.

## Next Tasks
1. Add evidence media capture + Object Storage upload in the report flow.
2. Add polling-based near-real-time map/dashboard updates.
3. Offline draft caching for the report form.
