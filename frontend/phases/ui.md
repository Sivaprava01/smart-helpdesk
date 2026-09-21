# Smart-HelpDesk: Complete UI/UX Specification & Frontend Prompt

> **Prompt Purpose**: Use this comprehensive, production-grade specification to generate high-fidelity, modern, and operationally rigorous UI screens for the **Smart-HelpDesk** web application.

---

## 1. Executive Product & Architecture Context

**Smart-HelpDesk** is an intelligent residential and facility maintenance helpdesk and automated technician dispatch platform. It manages service requests end-to-end: from initial resident ticket submission, deterministic multi-factor technician routing, real-time assignment offers (with acceptance, decline, and deferral handling), on-site job execution, and two-step customer resolution verification to automated reopening and live fallback rerouting.

### Core Backend Alignment & Architecture
The UI directly maps to an established FastAPI + PostgreSQL backend implementing:
- **Separation of Ticket vs Assignment Status**:
  - `TicketStatus`: `PENDING` $\rightarrow$ `ROUTING` $\rightarrow$ `ASSIGNED` $\rightarrow$ `ARRIVED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `AWAITING_CUSTOMER_CONFIRMATION` $\rightarrow$ `CLOSED` (or `REOPENED` $\rightarrow$ `ROUTING` / `REOPENED`).
  - `AssignmentStatus`: `OFFERED` $\rightarrow$ `DEFERRED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `DECLINED` $\rightarrow$ `EXPIRED` $\rightarrow$ `COMPLETED`.
- **5-Factor Deterministic Routing Engine**:
  - Location Proximity (20%) + Overall Rating (25%) + Customer History Affinity (25%) + Reopen Rate Reliability (15%) + Workload Availability (15%).
- **Strict Customer Confirmation Guard**:
  - Technician work completion does **not** close the ticket. The ticket moves to `AWAITING_CUSTOMER_CONFIRMATION`. The customer must confirm resolution (`[YES]` $\rightarrow$ `CLOSED`, `[NO]` $\rightarrow$ `REOPENED` with immediate live fallback rerouting excluding previous technicians).

---

## 2. Global Design Direction & Visual Tokens

The interface is a **mission-critical operational dashboard**, not a marketing landing page and not an AI gimmick. It must feel structured, calm, information-dense, and effortless for field technicians, dispatchers, and residents alike.

### Visual Style Tokens
- **Background**: Neutral Cool Gray / Slate (`#F8FAFC` to `#F1F5F9`).
- **Surfaces**: Crisp white (`#FFFFFF`) with subtle border lines (`#E2E8F0`) and soft, elevated drop shadows (`shadow-sm` / `shadow-md`).
- **Typography**: Clean sans-serif (e.g., Inter, Plus Jakarta Sans, or Outfit). High readability, strict font weight hierarchy (Regular 400, Medium 500, Semibold 600, Bold 700).
- **Primary Brand Color**: Deep Indigo / Sapphire (`#4F46E5` / `#3B82F6`) for primary interactive elements, active tabs, and primary action buttons.
- **Semantic Status Palette**:
  - `PENDING` / `CANCELLED`: Slate Gray (`bg-slate-100 text-slate-700 border-slate-300`)
  - `ROUTING`: Vivid Blue with subtle pulse indicator (`bg-blue-50 text-blue-700 border-blue-300`)
  - `ASSIGNED`: Deep Indigo (`bg-indigo-50 text-indigo-700 border-indigo-300`)
  - `ARRIVED`: Violet / Purple (`bg-purple-50 text-purple-700 border-purple-300`)
  - `IN_PROGRESS`: Amber / Warm Orange (`bg-amber-50 text-amber-700 border-amber-300`)
  - `AWAITING_CUSTOMER_CONFIRMATION`: Cyan / Teal (`bg-teal-50 text-teal-700 border-teal-300`)
  - `CLOSED` (Resolved): Emerald Green (`bg-emerald-50 text-emerald-700 border-emerald-300`)
  - `REOPENED` (Unresolved): Rose Red / Crimson (`bg-rose-50 text-rose-700 border-rose-300`)

---

## 3. Persistent Layout & Navigation

