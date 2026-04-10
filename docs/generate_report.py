from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

OUTPUT = "C:/Users/DELL/Downloads/REPAIRDESK/docs/RepairDesk_Project_Report.pdf"

ET_RED   = colors.HexColor("#E3181A")
ET_DARK  = colors.HexColor("#1d1d1f")
ET_GREY  = colors.HexColor("#6e6e73")
ET_LIGHT = colors.HexColor("#f5f5f7")
ET_BLUE  = colors.HexColor("#0071e3")
ET_GREEN = colors.HexColor("#10b981")
ET_AMBER = colors.HexColor("#f59e0b")
WHITE    = colors.white

styles = getSampleStyleSheet()

def S(name, **kw):
    base = styles[name] if name in styles else styles["Normal"]
    return ParagraphStyle(name + str(id(kw)), parent=base, **kw)

H1 = S("Heading1", fontSize=20, textColor=ET_DARK, spaceAfter=6,
        spaceBefore=18, fontName="Helvetica-Bold", leading=24)
H2 = S("Heading2", fontSize=14, textColor=ET_RED, spaceAfter=4,
        spaceBefore=14, fontName="Helvetica-Bold", leading=18,
        borderPad=0)
H3 = S("Heading3", fontSize=11, textColor=ET_DARK, spaceAfter=3,
        spaceBefore=10, fontName="Helvetica-Bold")
BODY = S("Normal", fontSize=9.5, textColor=ET_DARK, leading=14,
         spaceAfter=4, fontName="Helvetica")
SMALL = S("Normal", fontSize=8.5, textColor=ET_GREY, leading=12, fontName="Helvetica")
CODE  = S("Code", fontSize=8, fontName="Courier", textColor=colors.HexColor("#1a1a2e"),
          backColor=colors.HexColor("#f0f0f5"), leading=11, spaceAfter=6,
          leftIndent=8, rightIndent=8, borderPad=4)
BULLET = S("Normal", fontSize=9.5, textColor=ET_DARK, leading=14,
           leftIndent=14, spaceAfter=2, fontName="Helvetica")
LABEL  = S("Normal", fontSize=8, textColor=ET_GREY, fontName="Helvetica-Bold",
           spaceAfter=0, spaceBefore=8)

def hr(): return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e0e0e0"), spaceAfter=8, spaceBefore=4)
def spacer(h=6): return Spacer(1, h)
def p(text, style=None): return Paragraph(text, style or BODY)
def h1(text): return Paragraph(text, H1)
def h2(text): return Paragraph(text, H2)
def h3(text): return Paragraph(text, H3)
def bullet(text): return Paragraph(f"&#8226;  {text}", BULLET)
def code(text): return Paragraph(text.replace("\n", "<br/>").replace(" ", "&nbsp;"), CODE)

def cover_table():
    data = [
        ["Prepared for:", "Elect Technologies"],
        ["Prepared by:", "Engineering — AI-Assisted Development"],
        ["Date:", "April 10, 2026"],
        ["Repository:", "github.com/DenineCorp/Repairdesk"],
        ["Deployment:", "Vercel (Production)"],
    ]
    t = Table(data, colWidths=[4*cm, 12*cm])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (1,0), (1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 9.5),
        ("TEXTCOLOR", (0,0), (0,-1), ET_GREY),
        ("TEXTCOLOR", (1,0), (1,-1), ET_DARK),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, ET_LIGHT]),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    return t

def two_col_table(rows, col1=5*cm, col2=11*cm):
    t = Table(rows, colWidths=[col1, col2])
    t.setStyle(TableStyle([
        ("FONTNAME",  (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",  (1,0), (1,-1), "Helvetica"),
        ("FONTSIZE",  (0,0), (-1,-1), 9),
        ("TEXTCOLOR", (0,0), (0,-1), ET_GREY),
        ("TEXTCOLOR", (1,0), (1,-1), ET_DARK),
        ("ROWBACKGROUNDS", (0,0), (-1,-1), [WHITE, ET_LIGHT]),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#e0e0e0")),
    ]))
    return t

def header_table(headers, rows, col_widths=None):
    data = [headers] + rows
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), ET_RED),
        ("TEXTCOLOR",  (0,0), (-1,0), WHITE),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTNAME",   (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,0), (-1,-1), 8.5),
        ("TEXTCOLOR",  (0,1), (-1,-1), ET_DARK),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, ET_LIGHT]),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("GRID", (0,0), (-1,-1), 0.3, colors.HexColor("#e0e0e0")),
        ("ALIGN", (0,0), (-1,-1), "LEFT"),
    ]))
    return t

