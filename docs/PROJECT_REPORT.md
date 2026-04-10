# RepairDesk — Project Report
**Prepared for:** Elect Technologies
**Prepared by:** Engineering (AI-Assisted Development, Claude Sonnet 4.6)
**Date:** April 10, 2026
**Repository:** github.com/DenineCorp/Repairdesk
**Deployment:** Vercel (Production)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technology Stack](#3-technology-stack)
4. [Architecture](#4-architecture)
5. [Features Built](#5-features-built)
6. [Development Timeline & Phases](#6-development-timeline--phases)
7. [Issues Encountered & Fixes Applied](#7-issues-encountered--fixes-applied)
8. [Security Audit — Findings & Remediation](#8-security-audit--findings--remediation)
9. [Deployment & Infrastructure](#9-deployment--infrastructure)
10. [User Roles & Access Control](#10-user-roles--access-control)
11. [Stripe — Strategic Recommendation](#11-stripe--strategic-recommendation)
12. [Known Limitations & Recommended Next Steps](#12-known-limitations--recommended-next-steps)

---

## 1. Executive Summary

RepairDesk is a purpose-built internal repair management system for Elect Technologies. It replaces manual tracking with a structured, role-gated web application that allows technicians to log, update, and manage device repair tickets, while giving the business owner (Founder) a dedicated dashboard with financial reporting, activity auditing, and staff management.

The system was built from scratch and deployed to production. It supports multi-factor authentication (TOTP/QR code), role-based access control with three tiers (Founder, Technician, Viewer), real-time ticket updates, customer SMS notifications, CSV export, an audit trail of all staff actions, and a self-service account creation flow restricted to @electtech email addresses.

All critical security vulnerabilities identified during audit have been resolved and the codebase has been reviewed, hardened, and pushed to GitHub and Vercel.

---

## 2. Project Overview

### Purpose
An internal staff tool for Elect Technologies repair operations. Not customer-facing. Every user is a staff member.

### Core Workflow
1. A technician logs a new device repair (customer name, phone, device, issue, dates, optional warranty)
2. A serial Issue ID is auto-generated (e.g. `26-0001`, `26-0002`) — year prefix + arrival sequence
3. The ticket moves through statuses: `Pending → In Progress → Ready → Collected`
4. Payment is tracked per ticket (`Unpaid → Partial → Paid`) with amount in CAD
5. When a device is ready, the technician sends an SMS notification to the customer
6. A printable label is generated for each ticket (includes warranty and payment status)
7. The Founder views financial and operational summaries, exports CSVs, and reviews activity logs

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router v6 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Auth | Supabase Auth (email/password + TOTP MFA) |
| Database | Supabase (PostgreSQL with Row Level Security) |
| SMS | Twilio (via serverless function) |
| Serverless API | Vercel Functions (`/api` directory) |
| Deployment | Vercel (frontend + API) |
| Source Control | GitHub (DenineCorp/Repairdesk) |
| Video (installed) | Remotion (available for future use) |

---

## 4. Architecture

```
Browser (React SPA)
    │
    ├── Supabase JS Client (auth, realtime, database)
    │       └── Row Level Security enforces per-user data access
    │
    └── Vercel Serverless Functions (/api)
            ├── /api/get-role       — reads user role from JWT
            ├── /api/send-sms       — proxies Twilio SMS (server-side credentials)
            └── /api/manage-roles   — founder-only user role management (auth admin)
```

### Key Design Decisions

**Supabase Anon Key (not Service Role Key) for data queries**
The service role key bypasses Row Level Security. All data queries use the anon key so RLS policies on `tickets`, `payments`, `notifications`, and `audit_logs` are always enforced. The service role key is used exclusively in `api/manage-roles.js` for Supabase Auth admin operations (`listUsers`, `updateUserById`), which is its intended purpose.

**JWT-first role reading**
User roles are stored in `user_metadata` and read instantly from the JWT session on page load — no API round trip needed. A background call to `/api/get-role` optionally upgrades the role reading from `app_metadata` (tamper-proof, admin-write-only). This means the UI never blocks on a network call to determine routing.

**Serverless functions for secrets**
Twilio credentials and the Supabase Service Role Key never touch the browser. They live only in Vercel environment variables and are accessed only by the `/api` functions.

---

## 5. Features Built

### Authentication
- Email/password sign-in with client-side rate limiting (5 attempts, 30-second lockout)
- TOTP-based 2FA (Google Authenticator, Authy, etc.) enforced for all users
- AAL2 (Authenticator Assurance Level 2) enforcement — users with enrolled 2FA cannot access protected routes without completing verification
- Self-service account creation restricted to `@electtech` email domains
- New accounts default to `viewer` (read-only) role

### Ticket Management
- New ticket intake form with: customer name, phone (E.164 validated), device, issue description, date in, expected completion, optional warranty period (days)
- Auto-generated serial Issue IDs in `YY-NNNN` format (e.g. `26-0001`) — year prefix derived from current year, NNNN is the next sequential number queried from the `tickets` table
- Status progression: Pending → In Progress → Ready → Collected
- Real-time updates via Supabase Postgres Changes subscription
- Overdue ticket detection and highlighting
- Individual ticket detail page with full information view

### Payment Tracking
- Per-ticket payment record created automatically on ticket creation
- Payment statuses: Unpaid, Partial, Paid
- Amount tracking in CAD
- Payment timestamps recorded on `paid` status

### Customer Notifications
- Send SMS to customer when device is ready (via Twilio)
- Notification logged to `notifications` table with status (sent/failed)
- Notification status shown on ticket row (Notified ✓)
- SMS also available from individual ticket detail page

### Printable Label
- One-click print from ticket detail
- Monochrome format suitable for label printers
- Includes: ET logo, Issue ID, Customer, Phone, Device, Issue (truncated to 80 chars), Date In, Expected, Status, Payment Status, Warranty (if set)

### Founder Dashboard
- Financial overview: total jobs, revenue, unpaid/partial/paid breakdown
- Filter tickets by payment status
- Export filtered view to CSV (Issue ID, Customer, Phone, Device, Issue, Status, Dates, Payment)
- Full ticket list with payment controls

### Tech Dashboard
- Active jobs overview with stats (Active, Overdue, Due Today)
- Overdue and Due Today sections with colour-coded accent indicators
- Inline status change and payment update per ticket row
- New Ticket button
- Real-time updates
- Offline detection banner

### Audit Log / Activity Feed
- Every significant staff action is logged to `audit_logs` table: ticket created, status changed, payment updated, notification sent
- Filterable by event type
- Shows actor email, timestamp, and event details
- Founder-only access

### User Management
- Founder can view all registered staff accounts
- Change any user's role (Viewer → Technician → Founder) from inside the app
- Protected endpoint — verifies the caller has `founder` role before making any changes
- Users sorted by role, then alphabetically

### Navbar
- Role pill showing current user's role (Founder / Technician / Viewer)
- Founder-only links: Users, Activity Log
- Sign out

---

## 6. Development Timeline & Phases

| Commit | Phase |
|---|---|
| `73dc150` | Initial build — all core phases complete (auth, dashboards, tickets, payments, SMS) |
| `a909dc6` – `e83574b` | UI iteration — motherboard background, glassmorphism, circuit patterns |
| `680873d` – `6ec33b0` | Rebrand to Elect Technologies colour system, glass panel aesthetic |
| `da5cb28` – `6ea5548` | QR code rendering fix, login card polish |
| `a5eb587` | 2FA stability — stale factor unenrollment before re-enroll |
| `739b122` | Security audit pass — all HIGH and MEDIUM vulnerabilities fixed |
| `717b7d2` | CSV export + activity audit log |
| `eb844b4` | Apple-style light theme — complete redesign from dark to light |
| `ca0c0fa` – `8569aa0` | Role routing fixes (3 iterations) |
| `0553139` | Permanent role routing fix — AAL2 race condition resolved |
| `e47a117` | ET logo, warranty field, payment on label, self-signup, viewer role |
| `bfb22f5` | Hardened .gitignore, untracked local config files |
| `d093777` | Role management UI for founders |
| `02b94fa` | Serial ticket IDs — `YY-NNNN` format for first-come-first-serve queue |

---

## 7. Issues Encountered & Fixes Applied

### Issue 1 — QR Code XSS Risk
**Problem:** The 2FA setup page was injecting the QR code SVG directly via `dangerouslySetInnerHTML`, which creates a Cross-Site Scripting vector if the SVG payload were ever manipulated.
**Fix:** Replaced with a standard `<img src={qrUrl} />` tag. Supabase returns a data URI, which is safe to render as an image source.

### Issue 2 — Stale 2FA Factor on Re-enrollment
**Problem:** If a user started 2FA setup, abandoned it, then returned, Supabase retained the unverified factor. Attempting to enroll again would fail silently or error.
**Fix:** On entering the setup page, the app now calls `mfa.listFactors()`, checks for any unverified (`unverified`) TOTP factors, and unenrolls them before starting fresh enrollment.

### Issue 3 — Role Routing: Everyone Lands on Tech Dashboard (4 iterations)

This was the most persistent issue in the project. All users — including the owner — were landing on the Technician Dashboard regardless of their role.

**Iteration 1 — Assumed env vars missing**
Diagnosis: Assumed `SUPABASE_ANON_KEY` and `SUPABASE_URL` were not set on Vercel.
Outcome: Incorrect. Owner confirmed these were set from the start.

**Iteration 2 — Used Service Role Key in API**
Diagnosis: Switched `api/get-role.js` to use `SUPABASE_SERVICE_ROLE_KEY` to ensure the user record was readable.
Outcome: Rejected. Owner correctly identified this would bypass all Row Level Security policies on the database, which is unacceptable for a multi-user system.

**Iteration 3 — Wrong session read in MFA pages**
Diagnosis: `Setup2FA.jsx` and `Verify2FA.jsx` were calling `supabase.auth.getSession()` immediately after `mfa.challengeAndVerify()` to read the role, then navigating to the appropriate dashboard. The problem: Supabase internally upgrades the session to AAL2 after `challengeAndVerify`, which briefly invalidates the old session. `getSession()` called in that window can return `null`, so `session?.user?.user_metadata?.role` evaluates to `undefined`, which does not match `'founder'`, so all users route to `/tech-dashboard`.

**Root cause confirmed by:** The Navbar was correctly showing the "Founder" badge (it uses `useAuth()` which had already populated the role from the initial JWT), while the routing was broken — proving the role was present in memory but the post-MFA `getSession()` call was racing against the AAL2 token upgrade.

**Final fix:** Removed the `getSession()` call entirely from both MFA pages. After successful `challengeAndVerify()`, navigate to `/` and let `RoleRedirect` (which reads role from `useAuth()`, already populated from the original JWT) handle the dashboard selection. Zero race condition.

### Issue 4 — Dark Select Option Backgrounds After Theme Change
**Problem:** After migrating from the dark theme to Apple light theme, `<option>` elements inside `<select>` dropdowns in TechDashboard had `style={{ background: '#1a1a1f' }}` hardcoded from the dark theme, making them unreadable (dark text on dark background).
**Fix:** Replaced all instances with `#ffffff`.

### Issue 5 — Missing `useEffect` Import in Login.jsx
**Problem:** The security fix for rate-limiting added a `useEffect` call to Login.jsx but did not add `useEffect` to the React import statement, causing a runtime crash on the login page.
**Fix:** Added `useEffect` to the import: `import { useState, useEffect } from 'react'`.

---

## 8. Security Audit — Findings & Remediation

A full security audit was conducted against OWASP standards. Six findings were identified and resolved.

### HIGH-1 — Insecure Random ID Generation → Evolved to Serial IDs
**File:** `src/utils/issueId.js`
**Original Finding:** Issue IDs were generated using `Math.random()`, which is not cryptographically secure and is predictable given enough observations.
**Initial Fix:** Replaced with `crypto.getRandomValues(new Uint32Array(1))` — the browser's CSPRNG.

**Subsequent Change (operational requirement):** Issue IDs were later changed from random to sequential — format `YY-NNNN` (e.g. `26-0001`, `26-0002`). The year prefix resets the sequence each calendar year. This allows technicians to determine device arrival order directly from the label, supporting a first-come-first-serve repair queue.

```js
// Final implementation
const yy = new Date().getFullYear().toString().slice(-2)   // "26"
const { count } = await supabase
  .from('tickets').select('id', { count: 'exact', head: true })
  .like('issue_id', `${yy}-%`)
return `${yy}-${String((count ?? 0) + 1).padStart(4, '0')}` // "26-0001"
```

**Security note on predictability:** Sequential IDs are inherently guessable. This is acceptable here because: (a) the system is internal-only, behind email-domain-restricted signup, email verification, and mandatory TOTP 2FA; (b) ticket IDs are display labels — they carry no access control weight; (c) all routes are protected by `RequireAuth`. Sequential IDs would be a concern in a public API where IDs act as access tokens — they do not here.

### HIGH-2 — Phone Number Injection Vector
**File:** `src/pages/IntakeForm.jsx`
**Finding:** Customer phone numbers were accepted without format validation and passed directly to the Twilio SMS API. An unvalidated phone field could be used for SMS injection or to trigger unintended message delivery to arbitrary numbers.
**Fix:** Added strict E.164 format validation before the form submits. The regex `^\+[1-9]\d{7,14}$` ensures the number starts with `+`, followed by a non-zero country code digit, followed by 7–14 digits — matching the international standard.

```js
if (!/^\+[1-9]\d{7,14}$/.test(phoneClean)) {
  setError('Phone must be in E.164 format, e.g. +15550001234')
  return
}
```

### HIGH-3 — Raw Error Message Exposure
**Files:** `src/pages/Setup2FA.jsx`, `src/pages/TicketDetail.jsx`
**Finding:** Raw Supabase and JavaScript error objects were being rendered directly in the UI (`{error.message}`). This can expose internal API details, stack traces, database schema hints, or Supabase-specific error codes to users — information useful for attackers.
**Fix:** All error display paths now return sanitised, user-friendly strings. A `sanitizeAuthError()` function was introduced in Login.jsx to map known Supabase error messages to safe descriptions.

```js
// Before (exposes internals)
setError(err.message)

// After (sanitised)
setError('Failed to load ticket.')
setError('Failed to start 2FA setup — please refresh and try again.')
```

### HIGH-4 — Dead Notification Button (No-Op Security Gap)
**File:** `src/pages/TicketDetail.jsx`
**Finding:** The "Send Notification" button existed in the UI but was wired to nothing — clicking it had no effect and gave no feedback. This is a functional vulnerability in a staff tool: staff could believe a customer had been notified when they had not.
**Fix:** Wired the button to `handleSendNotification()`, which calls the Twilio SMS service via the secure `/api/send-sms` serverless function, updates the `notifications` table, and provides clear sent/error feedback states.

### HIGH-5 — Specific Column Selection (SQL Surface Reduction)
**Files:** `src/pages/TicketDetail.jsx`, `src/pages/TechDashboard.jsx`
**Finding:** Database queries were using `select('*')`, which fetches all columns including potentially sensitive ones added in the future. Over-fetching also increases the data exposed in network responses.
**Fix:** All Supabase queries now specify only the columns required by the component:
`select('id, issue_id, customer_name, customer_phone, device, issue, date_in, date_expected, status, warranty_days, created_by, payments(payment_status, amount_paid)')`

### MEDIUM-1 — Login Rate Limiting Missing
**File:** `src/pages/Login.jsx`
**Finding:** No client-side protection against repeated failed login attempts. While Supabase has server-side rate limiting, the UI provided no feedback and no lockout mechanism, allowing fast automated credential stuffing attempts from the interface.
**Fix:** Implemented client-side attempt tracking: after 5 failed attempts, the login form is locked for 30 seconds with a countdown timer. Attempts reset on successful login.

### MEDIUM-2 — .gitignore Gaps
**File:** `.gitignore`
**Finding:** The repository's `.gitignore` did not cover several sensitive file patterns. Specifically, `SUPABASE_SERVICE_ROLE_KEY` could have been accidentally committed in a local `.env.production` file, and the `.claude/settings.local.json` file (which contains local editor state) was already committed.
**Fix:**
- Removed `.claude/settings.local.json` from git tracking (`git rm --cached`)
- Added coverage for: `.env.production`, `.env.staging`, `*.pem`, `*.key`, `*.p12`, `credentials.json`, `service-account*.json`, `.vercel/`, `.claude/settings.local.json`, `.claude/launch.json`, `coverage/`

---

## 9. Deployment & Infrastructure

### Environment Variables
The following must be set in Vercel's environment variable dashboard. **None of these should ever be in source code.**

| Variable | Used By | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Public anon key (safe for browser) |
| `SUPABASE_URL` | API functions | Same URL, server-side copy |
| `SUPABASE_ANON_KEY` | `/api/get-role`, `/api/send-sms` | Server-side anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/manage-roles` only | Admin auth operations only |
| `TWILIO_ACCOUNT_SID` | `/api/send-sms` | Twilio credentials |
| `TWILIO_AUTH_TOKEN` | `/api/send-sms` | Twilio credentials |
| `TWILIO_FROM_NUMBER` | `/api/send-sms` | Your Twilio phone number |

### Required Supabase Tables
The following tables must exist in the Supabase project with appropriate RLS policies:

```sql
-- Tickets
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  device text NOT NULL,
  issue text NOT NULL,
  date_in date NOT NULL,
  date_expected date NOT NULL,
  status text DEFAULT 'pending',
  warranty_days integer,          -- Added: optional warranty period
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id),
  payment_status text DEFAULT 'unpaid',
  amount_paid numeric DEFAULT 0,
  paid_at timestamptz,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id),
  channel text DEFAULT 'sms',
  sent_by uuid REFERENCES auth.users(id),
  message text,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now()
);

-- Audit Log
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Warranty column (run if table already exists without it)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS warranty_days integer;
```

### Bootstrap: Setting the Owner's Role
Run once in Supabase SQL Editor to give the owner Founder access:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "founder"}'::jsonb
WHERE email = 'owner@electtech.com';
```

After this, the owner logs in, goes to **Users** in the navbar, and can promote any other staff member from Viewer to Technician or Founder from inside the app.

---

## 10. User Roles & Access Control

| Capability | Viewer | Technician | Founder |
|---|:---:|:---:|:---:|
| View tickets | ✓ | ✓ | ✓ |
| Create tickets | — | ✓ | ✓ |
| Update ticket status | — | ✓ | ✓ |
| Update payment info | — | ✓ | ✓ |
| Send customer SMS | — | ✓ | ✓ |
| Print ticket label | ✓ | ✓ | ✓ |
| Founder Dashboard | — | — | ✓ |
| Export CSV | — | — | ✓ |
| Activity Log | — | — | ✓ |
| User Management | — | — | ✓ |

All roles require email verification + TOTP 2FA setup before accessing any protected route. New self-signup accounts begin as Viewer and must be promoted by a Founder.

---

## 11. Stripe — Strategic Recommendation

This section addresses whether Stripe should be integrated into RepairDesk.

### Recommendation: Not Now

From a CTO perspective, adding Stripe to this system at this stage would be solving the wrong problem and introducing unnecessary operational complexity.

### What RepairDesk's Payment Tracking Actually Is

The current `payment_status` / `amount_paid` fields are a **recording system** — they document what already happened at the counter (cash, tap, card via physical terminal). This is appropriate for an internal staff tool. The money changes hands in person; the app just keeps the record.

Stripe solves **online payment collection** — getting money from a customer who is not present. That is a fundamentally different workflow.

### What Stripe Would Actually Require

If Stripe were added today:
- Stripe account setup, KYC, and business verification
- Webhook infrastructure to receive payment events and update ticket status
- A refund flow and partial payment reconciliation logic
- Stripe's fee structure on every transaction (2.9% + 30¢ standard)
- PCI DSS compliance obligations (even with Stripe Checkout, scoped compliance is required)
- A second source of payment truth that must be kept in sync with the existing `payments` table
- Customer-facing communication (payment link delivery, receipt handling)

None of this infrastructure exists today, and none of it is required for the current in-person repair shop workflow.

### When Stripe Would Make Sense

There are two future scenarios where Stripe becomes the right answer:

**Scenario A — Remote payment before pickup**
A customer is notified their device is ready, and the business wants to collect payment before they arrive. A Stripe Payment Link could be generated and sent in the SMS notification. The ticket would auto-mark as paid via webhook. This is a legitimate enhancement for v2.

**Scenario B — In-person card processing**
If Elect Technologies wants to eliminate the physical POS terminal and process card payments directly from this system, **Stripe Terminal** (the card reader hardware) is the right product. This would replace the current manual amount entry with a real charge flow. Budget approximately 2–3 weeks of engineering work and $299+ per reader.

### Summary

| Question | Answer |
|---|---|
| Does RepairDesk need Stripe today? | No |
| Is the current payment tracking sufficient? | Yes, for in-person operations |
| When should we revisit? | When remote payment collection or in-person card processing is a specific business requirement |
| What's the right Stripe product if/when needed? | Stripe Payment Links (remote) or Stripe Terminal (in-person) |

The right engineering principle applies here: **build what the problem requires, not what seems like it might be useful**. The system as built is clean, fast, and maintainable. Adding Stripe speculatively would increase complexity, cost, and attack surface without delivering value to the current workflow.

---

## 12. Known Limitations & Recommended Next Steps

### Immediate (before heavy use)
- Run the `warranty_days` column migration in Supabase (SQL provided in Section 9)
- Run the founder bootstrap SQL to give the owner their role
- Confirm all 8 Vercel environment variables are set correctly
- Test SMS delivery with a real Twilio number in production

### Short-term (within 30 days)
- Add Row Level Security policies to `audit_logs` and `notifications` tables
- Add `updated_at` trigger on `tickets` table for accurate change tracking
- Consider adding password reset flow (currently users must contact Supabase admin)
- Mobile responsiveness pass — the dashboard is functional but not optimised for phones

### Medium-term (v2 considerations)
- Stripe Payment Links for remote pre-pickup payment (see Section 11)
- Ticket search and filtering in dashboards
- Date range filtering in Founder Dashboard
- Email notifications as an alternative to SMS
- Remotion integration for generating video-format repair summaries or receipts (library already installed)

---

*Report compiled from full development session, git commit history, security audit findings, and post-deployment verification. All code changes are traceable to the GitHub repository.*