### Left Sidebar (Collapsible Desktop & Mobile Drawer)
- **Brand Header**: Smart-HelpDesk logo icon + product name + environment badge ("Live Ops").
- **Navigation Links** (with active indicator and badge counters):
  1. 📊 **Dashboard** (Executive & Dispatcher Overview)
  2. 🎫 **All Tickets** (Filter hub, searchable table, pagination)
  3. 🛠️ **My Jobs / Technician Portal** (Offers, active jobs, field execution flow)
  4. 👨‍🔧 **Technicians & Capacity** (Shift status, skill categories, workload limits)
  5. 🧭 **Routing & Fallback Monitor** (Dispatch triggers, expired offer processing)
  6. 👥 **Customers & Residents** (Customer profiles, interaction histories)
  7. ⚙️ **Settings** (Categories, zones, timeout policies)
- **Footer Profile Card**: User avatar, Name, Role badge (`Admin / Dispatcher` vs `Technician` vs `Customer`), Shift Status toggle (`On Duty` / `Off Duty`), and Logout button.

### Top Navigation Bar
- **Breadcrumbs**: e.g., `Tickets > TK-1082 > Service Execution`.
- **Global Search Bar**: Quick search by Ticket UUID, Customer Name, Phone, or Zone.
- **Quick Action Button**: Prominent `+ New Ticket` button.
- **Notification Center**: Bell icon showing real-time offer updates, expiration alerts, and reopen notifications.

---

## 4. Complete Screen Specifications

---

### SCREEN 0A: Authentication & Sign-In (`/login`)
*Target Personas: Dispatchers, Field Technicians, and Residents*

- **Visual Layout**:
  - Modern split-screen layout:
    - **Left Hero Panel (40% width)**: Deep Slate/Indigo background with clean geometric pattern, product branding, key feature highlights (*"Automated Field Routing • Real-time Dispatch • Customer-Verified Outcomes"*), and trust badge.
    - **Right Form Panel (60% width)**: Centered, clean authentication card.
- **Header**:
  - Smart-HelpDesk logo + *"Sign In to Operations Portal"* + subtitle *"Enter your credentials to access your dashboard."*
- **Role / Persona Demo Fast-Switcher (Top Pill Tabs)**:
  - `[ 🛡️ Helpdesk Admin / Dispatcher ]`
  - `[ 🔧 Service Technician ]`
  - `[ 🏠 Resident / Customer ]`
  - *Clicking a tab auto-fills sample credentials for instant testing/demoing.*
- **Form Inputs**:
  - **Email Address**: Input with email icon, validation state, placeholder `name@smarthelpdesk.com`.
  - **Password**: Input with lock icon, hide/show password eye toggle.
  - **Remember Me & Forgot Password**: Row containing `"Remember this device for 30 days"` checkbox and a `"Forgot password?"` link.
- **Primary CTA**:
  - `Sign In to Dashboard` (Full-width Primary Indigo button with subtle hover lift).
- **Alternative SSO Options**:
  - Separator line: *"Or continue with enterprise SSO"*
  - Buttons: Google Workspace SSO, Microsoft Entra ID / SAML.
- **Footer**:
  - Link: *"Don't have a resident account? Create Account"*
  - Security footer: *"Encrypted with 256-bit SSL • Smart-HelpDesk v1.0"*

---

### SCREEN 0B: Resident Registration / Sign-Up (`/register`)
*Target Persona: New Residents / Apartment Owners*

- **Visual Layout**:
  - Focused, clean card layout matching brand aesthetic.
- **Header**:
  - Smart-HelpDesk logo + *"Create Resident Account"* + subtitle *"Register to submit and track facility maintenance requests in real time."*
- **Form Fields (Two-Column Responsive Grid)**:
  - **Full Name**: Text input (`e.g. Siva Prava`).
  - **Email Address**: Work or personal email address.
  - **Phone Number**: International phone input with country code selector (`e.g. +91 98765 43210`).
  - **Default Location / Unit**: Building/Tower dropdown (`Tower A`, `Tower B`, `Tower C`, `Tower D`, `Tower E`) + Flat/Unit Number input (`e.g. Flat 402`).
  - **Password**: Password input with live **Password Strength Indicator** (Min 8 chars, 1 number, 1 uppercase).
  - **Confirm Password**: Password verification input.