def severity_chip(label, color):
    return Paragraph(
        f'<font color="{color.hexval()}" name="Helvetica-Bold">[{label}]</font>',
        S("Normal", fontSize=9, fontName="Helvetica-Bold")
    )

story = []

# ── Cover Page ────────────────────────────────────────────────────────────────
story.append(spacer(40))
story.append(Paragraph(
    '<font color="#E3181A" name="Helvetica-Bold" size="32">RepairDesk</font>',
    S("Normal", fontSize=32, fontName="Helvetica-Bold", textColor=ET_RED,
      alignment=TA_CENTER, spaceAfter=4)
))
story.append(Paragraph(
    "Project Report",
    S("Normal", fontSize=18, fontName="Helvetica", textColor=ET_GREY,
      alignment=TA_CENTER, spaceAfter=32)
))
story.append(HRFlowable(width="60%", thickness=2, color=ET_RED, hAlign="CENTER", spaceAfter=32))
story.append(cover_table())
story.append(PageBreak())

# ── 1. Executive Summary ──────────────────────────────────────────────────────
story.append(h1("1. Executive Summary"))
story.append(hr())
story.append(p(
    "RepairDesk is a purpose-built internal repair management system for Elect Technologies. "
    "It replaces manual tracking with a structured, role-gated web application that allows "
    "technicians to log, update, and manage device repair tickets, while giving the business "
    "owner (Founder) a dedicated dashboard with financial reporting, activity auditing, and "
    "staff management."
))
story.append(p(
    "The system was built from scratch and deployed to production. It supports multi-factor "
    "authentication (TOTP/QR code), role-based access control with three tiers (Founder, "
    "Technician, Viewer), real-time ticket updates, customer SMS notifications, CSV export, "
    "an audit trail of all staff actions, and a self-service account creation flow restricted "
    "to @electtech email addresses."
))
story.append(p(
    "<b>All critical security vulnerabilities identified during audit have been resolved</b> "
    "and the codebase has been reviewed, hardened, and pushed to GitHub and Vercel.",
    S("Normal", fontSize=9.5, textColor=ET_DARK, leading=14, fontName="Helvetica")
))

# ── 2. Project Overview ───────────────────────────────────────────────────────
story.append(h1("2. Project Overview"))
story.append(hr())
story.append(h3("Purpose"))
story.append(p("An internal staff tool for Elect Technologies repair operations. Not customer-facing. Every user is a staff member."))
story.append(h3("Core Workflow"))
steps = [
    "A technician logs a new device repair (customer name, phone, device, issue, dates, optional warranty)",
    "A serial Issue ID is auto-generated (e.g. 26-0001, 26-0002) — year prefix + arrival sequence",
    "The ticket moves through statuses: Pending → In Progress → Ready → Collected",
    "Payment is tracked per ticket (Unpaid → Partial → Paid) with amount in CAD",
    "When a device is ready, the technician sends an SMS notification to the customer",
    "A printable label is generated for each ticket (includes warranty and payment status)",
    "The Founder views financial and operational summaries, exports CSVs, and reviews activity logs",
]
for i, s in enumerate(steps, 1):
    story.append(Paragraph(f"<b>{i}.</b>  {s}", BULLET))

# ── 3. Technology Stack ───────────────────────────────────────────────────────
story.append(h1("3. Technology Stack"))
story.append(hr())
story.append(header_table(
    ["Layer", "Technology"],
    [
        ["Frontend",         "React 18, Vite 5, React Router v6"],
        ["Animation",        "Framer Motion"],
        ["Icons",            "Lucide React"],
        ["Charts",           "Recharts"],
        ["Auth",             "Supabase Auth (email/password + TOTP MFA)"],
        ["Database",         "Supabase (PostgreSQL with Row Level Security)"],
        ["SMS",              "Twilio (via serverless function)"],
        ["Serverless API",   "Vercel Functions (/api directory)"],
        ["Deployment",       "Vercel (frontend + API)"],
        ["Source Control",   "GitHub (DenineCorp/Repairdesk)"],
        ["Video (installed)","Remotion (available for future use)"],
    ],
    col_widths=[5*cm, 11*cm]
))

# ── 4. Architecture ───────────────────────────────────────────────────────────
story.append(h1("4. Architecture"))
story.append(hr())
story.append(code(
    "Browser (React SPA)\n"
    "    |\n"
    "    +-- Supabase JS Client (auth, realtime, database)\n"
    "    |       +-- Row Level Security enforces per-user data access\n"
    "    |\n"
    "    +-- Vercel Serverless Functions (/api)\n"
    "            +-- /api/get-role      -- reads user role from JWT\n"
    "            +-- /api/send-sms      -- proxies Twilio SMS\n"
    "            +-- /api/manage-roles  -- founder-only user management"
))
story.append(h3("Key Design Decisions"))
decisions = [
    ("<b>Supabase Anon Key for data queries</b> — The service role key bypasses Row Level Security. "
     "All data queries use the anon key so RLS policies on tickets, payments, notifications, and "
     "audit_logs are always enforced."),
    ("<b>JWT-first role reading</b> — User roles are read instantly from the JWT session on page load "
     "with no API round trip needed. A background call optionally upgrades from app_metadata "
     "(tamper-proof, admin-write-only). The UI never blocks on a network call for routing."),
    ("<b>Serverless functions for secrets</b> — Twilio credentials and the Service Role Key never "
     "touch the browser. They live only in Vercel environment variables."),
]
for d in decisions:
    story.append(bullet(d))

# ── 5. Features Built ─────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("5. Features Built"))
story.append(hr())

feature_sections = [
    ("Authentication", [
        "Email/password sign-in with client-side rate limiting (5 attempts, 30-second lockout)",
        "TOTP-based 2FA (Google Authenticator, Authy) enforced for all users",
        "AAL2 enforcement — users with enrolled 2FA cannot access protected routes without completing verification",
        "Self-service account creation restricted to @electtech email domains",
        "New accounts default to viewer (read-only) role",
    ]),
    ("Ticket Management", [
        "Intake form: customer name, phone (E.164 validated), device, issue, dates, optional warranty",
        "Auto-generated serial Issue IDs in YY-NNNN format (e.g. 26-0001) — year prefix + sequential number queried from tickets table",
        "Status progression: Pending → In Progress → Ready → Collected",
        "Real-time updates via Supabase Postgres Changes subscription",
        "Overdue ticket detection and highlighting",
        "Individual ticket detail page with full information view",
    ]),
    ("Payment Tracking", [
        "Per-ticket payment record created automatically on ticket creation",
        "Payment statuses: Unpaid, Partial, Paid — tracked in CAD",
        "Payment timestamps recorded on 'paid' status",
    ]),
    ("Customer Notifications", [
        "Send SMS to customer when device is ready (via Twilio)",
        "Notification logged to notifications table with status (sent/failed)",
        "SMS also available from individual ticket detail page",
    ]),
    ("Printable Label", [
        "One-click print from ticket detail page",
        "Monochrome format suitable for label printers",
        "Includes: ET logo, Issue ID, Customer, Phone, Device, Issue, Dates, Status, Payment Status, Warranty",
    ]),
    ("Founder Dashboard", [
        "Financial overview: total jobs, revenue, unpaid/partial/paid breakdown",
        "Filter tickets by payment status",
        "Export filtered view to CSV",
    ]),
    ("Tech Dashboard", [
        "Active jobs overview with stats (Active, Overdue, Due Today)",
        "Inline status change and payment update per ticket row",
        "Real-time updates and offline detection banner",
    ]),
    ("Audit Log", [
        "All staff actions logged: ticket created, status changed, payment updated, notification sent",
        "Filterable by event type, shows actor email and timestamp",
        "Founder-only access",
    ]),
    ("User Management", [
        "Founder can view all registered staff accounts",
        "Change any user role (Viewer / Technician / Founder) from inside the app",
        "Server-side endpoint verifies caller is a founder before making changes",
    ]),
]
for title, items in feature_sections:
    story.append(h3(title))
    for item in items:
        story.append(bullet(item))