- **Agreements**:
  - Checkbox: *"I agree to the Terms of Service and Privacy Policy for resident service dispatch."*
- **Primary CTA**:
  - `Register & Access Helpdesk` (Full-width Primary button).
- **Footer**:
  - Link: *"Already registered? Sign in here"*.

---

### SCREEN 0C: Password Recovery / Reset Flow (`/forgot-password`)
*Target Persona: Any User*

- **Visual Layout**:
  - Centered recovery card.
- **Step 1 — Email Request**:
  - Instruction: *"Enter your registered email address and we'll send you an instant reset link."*
  - Input: Email address.
  - Button: `Send Reset Link`.
- **Step 2 — Confirmation Banner**:
  - Emerald checkmark icon: *"Password reset instructions sent to siva@example.com. Check your inbox."*
- **Step 3 — New Password Input**:
  - New password input + confirm password input + `Update Password & Log In` CTA.

---

### SCREEN 1: Operations & Dispatcher Dashboard (`/dashboard`)
*Target Persona: Helpdesk Manager / Dispatcher*

- **Top KPI Cards Row** (Compact, high-contrast metric tiles):
  1. **Active Tickets**: Total currently unclosed tickets.
  2. **Pending Dispatch**: Tickets in `PENDING` awaiting assignment dispatch.
  3. **Offers in Routing**: Active assignment offers currently pending technician response.
  4. **Active in Progress**: Technicians on-site working (`ARRIVED` + `IN_PROGRESS`).
  5. **Awaiting Confirmation**: Completed jobs waiting for customer approval.
  6. **Reopen Rate %**: Real-time quality metric with trend indicator.

- **Main Content Split (2:1 Grid)**:
  - **Left Section — Live Service Queue Table**:
    - Columns: Ticket ID, Customer/Contact, Service Category (Plumbing, Electrical, HVAC, etc.), Zone/Location, Status Badge, Active Technician, Scheduling Badge (ASAP vs Scheduled Time), Quick Actions (`Dispatch`, `Preview Routing`, `View Details`).
    - Quick-filter pill buttons: `All`, `Needs Attention`, `Routing (Offers)`, `In Progress`, `Awaiting Confirmation`.
  - **Right Section — Live Technician Availability & Workload Gauge**:
    - Compact card list of technicians grouped by On-Duty vs Off-Duty.
    - Each technician shows: Avatar, Full Name, Skill tags, Zone, Star Rating (e.g. `4.85 ★`), and a visual Workload Progress Bar (e.g. `3/5 Active Jobs` with color shifting from green to amber to red when at capacity).
  - **Bottom Section — Operational Activity Timeline**:
    - Chronological log of recent lifecycle events (e.g., *"Technician Ravi accepted Ticket #1024"*, *"Ticket #1019 reopened by customer Alice"*, *"Fallback rerouted Ticket #1019 to Technician Kumar"*).

---

### SCREEN 2: Ticket Hub & Management Hub (`/tickets`)
*Target Persona: Support Staff & Dispatchers*

- **Header Controls**:
  - Filter Bar: Search by text, Category multi-select, Status multi-select, Zone filter, Scheduling type (ASAP / Scheduled), Assigned Technician filter.
  - Sort dropdown: `Created At (Newest)`, `Scheduled Time`, `Highest Priority`, `Last Updated`.
  - Batch Action: `Process Expired Offers` trigger button.
- **Data Table**:
  - Columns:
    - **ID**: Compact UUID / shortcode with copy button.
    - **Customer**: Name + Phone number.
    - **Category**: Icon + Label (e.g., 🔧 Plumbing, ⚡ Electrical, ❄️ HVAC, 🪚 Carpentry, 🧹 Cleaning, 🎨 Painting).
    - **Location**: Building/Tower + Flat/Unit (e.g. `Tower A - Apt 402`).
    - **Schedule Type**: ASAP badge or Scheduled Datetime tag with countdown.
    - **Status**: Distinct colored badge matching backend enum.
    - **Assigned Technician**: Avatar + Name (or "Unassigned" button).
    - **Actions**: `View`, `Assign`, `Cancel` (if pending).
  - Pagination bar with rows per page selector (`10`, `25`, `50`).