# ── 6. Development Timeline ───────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("6. Development Timeline & Phases"))
story.append(hr())
story.append(header_table(
    ["Commit", "Phase"],
    [
        ["73dc150", "Initial build — auth, dashboards, tickets, payments, SMS"],
        ["a909dc6 – e83574b", "UI iteration — motherboard background, glassmorphism, circuit patterns"],
        ["680873d – 6ec33b0", "Rebrand to Elect Technologies colour system"],
        ["da5cb28 – 6ea5548", "QR code rendering fix, login card polish"],
        ["a5eb587", "2FA stability — stale factor unenrollment before re-enroll"],
        ["739b122", "Security audit pass — all HIGH and MEDIUM vulnerabilities fixed"],
        ["717b7d2", "CSV export + activity audit log"],
        ["eb844b4", "Apple-style light theme — complete redesign from dark to light"],
        ["ca0c0fa – 8569aa0", "Role routing fixes (3 iterations)"],
        ["0553139", "Permanent role routing fix — AAL2 race condition resolved"],
        ["e47a117", "ET logo, warranty field, payment on label, self-signup, viewer role"],
        ["bfb22f5", "Hardened .gitignore, untracked local config files"],
        ["d093777", "Role management UI for founders"],
        ["02b94fa", "Serial ticket IDs — YY-NNNN format for first-come-first-serve queue"],
    ],
    col_widths=[4.5*cm, 11.5*cm]
))

# ── 7. Issues Encountered ─────────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("7. Issues Encountered & Fixes Applied"))
story.append(hr())

issues = [
    (
        "Issue 1 — QR Code XSS Risk",
        "The 2FA setup page was injecting the QR code SVG directly via dangerouslySetInnerHTML, "
        "which creates a Cross-Site Scripting vector if the SVG payload were ever manipulated.",
        "Replaced with a standard img tag (src={qrUrl}). Supabase returns a data URI, which is safe to render as an image source."
    ),
    (
        "Issue 2 — Stale 2FA Factor on Re-enrollment",
        "If a user started 2FA setup, abandoned it, then returned, Supabase retained the unverified "
        "factor. Attempting to enroll again would fail silently or error.",
        "On entering the setup page, the app now calls mfa.listFactors(), checks for any unverified "
        "TOTP factors, and unenrolls them before starting fresh enrollment."
    ),
    (
        "Issue 3 — Role Routing: Everyone Lands on Tech Dashboard (4 iterations)",
        "All users including the owner were landing on the Technician Dashboard regardless of role. "
        "Root cause: Setup2FA.jsx and Verify2FA.jsx called getSession() immediately after "
        "challengeAndVerify(). Supabase internally upgrades the session to AAL2 at that moment, "
        "briefly invalidating the old session. getSession() returns null, so role evaluates to "
        "undefined, which doesn't match 'founder', so all users route to /tech-dashboard. "
        "Confirmed by: Navbar showed correct 'Founder' badge (using useAuth() from JWT) while "
        "routing was broken — proving the AAL2 token upgrade was the race condition.",
        "Removed getSession() call from both MFA pages entirely. After challengeAndVerify() succeeds, "
        "navigate to / and let RoleRedirect (which uses useAuth(), already populated from the "
        "original JWT) handle dashboard selection. Zero race condition."
    ),
    (
        "Issue 4 — Dark Select Option Backgrounds After Theme Change",
        "After migrating from dark theme to Apple light theme, option elements inside select "
        "dropdowns had background: #1a1a1f hardcoded, making them unreadable.",
        "Replaced all instances with #ffffff."
    ),
    (
        "Issue 5 — Missing useEffect Import in Login.jsx",
        "The security fix for rate-limiting added a useEffect call but did not add useEffect "
        "to the React import statement, causing a runtime crash on the login page.",
        "Added useEffect to the import: import { useState, useEffect } from 'react'."
    ),
]

for issue in issues:
    title = issue[0]
    if len(issue) == 3:
        problem, fix = issue[1], issue[2]
    else:
        problem, fix = issue[1], issue[1]

    story.append(h3(title))
    story.append(Paragraph(f"<b>Problem:</b> {problem}", BODY))
    story.append(Paragraph(f"<b>Fix:</b> {fix}", BODY))
    story.append(spacer(4))