---

### SCREEN 3: Create Service Request (`/tickets/new`)
*Target Persona: Customer, Frontdesk, or Dispatcher*

- **Clean Card-Based Multi-Step / Single-Page Form**:
  1. **Customer & Contact Information**:
     - Customer selector (auto-completes existing resident profiles) or inputs for New Customer (`Full Name`, `Email`, `Phone Number`).
     - Contact person on site & Contact phone number.
  2. **Service Details**:
     - Category Grid: Selectable visual cards with icons (Plumbing, Electrical, HVAC, Carpentry, Appliance Repair, Cleaning, Painting).
     - Service Location / Unit: Tower/Building dropdown + Flat/Unit number.
     - Problem Description: Rich textarea with helper examples and character counter.
  3. **Scheduling Options**:
     - Toggle: **[ ASAP Service (Immediate Dispatch) ]** vs **[ Scheduled for Future Date & Time ]**.
     - If Scheduled: Interactive Date and Time picker with validation enforcing future timestamps.
  4. **Footer Buttons**:
     - `Cancel` (Secondary Gray) and `Create & Submit Ticket` (Primary Indigo).
     - Optional quick checkbox: *"Automatically trigger routing dispatch upon creation"*.

---

### SCREEN 4: Ticket Details & Service Lifecycle Hub (`/tickets/:id`)
*Target Persona: Dispatcher, Supervisor, or Customer Support Specialist*

- **Header Bar**:
  - Ticket ID, Creation timestamp, Category icon, and large current `TicketStatus` badge.
  - **Dynamic Interactive Lifecycle Stepper**:
    - Visual timeline: `[1. Created]` $\rightarrow$ `[2. Dispatched]` $\rightarrow$ `[3. Assigned]` $\rightarrow$ `[4. Arrived]` $\rightarrow$ `[5. In Progress]` $\rightarrow$ `[6. Awaiting Confirmation]` $\rightarrow$ `[7. Closed]`.
    - Shows completed steps in green, current active step in pulsing blue/amber, upcoming steps in gray. If reopened, highlights a Red `Reopened & Rerouting` branch.

- **Two-Column Split Layout**:
  - **Left Main Column (Audit & Details)**:
    - **Problem Summary Card**: Contact name, phone, full location, preferred time, full description.
    - **Historical Service Attempts Timeline**:
      - Chronological cards for every assignment attempt (`TechnicianAssignment`).
      - For past declined/expired attempts: Shows technician name, status (`DECLINED` with reason/note or `EXPIRED`), offered timestamp, and responded timestamp.
      - For active/completed attempts: Shows `Accepted At`, `Arrived At`, `Work Started At`, `Work Completed At`, and `Technician Completion Note`.
    - **Customer Feedback & Review Card** (Visible if customer has responded):
      - Outcome banner: *"Issue Confirmed Resolved"* (Green) or *"Issue Reported Unresolved"* (Red).
      - Star Rating display (1 to 5 stars).
      - Customer's verbatim feedback comment.
  - **Right Sidebar (Metadata & Dispatch Controls)**:
    - **Active Assignment Card**:
      - Current assigned technician avatar, rating, current workload bar, and direct contact details.
      - If in `ROUTING` status: Displays an active **10-minute offer countdown timer** with progress circle.
    - **Routing Preview Drawer / Widget**:
      - Button: `Preview Deterministic Routing`.
      - Displays top 3 candidate scores with breakdown bars:
        - Proximity Score (20%)
        - Overall Rating (25%)
        - Customer History Affinity (25%)
        - Reopen Rate Reliability (15%)
        - Workload Availability (15%)
    - **Dispatcher Action Panel**:
      - `Dispatch Offer` (if PENDING)
      - `Cancel Ticket` (if PENDING)
      - `Process Expired Offer` (if timed out)

---