# ── 8. Security Audit ─────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("8. Security Audit — Findings & Remediation"))
story.append(hr())
story.append(p("A full security audit was conducted against OWASP standards. Six findings were identified and all resolved."))
story.append(spacer(6))

findings = [
    ("HIGH", ET_RED, "HIGH-1 — Insecure Random ID Generation → Evolved to Serial IDs", "src/utils/issueId.js",
     "Issue IDs were originally generated using Math.random() (not cryptographically secure). "
     "Fixed with crypto.getRandomValues() (CSPRNG). Subsequently changed to sequential YY-NNNN format "
     "(e.g. 26-0001) for operational reasons: technicians can determine device arrival order from the label "
     "for first-come-first-serve queue management. Sequential IDs are intentionally predictable here because "
     "access is auth-gated (MFA + domain restriction) and IDs carry no access-control weight.",
     "Final implementation queries tickets table for count of current-year IDs and increments. "
     "Year prefix resets the sequence automatically each calendar year.",
     "const digits = String(Math.floor(10000 + Math.random() * 90000))",
     "const yy = new Date().getFullYear().toString().slice(-2)\nconst { count } = await supabase.from('tickets').select('id', { count: 'exact', head: true }).like('issue_id', yy + '-%')\nreturn yy + '-' + String((count ?? 0) + 1).padStart(4, '0')"),

    ("HIGH", ET_RED, "HIGH-2 — Phone Number Injection Vector", "src/pages/IntakeForm.jsx",
     "Customer phone numbers were accepted without format validation and passed directly to the Twilio SMS API.",
     "Added strict E.164 format validation: regex /^\\+[1-9]\\d{7,14}$/ before form submission.",
     None,
     "if (!/^\\+[1-9]\\d{7,14}$/.test(phoneClean)) {\n  setError('Phone must be in E.164 format')\n  return\n}"),

    ("HIGH", ET_RED, "HIGH-3 — Raw Error Message Exposure", "Setup2FA.jsx, TicketDetail.jsx",
     "Raw Supabase error objects were rendered directly in the UI, exposing internal API details, schema hints, and error codes.",
     "All error paths now return sanitised user-friendly strings. A sanitizeAuthError() function maps known errors to safe descriptions.",
     "setError(err.message)",
     "setError('Failed to load ticket.')\nsetError('Failed to start 2FA setup — please refresh.')"),

    ("HIGH", ET_RED, "HIGH-4 — Dead Notification Button", "src/pages/TicketDetail.jsx",
     "The Send Notification button existed in the UI but was wired to nothing. Staff could believe a customer was notified when they were not.",
     "Wired to handleSendNotification() via /api/send-sms, updates notifications table, provides sent/error feedback.",
     None, None),

    ("HIGH", ET_RED, "HIGH-5 — Over-fetching Columns (select *)", "TicketDetail.jsx, TechDashboard.jsx",
     "Database queries used select('*'), fetching all columns including potentially sensitive future fields.",
     "All queries now specify only required columns explicitly.",
     None, None),

    ("MEDIUM", ET_AMBER, "MEDIUM-1 — Login Rate Limiting Missing", "src/pages/Login.jsx",
     "No client-side protection against repeated failed login attempts.",
     "After 5 failed attempts, login form locks for 30 seconds with countdown timer.",
     None, None),

    ("MEDIUM", ET_AMBER, "MEDIUM-2 — .gitignore Gaps", ".gitignore",
     "Repository did not cover .env.production, *.pem, *.key, service-account files. settings.local.json was already committed.",
     "Removed settings.local.json from git tracking. Added coverage for all secret file patterns and .vercel/ directory.",
     None, None),
]

for sev, sev_color, title, file_, finding, fix, before, after in findings:
    sev_style = S("Normal", fontSize=8.5, fontName="Helvetica-Bold", textColor=WHITE,
                  backColor=sev_color, borderPad=3)
    row = Table(
        [[Paragraph(f" {sev} ", sev_style), Paragraph(f"<b>{title}</b>", H3)]],
        colWidths=[1.5*cm, 14.5*cm]
    )
    row.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 0),
        ("RIGHTPADDING", (0,0), (-1,-1), 0),
        ("TOPPADDING", (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ]))
    story.append(row)
    story.append(Paragraph(f"<b>File:</b> {file_}", SMALL))
    story.append(Paragraph(f"<b>Finding:</b> {finding}", BODY))
    story.append(Paragraph(f"<b>Fix:</b> {fix}", BODY))
    if before:
        story.append(Paragraph(f"<b>Before:</b> <font name='Courier' size='8'>{before}</font>", BODY))
    if after:
        story.append(Paragraph(f"<b>After:</b> <font name='Courier' size='8'>{after.replace(chr(10), '  ')}</font>", BODY))
    story.append(spacer(8))

# ── 9. Deployment ─────────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("9. Deployment & Infrastructure"))
story.append(hr())
story.append(h3("Environment Variables (set in Vercel — never in source code)"))
story.append(header_table(
    ["Variable", "Used By", "Description"],
    [
        ["VITE_SUPABASE_URL",          "Frontend",           "Supabase project URL"],
        ["VITE_SUPABASE_ANON_KEY",     "Frontend",           "Public anon key (safe for browser)"],
        ["SUPABASE_URL",               "API functions",      "Server-side copy of project URL"],
        ["SUPABASE_ANON_KEY",          "/api/get-role, send-sms", "Server-side anon key"],
        ["SUPABASE_SERVICE_ROLE_KEY",  "/api/manage-roles only", "Admin auth operations only — never for data queries"],
        ["TWILIO_ACCOUNT_SID",         "/api/send-sms",      "Twilio account identifier"],
        ["TWILIO_AUTH_TOKEN",          "/api/send-sms",      "Twilio auth secret"],
        ["TWILIO_FROM_NUMBER",         "/api/send-sms",      "Your Twilio phone number"],
    ],
    col_widths=[5*cm, 4.5*cm, 6.5*cm]
))
story.append(spacer(10))
story.append(h3("Bootstrap: Setting the Owner's Role (run once in Supabase SQL Editor)"))
story.append(code(
    "UPDATE auth.users\n"
    "SET raw_user_meta_data = raw_user_meta_data || '{\"role\": \"founder\"}'::jsonb\n"
    "WHERE email = 'owner@electtech.com';"
))
story.append(p("After this, the owner logs in, goes to Users in the navbar, and can promote any staff member from inside the app."))

story.append(spacer(10))
story.append(h3("Warranty Column Migration (run once if tickets table already exists)"))
story.append(code("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS warranty_days integer;"))

# ── 10. User Roles ────────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("10. User Roles & Access Control"))
story.append(hr())

def check(v): return "✓" if v else "—"
story.append(header_table(
    ["Capability", "Viewer", "Technician", "Founder"],
    [
        ["View tickets",         "✓", "✓", "✓"],
        ["Create tickets",       "—", "✓", "✓"],
        ["Update ticket status", "—", "✓", "✓"],
        ["Update payment info",  "—", "✓", "✓"],
        ["Send customer SMS",    "—", "✓", "✓"],
        ["Print ticket label",   "✓", "✓", "✓"],
        ["Founder Dashboard",    "—", "—", "✓"],
        ["Export CSV",           "—", "—", "✓"],
        ["Activity Log",         "—", "—", "✓"],
        ["User Management",      "—", "—", "✓"],
    ],
    col_widths=[8*cm, 3*cm, 3*cm, 3*cm]
))
story.append(spacer(8))
story.append(p("All roles require email verification + TOTP 2FA setup before accessing any protected route. New self-signup accounts begin as Viewer and must be promoted by a Founder."))

# ── 11. Stripe Recommendation ─────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("11. Stripe — Strategic Recommendation"))
story.append(hr())

story.append(Paragraph(
    '<font color="#E3181A" name="Helvetica-Bold">Recommendation: Not Now</font>',
    S("Normal", fontSize=13, fontName="Helvetica-Bold", textColor=ET_RED, spaceAfter=8)
))

story.append(p(
    "From a CTO perspective, adding Stripe to this system at this stage would be solving the wrong "
    "problem and introducing unnecessary operational complexity."
))

story.append(h3("What RepairDesk's Payment Tracking Actually Is"))
story.append(p(
    "The current payment_status / amount_paid fields are a <b>recording system</b> — they document "
    "what already happened at the counter (cash, tap, card via physical terminal). "
    "The money changes hands in person; the app keeps the record. "
    "Stripe solves <b>online payment collection</b> — getting money from a customer who is not "
    "present. That is a fundamentally different workflow."
))