### SCREEN 5: Technician Portal — Field & "My Jobs" View (`/technician/jobs`)
*Target Persona: Service Technician (Mobile-First & Tablet/Desktop Responsive)*

- **Top Shift Bar**:
  - Technician Name, Shift status toggle (`On Duty` 🟢 / `Off Duty` ⚪), Today's Completed Jobs count, Current Workload gauge (`2/5`).

- **Section A: Active Offer Card (Urgent Decision Required)**:
  - When an offer is dispatched to this technician (`AssignmentStatus.OFFERED` or `DEFERRED`):
  - Highlighted high-priority card with **10-Minute Response Countdown Timer**:
    - Details: Category, Building/Unit location, Customer problem description.
    - 3 Clear Action Buttons:
      1. **Accept Job** (Large Green Button) $\rightarrow$ Transitions ticket to `ASSIGNED`, increments workload, opens directions/job details.
      2. **Ask Me Later** (Secondary Blue Button) $\rightarrow$ Transitions offer to `DEFERRED` while preserving the original deadline.
      3. **Decline Job** (Outlined Red Button) $\rightarrow$ Opens **Decline Reason Modal**:
         - Radio options: `Busy with another job`, `Ending shift soon`, `Not feeling well`, `Personal reason`, `Other`.
         - Optional brief note input.
         - Confirmation button triggering instant fallback reroute without penalty.

- **Section B: Active Job Execution Stepper (On-Site Workflow)**:
  - For accepted jobs currently in progress:
  - Step 1: **[ Mark Arrived on Site ]** button $\rightarrow$ Sets ticket to `ARRIVED`, records timestamp.
  - Step 2: **[ Start Service Work ]** button (enabled only after arrival) $\rightarrow$ Sets ticket to `IN_PROGRESS`.
  - Step 3: **[ Mark Work Complete ]** button (enabled only while in progress) $\rightarrow$ Opens **Work Summary Modal**:
    - Optional technician completion note (e.g. *"Replaced faulty valve, leak stopped, tested under pressure"*).
    - Submits and transitions ticket to `AWAITING_CUSTOMER_CONFIRMATION`.
    - Shows banner: *"Work submitted! Awaiting resident verification."*

- **Section C: My Assigned & Past Jobs Table**:
  - Tabbed lists: `Active Jobs`, `Awaiting Customer Review`, `Completed History`.

---

### SCREEN 6: Customer Resolution & Confirmation Experience (`/tickets/:id/confirm`)
*Target Persona: Customer / Resident (Mobile & Desktop Modal or Standalone Page)*

- **Focused, Clean Two-Click Verification Modal**:
  - Header: **"Service Completion Verification"**
  - Technician Summary: Technician name, category icon, and technician's completion summary note.
  - **Core Decision Question**:
    > **"Was your maintenance issue completely resolved?"**
    - Large Primary Choice Buttons:
      - **`[ YES, ISSUE IS RESOLVED ]`** (Green Button with Checkmark)
      - **`[ NO, STILL UNRESOLVED ]`** (Red/Rose Button with Alert Icon)

  - **Dynamic Sub-Section based on Choice**:
    - **If YES Selected**:
      - Rating Prompt: *"How would you rate the technician's service?"*
      - Interactive 5-Star Rating Widget (1 to 5 clickable stars, optional).
      - Optional comment textarea: *"Tell us what you liked or how we can improve..."*
      - Submit Button: `Confirm & Close Ticket`.
    - **If NO Selected**:
      - Prompt: *"We're sorry the issue persists. Please let us know what is still unresolved:"*
      - Optional explanation textarea.
      - Reopen Button: `Reopen Ticket & Dispatch Alternative Specialist`.
      - Informational note: *"We will immediately assign a different senior technician to your request at no extra hassle."*

---

### SCREEN 7: Technicians & Capacity Management (`/technicians`)
*Target Persona: Helpdesk Administrator & Operations Lead*

- **Top Bar**: Search technician, Filter by Skill Category, Filter by Zone, Filter by On-Duty status, `+ Register Technician` button.
- **Technician Cards Grid**:
  - Card Header: Avatar, Name, Email, Phone, Zone badge.
  - Shift Status Toggle: Interactive `On Duty` / `Off Duty` switch.
  - Skill Badges: Multi-category tags (e.g., `Plumbing`, `HVAC`).
  - Performance Metrics:
    - **Overall Rating**: e.g., `4.82 ★` (calculated from running rating sum / count).
    - **Completed Jobs**: Total customer-confirmed jobs.
    - **Reopened Jobs**: Total jobs where customer reported unresolved.
    - **Reopen Rate**: Percentage with colored badge (Green $<5\%$, Amber $5-15\%$, Red $>15\%$).
    - **Workload Bar**: Interactive gauge showing active jobs vs `max_workload` (e.g. `2 / 5`).
- **"Register / Edit Technician" Modal**:
  - Inputs for Full Name, Email, Phone, Zone, Max Workload capacity (default: 5), and Multi-select Category checkboxes.

---

### SCREEN 8: Routing Intelligence & Batch Fallback Hub (`/routing`)
*Target Persona: Helpdesk Administrator*

- **Top Metrics**:
  - Live Routing Efficiency, Average Offer Response Time, Fallback Reroute Frequency.
- **Active Offers Monitor**:
  - Table of all tickets currently in `ROUTING` status.
  - Displays Candidate Name, Offer Created At, Expiration Countdown, and Fallback Candidate Queue.
- **Batch Processing Action Panel**:
  - Button: **"Run Expired Offer Timeout Scanner"** (`POST /api/v1/assignments/process-expired`).
  - Shows result modal with: `Expired Offers Count`, `Rerouted Tickets Count`, `Unassigned Tickets Count`.
- **Deterministic Scoring Inspector (Simulator)**:
  - Select any ticket and view real-time eligibility checks (Active, On-Duty, Category Match, Capacity Check) and detailed 5-factor scoring calculations for all technicians in the system.

---

## 5. Interaction States & UI Edge Cases

Ensure high-fidelity mockups provide clear visual states for:
1. **Empty States**:
   - No active tickets in queue (`"All caught up! No tickets pending dispatch."`).
   - No technician offers waiting for response (`"You have no pending offers right now."`).
   - No alternative technicians available (`"No alternative technician currently available in this zone. Ticket kept in Reopened queue."`).
2. **Loading & Skeleton States**:
   - Skeleton loading placeholders for ticket table rows, metric tiles, and routing score bars.
3. **Confirmation Dialogs**:
   - Confirming ticket cancellation.
   - Confirming job decline.
   - Confirming ticket reopening.
4. **Toast Notifications**:
   - Success toast: *"Offer accepted successfully. Workload updated."*
   - Error toast: *"Offer has expired and cannot be accepted."*
   - Info toast: *"Ticket #1042 reopened. Alternative offer dispatched to Kumar."*

---

## 6. Generation Deliverables Checklist

When generating the UI mockups and design assets, produce high-resolution, pixel-perfect screens for:
- [ ] **Screen 0A**: Authentication & Sign-In Page with Role Switcher (`/login`)
- [ ] **Screen 0B**: Resident Registration & Onboarding Form (`/register`)
- [ ] **Screen 0C**: Password Recovery & Reset Flow (`/forgot-password`)
- [ ] **Screen 1**: Operations & Dispatcher Dashboard (`/dashboard`)
- [ ] **Screen 2**: All Tickets Management Table & Filter Hub (`/tickets`)
- [ ] **Screen 3**: Ticket Creation Form with Scheduling Picker (`/tickets/new`)
- [ ] **Screen 4**: Detailed Ticket Hub with 7-Step Lifecycle Stepper & Routing Breakdown (`/tickets/:id`)
- [ ] **Screen 5**: Technician "My Jobs" Portal with 10-Minute Countdown & Step Execution (`/technician/jobs`)
- [ ] **Screen 6**: Customer 2-Click Resolution Verification & 5-Star Rating Modal (`/tickets/:id/confirm`)
- [ ] **Screen 7**: Technician Capacity, Skill & Reopen Rate Directory (`/technicians`)
- [ ] **Screen 8**: Routing Intelligence, Fallback Monitor & Timeout Scanner (`/routing`)