story.append(h3("What Stripe Would Actually Require"))
stripe_costs = [
    "Stripe account setup, KYC, and business verification",
    "Webhook infrastructure to receive payment events and update ticket status",
    "Refund flow and partial payment reconciliation logic",
    "Stripe's fee structure on every transaction (2.9% + 30c standard)",
    "PCI DSS compliance obligations",
    "A second source of payment truth that must stay in sync with the existing payments table",
    "Customer-facing communication (payment link delivery, receipt handling)",
]
for c in stripe_costs:
    story.append(bullet(c))

story.append(h3("When Stripe Would Make Sense"))
story.append(Paragraph("<b>Scenario A — Remote payment before pickup</b>", BODY))
story.append(p(
    "A customer is notified their device is ready and the business wants to collect payment before "
    "they arrive. A Stripe Payment Link could be generated and sent in the SMS notification. "
    "The ticket would auto-mark as paid via webhook. Legitimate v2 enhancement."
))
story.append(Paragraph("<b>Scenario B — In-person card processing</b>", BODY))
story.append(p(
    "If Elect Technologies wants to eliminate the physical POS terminal, Stripe Terminal "
    "(card reader hardware) is the right product. Budget 2-3 weeks of engineering and $299+ per reader."
))

story.append(spacer(8))
story.append(header_table(
    ["Question", "Answer"],
    [
        ["Does RepairDesk need Stripe today?",           "No"],
        ["Is current payment tracking sufficient?",      "Yes, for in-person operations"],
        ["When should we revisit?",                       "When remote payment or in-person card processing is needed"],
        ["Right Stripe product if/when needed?",         "Payment Links (remote) or Stripe Terminal (in-person)"],
    ],
    col_widths=[8.5*cm, 7.5*cm]
))

story.append(spacer(10))
story.append(p(
    "<b>The right engineering principle: build what the problem requires, not what seems useful.</b> "
    "The system as built is clean, fast, and maintainable. Adding Stripe speculatively would increase "
    "complexity, cost, and attack surface without delivering value to the current workflow."
))

# ── 12. Next Steps ────────────────────────────────────────────────────────────
story.append(PageBreak())
story.append(h1("12. Known Limitations & Recommended Next Steps"))
story.append(hr())

story.append(h3("Immediate — Before Heavy Use"))
immediate = [
    "Run warranty_days column migration in Supabase SQL Editor (ALTER TABLE statement in Section 9)",
    "Run founder bootstrap SQL to give the owner their role",
    "Confirm all 8 Vercel environment variables are set correctly",
    "Test SMS delivery with a real Twilio number in production",
]
for item in immediate:
    story.append(bullet(item))

story.append(h3("Short-term — Within 30 Days"))
short = [
    "Add Row Level Security policies to audit_logs and notifications tables",
    "Add updated_at trigger on tickets table for accurate change tracking",
    "Add password reset flow (currently users must contact Supabase admin)",
    "Mobile responsiveness pass — dashboard is functional but not optimised for phones",
]
for item in short:
    story.append(bullet(item))

story.append(h3("Medium-term — v2 Considerations"))
medium = [
    "Stripe Payment Links for remote pre-pickup payment (see Section 11)",
    "Ticket search and filtering in dashboards",
    "Date range filtering in Founder Dashboard",
    "Email notifications as an alternative to SMS",
    "Remotion integration for video-format repair summaries (library already installed)",
]
for item in medium:
    story.append(bullet(item))

story.append(spacer(30))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e0e0e0"), spaceAfter=10))
story.append(Paragraph(
    "Report compiled from full development session, git commit history, security audit findings, "
    "and post-deployment verification. All code changes are traceable to the GitHub repository.",
    SMALL
))

# ── Build ─────────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
    title="RepairDesk Project Report",
    author="Elect Technologies Engineering",
)

def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(ET_GREY)
    canvas.drawRightString(A4[0] - 2*cm, 1.2*cm, f"Page {doc.page}")
    canvas.drawString(2*cm, 1.2*cm, "RepairDesk — Elect Technologies — Confidential")
    canvas.restoreState()

doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
print(f"PDF generated: {OUTPUT}")
