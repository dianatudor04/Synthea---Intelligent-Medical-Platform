# Medical Management Platform - Complete Flows & Functionality

## Platform Overview

A comprehensive, responsive medical management platform designed for hospitals and clinics with four distinct role-based interfaces. The platform uses a calming color palette with soft blues (#E6F0FA / #3A7BD5) and muted greens (#E8F5E9), featuring rounded corners, soft shadows, plenty of whitespace, and smooth animations.

---

## Table of Contents

### General
1. [Welcome/Role Selection](#welcomerole-selection)
2. [Design System](#design-system)
3. [Responsive Behavior](#responsive-behavior)

### Patient Portal
4. [Patient Authentication Flow](#patient-authentication-flow)
5. [Patient Dashboard](#patient-dashboard)
6. [Patient Appointment Booking](#patient-appointment-booking)
7. [Patient Profile & Settings](#patient-profile--settings)

### Doctor Dashboard
8. [Doctor Overview](#doctor-dashboard)
9. [Doctor Navigation](#doctor-navigation)
10. [Doctor Patient Management](#doctor-patient-management)
11. [Doctor Schedule](#doctor-schedule)

### Nurse Dashboard
12. [Nurse Overview](#nurse-dashboard)
13. [Nurse Patient List](#nurse-patient-list)
14. [Nurse Tasks](#nurse-tasks)

### Admin Panel
15. [Admin Overview](#admin-panel)
16. [Admin Analytics](#admin-analytics)
17. [Admin Management](#admin-management)

---

## Welcome/Role Selection

**Route**: `/`

**Purpose**: Single entry point for all users to select their role

**Design**:
- Clean, minimal landing page
- Gradient background: `from-[#E6F0FA] via-white to-[#E8F5E9]`
- Centered layout with animated logo
- Smooth entrance animations using Framer Motion

**Elements**:

### Logo/Branding
- Gradient icon (Activity symbol)
- Appears at 80x80 pixels
- Animation: Scale from 0 to 1 with spring effect
- Colors: Blue to green gradient

### Title & Subtitle
- **Title**: "Welcome" (48px, bold)
- **Subtitle**: "Please choose your profile to continue"
- Fade-in animation with stagger

### Role Selection Cards (2x2 Grid)

**1. Patient Card**
- **Icon**: User (blue)
- **Label**: "Patient"
- **Route**: `/patient/auth/signup`
- **Design**: White rounded card, blue icon background
- **Hover**: Scale 1.05, lifts up 4px
- **Tap**: Scale 0.98

**2. Doctor Card**
- **Icon**: Stethoscope (green)
- **Label**: "Doctor"
- **Route**: `/doctor`
- **Design**: White rounded card, green icon background
- **Hover**: Scale 1.05, lifts up 4px
- **Tap**: Scale 0.98

**3. Nurse Card**
- **Icon**: Activity (orange)
- **Label**: "Nurse"
- **Route**: `/nurse`
- **Design**: White rounded card, orange icon background
- **Hover**: Scale 1.05, lifts up 4px
- **Tap**: Scale 0.98

**4. Admin Card**
- **Icon**: Shield (purple)
- **Label**: "Admin"
- **Route**: `/admin`
- **Design**: White rounded card, purple icon background
- **Hover**: Scale 1.05, lifts up 4px
- **Tap**: Scale 0.98

**Footer**:
- "Secure • HIPAA Compliant • 24/7 Support"
- Fade-in animation (delay: 0.9s)

---

## Design System

### Color Palette

**Primary Colors**:
- Medical Blue: `#3A7BD5`
- Medical Blue Light: `#E6F0FA`
- Medical Green: `#4CAF50`
- Medical Green Light: `#E8F5E9`

**Role-Specific Accent Colors**:
- **Patient**: Blue (#3A7BD5)
- **Doctor**: Blue/Green (#3A7BD5 / #4CAF50)
- **Nurse**: Orange (#FF9800 / #FFB74D)
- **Admin**: Purple (#9C27B0 / #BA68C8)

**Status Colors**:
- Success/Stable/Finalized: `#4CAF50` (green)
- Warning/Medium/Recovering: `#FF9800` (orange)
- Error/Critical/Missed: `#F44336` / `#ef4444` (red)
- Info/Scheduled/Upcoming: `#3A7BD5` (blue)
- Gray/Cancelled/Neutral: `#6b7280` (gray)

### Typography

**Font Sizes**:
- Heading 1: 36px (2.25rem)
- Heading 2: 30px (1.875rem)
- Heading 3: 24px (1.5rem)
- Body: 16px (1rem base)
- Small: 14px (0.875rem)
- Extra Small: 12px (0.75rem)

**Font Weights**:
- Bold: 700
- Semibold: 600
- Medium: 500
- Normal: 400

### Border Radius
- Small: 8px (rounded-lg)
- Medium: 12px (rounded-xl)
- Large: 16px (rounded-2xl)
- Extra Large: 24px (rounded-3xl)
- Circle: 9999px (rounded-full)

### Shadows
- Small: `shadow-sm`
- Medium: `shadow-md`
- Large: `shadow-lg`
- Extra Large: `shadow-xl`
- Double Extra Large: `shadow-2xl`

### Animations (Framer Motion)
- **Entrance**: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
- **Hover**: `whileHover={{ scale: 1.05, y: -4 }}`
- **Tap**: `whileTap={{ scale: 0.98 }}`
- **Duration**: 0.5s (default), 0.3s (quick)
- **Stagger**: 0.1s between items

---

## Responsive Behavior

### Mobile (< 768px)
- Bottom navigation visible for each role
- Single column layouts
- Full-width components
- Touch-optimized 44px minimum tap targets
- Fixed headers and bottom nav bars

### Tablet (768px - 1024px)
- Bottom navigation or sidebar (role-dependent)
- 2-column grids
- Modal max-width: 90vw
- Optimized card sizes

### Desktop (> 1024px)
- Sidebar navigation (Doctor, Admin)
- Top header navigation (All roles)
- 3-4 column grids
- Modal max-width: 768px
- Hover effects active
- No bottom navigation

---

# PATIENT PORTAL

## Patient Authentication Flow

### Sign Up Page (`/patient/auth/signup`)

**Purpose**: Create new patient account

**Layout**:
- Centered card on gradient background
- White rounded card (24px radius)
- Shadow-xl for depth

**Form Fields**:

1. **Email Input**
   - Mail icon (left)
   - Placeholder: "your.email@example.com"
   - Height: 48px (h-12)
   - Validation: Email format required

2. **Password Input**
   - Lock icon (left)
   - Eye/EyeOff toggle button (right)
   - Placeholder: "••••••••"
   - Validation: Minimum 8 characters

3. **Confirm Password Input**
   - Lock icon (left)
   - Eye/EyeOff toggle button (right)
   - Validation: Must match password

**Buttons**:

- **Back Button** (top-left)
  - ArrowLeft icon + "Back" text
  - Route: `/` (role selection)
  - Style: Ghost/link style, gray text

- **Show/Hide Password Toggles**
  - Eye icon when hidden
  - EyeOff icon when visible
  - Action: Toggles password visibility

- **Create Account Button**
  - Gradient blue-green background
  - Width: Full (w-full)
  - Height: 48px
  - Text: "Create Account"
  - Action: Validates and navigates to `/patient/auth/profile-setup`
  - Validation Errors:
    - "Email is required"
    - "Please enter a valid email"
    - "Password is required"
    - "Password must be at least 8 characters"
    - "Passwords do not match"

**Links**:
- "Already have an account? Log in" → `/patient/auth/login`

### Login Page (`/patient/auth/login`)

Similar structure to Sign Up with:

**Form Fields**:
- Email input
- Password input (with show/hide toggle)

**Buttons**:
- **Back Button** → `/`
- **Login Button** → `/patient` (on success)

**Links**:
- "Forgot password?" → `/patient/auth/forgot-password`
- "Don't have an account? Sign up" → `/patient/auth/signup`

### Forgot Password Page

**Form**:
- Single email input field

**States**:
1. **Input State**: Email form
2. **Success State**: Confirmation message with checkmark

**Buttons**:
- **Back to Login** → `/patient/auth/login`
- **Send Reset Link** → Shows success state
- **Back to Login** (from success) → `/patient/auth/login`

### Profile Setup Page (`/patient/auth/profile-setup`)

**Purpose**: Onboarding flow to collect patient medical information

**Step Indicator**:
- 2 steps total
- Circle indicators (1, 2)
- Progress bar between steps
- Completed steps show checkmark

**Step 1: Personal Information**

Fields:
- **Full Name** (User icon, required)
- **Date of Birth** (Calendar icon, date picker, required)

Buttons:
- **Continue** → Advances to Step 2

**Step 2: Medical Information**

Fields:

1. **Allergies** (searchable dropdown)
   - AlertCircle icon
   - Placeholder: "Search or add allergies"
   - Predefined options:
     - Penicillin, Peanuts, Tree nuts, Shellfish, Eggs, Milk, Soy, Wheat, Fish, Latex, Aspirin, Ibuprofen, Sulfa drugs, Pollen
   - Shows dropdown on focus/type
   - Press Enter to add custom allergy
   - Click predefined option to add
   - Added allergies appear as blue tags with X button
   - X button removes allergy

2. **Medical Conditions** (searchable dropdown)
   - FileText icon
   - Placeholder: "Search or add conditions"
   - Predefined options:
     - Diabetes, Hypertension, Asthma, Heart Disease, Arthritis, Depression, Anxiety, COPD, Kidney Disease, Thyroid Disorder
   - Shows dropdown on focus/type
   - Press Enter to add custom condition
   - Click predefined option to add
   - Added conditions appear as green tags with X button
   - X button removes condition

3. **Additional Notes** (optional)
   - Textarea
   - Placeholder: "Any other relevant medical information..."
   - Minimum height: 128px

Buttons:
- **Back** → Returns to Step 1
- **Complete Setup** → Saves to localStorage, navigates to `/patient`

**Data Saved** (localStorage.patientProfile):
```json
{
  "fullName": "John Doe",
  "dateOfBirth": "1985-03-15",
  "allergies": ["Penicillin", "Peanuts"],
  "conditions": ["Hypertension", "Asthma"],
  "medicalInfo": "Additional notes..."
}
```

---

## Patient Dashboard

**Route**: `/patient`

**Purpose**: Main health management hub

### Header Section

**Greeting**:
- "Hello, [FirstName]"
  - Extracts first name from localStorage profile
  - Fallback: "Hello, Guest"
- Subtitle: "Welcome back to your health dashboard"

**Top-Right Buttons**:

1. **Settings Button** (Settings icon in white circle)
   - Route: `/patient/settings`
   - Design: 48x48 circle, white bg, shadow-md

2. **Profile Button** (User icon in gradient circle)
   - Route: `/patient/profile`
   - Design: 48x48 circle, gradient bg, shadow-md

### Primary Action

**Book Appointment Button**:
- Full width, 80px height
- Gradient blue-green background
- CalendarPlus icon (32px)
- Text: "Book an Appointment" (20px)
- Action: Opens appointment booking modal
- Shadow-xl, hover increases shadow

### Calendar Section

**Header**:
- Title: "Your Calendar"
- Calendar icon in gradient circle background
- **Sync Calendar Button** (outline style)
  - Plus icon
  - Text: "Sync Calendar"
  - Action: Placeholder for calendar sync

**Calendar Display**:
- Monthly view
- Day names: Sun-Sat
- Month/Year title
- Navigation:
  - **Previous Month** (ChevronLeft)
  - **Next Month** (ChevronRight)

**Date Cells**:
- Square aspect ratio
- Color coding:
  - **Today**: Gradient blue-green, white text
  - **Appointments**: Green background (#E8F5E9)
  - **Personal Events**: Blue background (#E6F0FA)
  - **Regular Days**: Hover gray background
- Small dot indicator on dates with events

**Legend**:
- Today (gradient circle)
- Appointments (green circle with border)
- Personal Events (blue circle)

**Data Source**:
- Reads from localStorage.appointments
- Converts appointments to calendar events
- Merges with personal events

### Appointments Section

**Header**:
- "Recent Appointments"

**Appointment Cards** (each shows):

Elements per card:
- Doctor avatar (initials in gradient circle)
- Doctor name (bold)
- Specialty (gray text)
- Date (Calendar icon)
- Time (Clock icon)
- Location/Type icon (MapPin or Video)
- Status badge

**Status Badges**:
- **Missed**: Red background, red text, red border
- **Finalized**: Green background, green text, green border
- **Upcoming**: Blue background, blue text, blue border

**Card Interactions**:
- Hover: Shadow increases from sm to md
- Entrance: Staggered animation (0.1s delay per card)

### Medical Files Section

Located in right column (desktop) or below (mobile)

**Section 1: Shared with Doctor**

Header:
- "Shared with Doctor"
- FileText icon

File items show:
- File icon (gradient background)
- File name
- Metadata: "PDF • 1.2 MB • April 5, 2026"

Actions per file:
- **View** (Eye icon) → Preview placeholder
- **Download** (Download icon) → Download placeholder

**Section 2: Personal Uploads**

Header:
- "Personal Uploads"
- Upload icon

File items show:
- File icon (green gradient background)
- File name
- Metadata

Actions per file:
- **View** (Eye icon) → Preview
- **Delete** (Trash2 icon, red on hover) → Delete file

**Upload Zone**:
- Dashed border (2px)
- Rounded corners (12px)
- Upload icon (gray)
- "Upload New File" (bold)
- "Drag and drop or click to browse" (small text)
- Hover: Border changes to blue, background lightens
- Click: Opens file picker (placeholder)

### Wellness Blog Section

**Header**:
- "Wellness Blog"
- **View All Button** (ghost style)
  - ArrowRight icon
  - Route: `/patient/blog`
  - Gap animates on hover

**Blog Cards** (3 displayed, grid):

Each card:
- Wellness image from Unsplash (160px height)
- Gradient overlay on image
- Category badge (blue pill)
- Title (bold)
- Description (2 lines max, truncated)

Categories:
- Nutrition (images of healthy food)
- Mental Health (meditation/mindfulness images)
- Lifestyle (exercise/fitness images)

**Card Interactions**:
- Hover: Lifts up -4px, shadow increases
- Click: Routes to `/patient/blog`

### Floating Chatbot

**Button** (fixed bottom-right):
- 64x64 circle
- Gradient blue-green
- MessageCircle icon (or X when open)
- Z-index: 50
- Shadow-xl

**Interactions**:
- Hover: Scale 1.1
- Tap: Scale 0.95
- Click: Toggles chat window

**Chat Window** (when open):

Header:
- Gradient blue-green background
- Avatar with MessageCircle icon
- "Health Assistant" title
- "Online" status (small, 80% opacity)
- **Close Button** (X icon)

Chat Area:
- Height: 384px (96 in Tailwind)
- Scrollable
- Bot messages: Left, gray background, rounded-2xl
- User messages: Right, gradient background, rounded-2xl
- Default message: "Hello! I'm your health assistant..."

Input Area:
- Text input (rounded-full)
- Placeholder: "Type your message..."
- **Send Button** (gradient circle)
  - Send icon
  - Click or Enter: Sends message

**Message Flow**:
1. User types → Sends
2. User message appears (right)
3. 1 second delay
4. Bot response appears (left)
5. Bot: "I'm here to help with booking appointments..."

---

## Patient Appointment Booking

### Book Appointment Modal

**Trigger**: "Book an Appointment" button

**Modal Structure**:
- Fixed overlay (50% black)
- Centered modal card
- Max width: 672px (2xl)
- Max height: 90vh
- Rounded-3xl
- Shadow-2xl

**Header**:
- Gradient blue-green background
- "Book Appointment" title (24px, bold, white)
- "Step X of 3" subtitle (white, 80% opacity)
- **Close Button** (X icon in semi-transparent white circle)
  - Hover: More opaque
  - Click: Closes modal

**Step 1: Select a Doctor**

Title: "Select a Doctor"

**Doctor Cards** (4 displayed):

Each card:
- Avatar circle (56px) with initials
  - Gradient blue-green background
  - White text, bold
- Doctor name (bold)
- Specialty (gray)
- ChevronRight icon (right side)

States:
- Default: White background, gray border
- Hover: Blue border, blue-tinted background
- Click: Selects doctor, advances to Step 2

Doctors:
1. Dr. Sarah Martinez - Cardiologist (SM)
2. Dr. James Kumar - General Physician (JK)
3. Dr. Emily Johnson - Dermatologist (EJ)
4. Dr. Michael Chen - Neurologist (MC)

**Step 2: Select Date & Type**

**Back Link**:
- "← Back to doctors"
- Blue text
- Click: Returns to Step 1

**Date Selection**:

Title: "Select Date"

Grid: 2 columns

Available dates (5 shown):
- 2026-05-08, 05-09, 05-12, 05-13, 05-14
- Each shows:
  - Calendar icon
  - Formatted date ("Thu, May 08")
- States:
  - Unselected: White, gray border
  - Selected: Blue border, blue background
  - Hover: Gray border darkens

**Appointment Type**:

Title: "Appointment Type"

Grid: 2 columns

**In-Person Option**:
- MapPin icon
- "In-Person" text
- Selected: Blue border, blue background
- Click: Selects in-person

**Video Call Option**:
- Video icon
- "Video Call" text
- Selected: Green border, green background
- Click: Selects video

**Continue Button** (appears when date selected):
- "Continue to Time Selection"
- Gradient background
- Full width
- Height: 48px
- Action: Advances to Step 3

**Step 3: Select Time & Confirm**

**Back Link**:
- "← Back to date"
- Click: Returns to Step 2

**Time Selection**:

Title: "Select Time"

Grid: 3 columns

**Time Slots** (6 shown):
- 09:00 AM (available)
- 10:00 AM (available)
- 11:00 AM (unavailable)
- 02:00 PM (available)
- 03:00 PM (available)
- 04:00 PM (unavailable)

Each slot shows:
- Clock icon (small, blue)
- Time text

States:
- Available: White background, gray border, hover effect
- Selected: Blue border, blue background
- Unavailable: Gray background, 50% opacity, disabled cursor

**Appointment Summary** (appears when time selected):

Background: Blue-tinted (#E6F0FA)
Rounded-2xl
Padding: 16px

Title: "Appointment Summary" (bold)

Details shown:
- **Doctor**: User icon + Dr. Name
- **Date**: Calendar icon + Formatted date
- **Time**: Clock icon + Selected time
- **Type**: Video/MapPin icon + "Video Call"/"In-Person Visit"

**Confirm Appointment Button**:
- "Confirm Appointment"
- Gradient background
- Full width
- Height: 48px
- Action:
  1. Creates appointment object
  2. Saves to localStorage.appointments
  3. Updates calendar component
  4. Closes modal
  5. Returns to dashboard

**Appointment Object Saved**:
```json
{
  "doctor": "Dr. Sarah Martinez",
  "specialty": "Cardiologist",
  "date": "2026-05-08",
  "time": "09:00 AM",
  "type": "in-person"
}
```

---

## Patient Profile & Settings

### Profile Page (`/patient/profile`)

**Purpose**: View and edit personal/medical information

**Header**:
- **Back Button** → `/patient`
- Title: "My Profile"
- Subtitle: "Manage your personal and medical information"

**Mode Toggle Buttons**:

View Mode:
- **Edit Profile Button** (gradient, right side)
  - Edit2 icon
  - Text: "Edit Profile"
  - Click: Enables editing

Edit Mode:
- **Cancel Button** (outline)
  - X icon
  - Text: "Cancel"
  - Click: Discards changes, exits edit mode
- **Save Changes Button** (gradient)
  - Save icon
  - Text: "Save Changes"
  - Click: Saves to localStorage, exits edit mode

**Form Card** (white, rounded-3xl, shadow-lg):

Fields:

1. **Full Name**
   - User icon
   - Read-only in view mode
   - Editable in edit mode

2. **Date of Birth**
   - Calendar icon
   - Date picker
   - Disabled in view mode

3. **Allergies**
   - AlertCircle icon
   - View mode: Blue tags (read-only)
   - Edit mode: Searchable dropdown (same as profile setup)
   - Empty state: "No allergies recorded"

4. **Medical Conditions**
   - FileText icon
   - View mode: Green tags (read-only)
   - Edit mode: Searchable dropdown
   - Empty state: "No conditions recorded"

5. **Additional Notes**
   - Textarea
   - Disabled in view mode

**Tag Display** (view mode):
- Allergies: Blue background, X button hidden
- Conditions: Green background, X button hidden

**Tag Display** (edit mode):
- X button visible on hover
- Click X to remove

### Settings Page (`/patient/settings`)

**Purpose**: Manage preferences and account settings

**Header**:
- **Back Button** → `/patient`
- Title: "Settings"
- Subtitle: "Manage your preferences and account"

**Sections** (white cards, rounded-3xl):

### 1. Notifications Section

Icon: Bell in blue circle
Title: "Notifications"

**Toggles** (Switch components):

1. **Push Notifications**
   - Label: "Push Notifications"
   - Description: "Receive notifications in the app"
   - Default: ON
   - Switch: Blue when ON

2. **Email Notifications**
   - Label: "Email Notifications"
   - Description: "Receive updates via email"
   - Default: ON

3. **SMS Notifications**
   - Label: "SMS Notifications"
   - Description: "Receive text message updates"
   - Default: OFF

4. **Appointment Reminders**
   - Label: "Appointment Reminders"
   - Description: "Get reminded before appointments"
   - Default: ON

### 2. Appearance Section

Icon: Moon in green circle
Title: "Appearance"

**Toggle**:
- **Dark Mode**
  - Description: "Toggle dark theme"
  - Default: OFF
  - Action: Placeholder for theme switching

### 3. Privacy & Security Section

Icon: Shield in blue circle
Title: "Privacy & Security"

**Options** (clickable rows):

1. **Change Password**
   - Lock icon
   - Label: "Change Password"
   - Description: "Update your password"
   - Action: Navigate to change password (placeholder)

2. **Language**
   - Globe icon
   - Label: "Language"
   - Current: "English (US)"
   - Action: Language selector (placeholder)

### 4. Account Actions

**Log Out Button**:
- Full width
- Red outline style
- LogOut icon
- Text: "Log Out"
- Action:
  1. Clears localStorage.patientProfile
  2. Clears localStorage.appointments
  3. Navigates to `/` (role selection)

---

# DOCTOR DASHBOARD

## Doctor Dashboard

**Route**: `/doctor`

**Purpose**: Main workspace for doctors to manage patients, appointments, and clinical workflows

**Design Theme**: Professional, efficient, data-dense
**Primary Colors**: Blue (#3A7BD5) and Green (#4CAF50)

### Layout Structure

**Desktop**:
- Sidebar navigation (left, 256px wide)
- Top header with search and profile
- Main content area

**Mobile**:
- Top header with menu toggle
- Bottom navigation (5 items)
- Hamburger menu reveals sidebar

---

## Doctor Navigation

### Sidebar (Desktop)

**Logo Section**:
- "M" logo in gradient circle (blue-green)
- "MediCare" text (bold, 20px)
- **Back Button** (mobile only) → `/`

**Navigation Items**:

1. **Dashboard** (LayoutDashboard icon)
   - Route: `/doctor`
   - Active: Blue background (#E6F0FA), blue text

2. **Patients** (Users icon)
   - Route: `/doctor/patients`

3. **Schedule** (Calendar icon)
   - Route: `/doctor/schedule`

4. **AI Assistant** (Brain icon)
   - Route: `/doctor/ai-assistant`

5. **Billing** (FileText icon)
   - Route: `/doctor/billing`

**Active State**:
- Blue-tinted background
- Blue text
- Medium font weight
- Rounded-xl

**Inactive State**:
- Gray text
- Hover: Light gray background

**User Profile** (bottom of sidebar):
- Avatar: "DM" in blue circle
- Name: "Dr. Martinez"
- Role: "Cardiologist" (gray, small)
- Hover: Light gray background

### Top Header (Desktop)

**Search Bar**:
- Full width (max 576px)
- Gray background (#f9fafb)
- Search icon (left)
- Placeholder: "Search patients, appointments..."
- No border
- Focus: Blue ring (20% opacity)

**Right Section**:
- **Notifications Button**
  - Bell icon
  - Red dot indicator (top-right)
  - Ghost style
  
- **Divider** (vertical line, gray)

- **Profile Avatar**
  - "DM" initials
  - Blue circle background

### Mobile Header

**Left Section**:
- **Menu Toggle** (hamburger/X icon)
  - Click: Opens/closes sidebar
  - Ghost style

- **Logo**: "MediCare" text with blue color

**Right Section**:
- **Search Button** (Search icon)
- **Notifications Button** (Bell icon with dot)

### Bottom Navigation (Mobile)

Shows first 5 navigation items:
- Dashboard, Patients, Schedule, AI Assistant, Billing
- Active: Blue text
- Inactive: Gray text
- Icon above label
- Label: Extra small text

---

## Doctor Dashboard Overview

**Route**: `/doctor`

### Welcome Header

- "Good morning, Dr. Martinez" (28px, bold)
- Date: "Tuesday, April 7, 2026" (gray)

### Stats Grid (4 KPI Cards)

Grid: 2 columns (mobile), 4 columns (desktop)

**Card Structure**:
- White background
- No border
- Shadow-sm
- Padding: 24px (desktop), 16px (mobile)
- Hover: Shadow increases

**1. Today's Appointments**
- Icon: Calendar (blue circle background)
- Value: Number of appointments for today
- Label: "Today's Appointments"
- Color: Blue (#3A7BD5)

**2. Active Patients**
- Icon: Users (green circle background)
- Value: Total patient count
- Label: "Active Patients"
- Color: Green (#4CAF50)

**3. In Progress**
- Icon: Activity (orange circle background)
- Value: Appointments currently in progress
- Label: "In Progress"
- Color: Orange (#FF9800)

**4. Pending Reviews**
- Icon: AlertCircle (red circle background)
- Value: Number of pending reviews
- Label: "Pending Reviews"
- Color: Red (#F44336)

### Main Content Grid

Layout: 2 columns (appointments) + 1 column (sidebar)

**Left Column (2/3 width): Today's Appointments**

Header:
- "Today's Appointments" (20px, bold)
- **View All Button** (ghost)
  - Text: "View All"
  - ChevronRight icon
  - Blue color
  - Route: `/doctor/schedule`

**Appointment Cards**:

Each card shows:
- **Time Block** (left):
  - Square (64x64 on desktop, 48x48 mobile)
  - Blue gradient background
  - Hour (large)
  - AM/PM (small, 80% opacity)

- **Patient Info**:
  - Patient name (bold, truncated if long)
  - Appointment type (gray)
  - Duration (Clock icon + minutes)
  - Doctor name (self)

- **Status Badge** (right):
  - **Scheduled**: Blue background/text
  - **In Progress**: Orange background/text
  - **Completed**: Green background/text
  - **Cancelled**: Gray background/text

**Card States**:
- Default: White, shadow-sm
- Hover: Shadow-md
- Cursor: Pointer

**Right Column (1/3 width): Alerts & Stats**

**Alerts Section**:

Header: "Alerts" (20px, bold)

**Alert Cards**:
Each shows:
- Colored left border (4px):
  - High priority: Red (#F44336)
  - Medium priority: Orange (#FF9800)
  - Low priority: Green (#4CAF50)
- AlertCircle icon (gray)
- Message text
- White background

Examples:
- "David Thompson post-op check in 30 minutes" (high)
- "2 lab results require review" (medium)
- "Medication refill request" (low)

**Quick Stats Card**:

Background: Blue gradient (white text)
Rounded corners
Shadow-sm

Shows:
- "This Week" header
- TrendingUp icon
- **Appointments Completed**: "32" (large)
- **Patient Satisfaction**: "94%" (large)
- Divider line between stats

---

## Doctor Patient Management

**Route**: `/doctor/patients`

**Purpose**: Search, filter, and manage patient list

### Header

- Title: "Patient Management" (28px, bold)
- Subtitle: "X patients found" (gray)
- **Add Patient Button** (top-right)
  - Blue background
  - Plus icon
  - Text: "Add Patient"
  - Action: Placeholder for add patient form

### Search & Filters Card

White card, rounded-xl, padding: 24px

**Search Input**:
- Search icon (left)
- Placeholder: "Search by name or condition..."
- Rounded-xl
- Full width (desktop 1/2)
- Updates results in real-time

**Filter Buttons** (horizontal scrollable):

1. **All** (default selected)
   - Blue background when active
   
2. **Stable**
   - Green background when active
   - Shows only stable status patients

3. **Critical**
   - Red background when active
   - Shows only critical patients

4. **Recovering**
   - Orange background when active
   - Shows only recovering patients

**Active Filter**:
- Colored background
- White text
- Hover: Slightly darker

**Inactive Filter**:
- Outline style
- Gray text
- Hover: Light background

### Patient List

Grid: 1 column
Gap: 12px (3)

**Patient Cards** (each clickable):

Structure:
- White background
- Shadow-sm
- Rounded-xl (12px)
- Padding: 20px
- Hover: Shadow-md
- Click: Navigate to patient detail

Contents:
- **Avatar** (left, 56px circle)
  - Initials in gradient circle
  - Two letters from patient name

- **Patient Info** (center):
  - Name (bold)
  - Age • Gender • Condition
  - Blood type
  - All gray, small text

- **Status Badge** (right):
  - **Stable**: Green background/text
  - **Critical**: Red background/text
  - **Recovering**: Orange background/text

**Empty State** (no results):
- "No patients found"
- Gray text
- Centered

---

## Doctor Schedule

**Route**: `/doctor/schedule`

**Status**: Placeholder page
- Calendar icon (gray, large)
- "Schedule page coming soon..." text

**Future Features**:
- Monthly/weekly calendar view
- Drag-and-drop appointment scheduling
- Color-coded appointment types
- Integration with availability settings

---

# NURSE DASHBOARD

## Nurse Dashboard

**Route**: `/nurse`

**Purpose**: Fast-paced patient care, task management, and monitoring

**Design Theme**: Mobile-first, tablet-optimized, quick actions
**Primary Color**: Orange (#FF9800 / #FFB74D)

### Layout Structure

**All Devices**:
- Fixed top header (64px)
- Main content (scrollable)
- Fixed bottom navigation (80px)
- No sidebar

---

## Nurse Navigation

### Top Header (Fixed)

**Left Section**:
- **Back Button** → `/`
- **Logo**: "MediCare" (orange color)
- **Subtitle**: "Nurse Dashboard" (small, gray)

**Right Section**:
- **Notifications Button**
  - Bell icon
  - Red dot indicator (animated pulse)
  - Ghost style

- **Profile Avatar**
  - "EN" initials (example: Emily Nurse)
  - Orange circle background
  - 36px size

### Bottom Navigation (Fixed)

3 navigation items (evenly spaced):

**1. Patients** (Users icon)
- Route: `/nurse`
- Label: "Patients"
- Active: Orange text

**2. Tasks** (ClipboardList icon)
- Route: `/nurse/tasks`
- Label: "Tasks"

**3. Alerts** (Bell icon)
- Route: `/nurse/notifications`
- Label: "Alerts"
- Red dot indicator (if alerts exist)

**Active State**:
- Orange text (#FF9800)
- Larger icon (24px)

**Inactive State**:
- Gray text
- 24px icon

---

## Nurse Patient List

**Route**: `/nurse`

**Purpose**: Quick overview of all assigned patients with real-time status

### Stats Cards

Grid: 3 columns
Gap: 12px

**Card Structure**:
- White background
- No border
- Shadow-sm
- Centered text
- Padding: 16px

**1. Total Patients**
- Value: Patient count (large, blue)
- Label: "Total" (small, gray)

**2. Critical Patients**
- Value: Critical count (large, red)
- Label: "Critical" (small, gray)

**3. Stable Patients**
- Value: Stable count (large, green)
- Label: "Stable" (small, gray)

### Search Bar

White card, rounded-xl, padding: 16px

- Search icon (left)
- Input: "Search patients..."
- No border
- Full width
- Real-time filter

### Quick Filter Buttons

Horizontal scroll (if needed)
Gap: 8px

**Buttons**:
1. **All Patients** (default, orange background)
2. **Critical** (outline)
3. **Medications Due** (outline)
4. **Recent Admits** (outline)

**Active**: Orange background, white text
**Inactive**: Outline, black text

### Patient List Cards

Gap: 12px
Vertical stack

**Each Card** (clickable):

Left Section:
- **Avatar** (56px circle)
  - Initials in orange gradient
  - White text

Center Section:
- **Patient Name** (bold)
- **Details**: Age • Gender • Room
- **Condition** (small, truncated)
- **Blood Type** (small)

Right Section:
- **Status Badge**:
  - **Stable**: Green with Heart icon
  - **Critical**: Red with AlertCircle icon
  - **Recovering**: Orange with Activity icon

**Card States**:
- Default: White background, shadow-sm
- Hover: Shadow-md
- Active press: Scale 0.98
- Click: Navigate to `/nurse/patient/[id]` (placeholder)

**Border**: None
**Rounded**: 12px (rounded-xl)

---

## Nurse Tasks

**Route**: `/nurse/tasks`

**Purpose**: Manage and track assigned nursing tasks

### Header

- Title: "My Tasks" (24px, bold)
- Subtitle: "X pending • Y completed"

### Stats Cards

Grid: 3 columns

**1. High Priority Tasks**
- Value: Count (red, large)
- Label: "High Priority"

**2. To Do Tasks**
- Value: Pending count (orange, large)
- Label: "To Do"

**3. Done Today**
- Value: Completed count (green, large)
- Label: "Done Today"

### Pending Tasks Section

Header: "Pending Tasks" (bold)

**Task Cards**:

Each card has:
- **Left Border** (4px, colored by priority):
  - High: Red (#F44336)
  - Medium: Orange (#FF9800)
  - Low: Green (#4CAF50)

- **Checkbox** (left, 24x24)
  - Rounded (8px)
  - Border: 2px
  - Unchecked: Empty
  - Click: Marks task complete

- **Task Info** (center):
  - **Task Title** (bold)
    - "Administer medication"
    - "Check vitals"
    - "Wound dressing change"
    - "IV fluid check"
  
  - **Details** (gray, small)
    - Medication name or task detail
  
  - **Metadata** (gray, small, with icons):
    - Clock icon + Time ("2:00 PM")
    - Bullet separator
    - Patient name
    - Bullet separator
    - Room number

- **Priority Badge** (top-right):
  - **High**: Red background/text
  - **Medium**: Orange background/text
  - **Low**: Green background/text

**Action Buttons** (below task info):
1. **Complete Button** (orange)
   - CheckCircle2 icon
   - Text: "Complete"
   - Rounded-xl
   - Action: Marks task as done

2. **Details Button** (outline)
   - Text: "Details"
   - Rounded-xl
   - Action: View task details (placeholder)

**Card States**:
- Default: White background, shadow-sm
- Hover: Shadow-md

**Task Icons** (visual indicators):
- Pill icon: Medication tasks
- Activity icon: Vitals/monitoring
- AlertCircle icon: Urgent care
- Droplet icon: IV/fluids

### Completed Tasks Section

Header: "Completed" (bold)

**Completed Task Cards**:

Simplified display:
- Gray background (bg-gray-50)
- 75% opacity
- **Checkbox** (checked, disabled)
- **Task Title** (line-through, gray)
- **Patient & Room** (gray, small)
- **CheckCircle2 Icon** (green, right)

**No Action Buttons**: Tasks are read-only once completed

---

## Nurse Notifications

**Route**: `/nurse/notifications`

**Status**: Placeholder page

Future features:
- Real-time alerts
- Priority notifications
- Patient status changes
- Medication reminders
- System messages

---

# ADMIN PANEL

## Admin Panel

**Route**: `/admin`

**Purpose**: System management, analytics, and operational oversight

**Design Theme**: Professional, data-focused, analytical
**Primary Color**: Purple (#9C27B0 / #BA68C8)

### Layout Structure

**Desktop**:
- Sidebar navigation (left, 256px)
- Top header with search and profile
- Main content area

**Mobile**:
- Top header with menu toggle
- Hamburger menu reveals sidebar
- No bottom navigation

---

## Admin Navigation

### Sidebar (Desktop)

**Logo Section**:
- "A" logo in purple gradient circle
- "Admin" text (bold, 20px)
- **Back Button** (mobile only) → `/`

**Navigation Items**:

1. **Dashboard** (LayoutDashboard icon)
   - Route: `/admin`
   - Active: Purple background (#F3E5F5), purple text

2. **Staff** (Users icon)
   - Route: `/admin/staff`

3. **Billing** (DollarSign icon)
   - Route: `/admin/billing`

4. **Settings** (Settings icon)
   - Route: `/admin/settings`

**Active State**:
- Purple-tinted background
- Purple text (#9C27B0)
- Medium font weight
- Rounded-xl

**Inactive State**:
- Gray text
- Hover: Light gray background

**User Profile** (bottom):
- Avatar: "AD" in purple circle
- Name: "Admin User"
- Role: "System Administrator" (gray, small)

### Top Header (Desktop)

**Search Bar**:
- Full width (max 576px)
- Gray background
- Search icon (left)
- Placeholder: "Search..."
- Focus: Purple ring (20% opacity)

**Right Section**:
- **Notifications Button** (Bell icon, ghost)
- **Divider** (vertical gray line)
- **Profile Avatar** ("AD", purple circle)

### Mobile Header

**Left Section**:
- **Menu Toggle** → Opens/closes sidebar
- **Logo**: "Admin Panel" (purple)

**Right Section**:
- **Notifications Button** (Bell icon)

---

## Admin Analytics Dashboard

**Route**: `/admin`

### Header

- Title: "System Overview" (28px, bold)
- Subtitle: "Monitor and manage hospital operations"

### KPI Cards

Grid: 2 columns (mobile), 4 columns (desktop)

**Card Structure**:
- White background
- Shadow-sm
- Padding: 24px (desktop), 16px (mobile)

**KPI Components**:
- Icon in colored circle (top-left)
- Trend badge (top-right):
  - Green background for positive trends
  - Shows percentage change
- Value (large, bold)
- Label (small, gray)

**1. Total Patients**
- Icon: Users (blue)
- Value: "1,243"
- Change: "+12%" (green)
- Trend: Up
- Color: Blue (#3A7BD5)

**2. Monthly Revenue**
- Icon: DollarSign (green)
- Value: "$142,850"
- Change: "+8%" (green)
- Trend: Up
- Color: Green (#4CAF50)

**3. Appointments**
- Icon: Calendar (orange)
- Value: "856"
- Change: "+15%" (green)
- Trend: Up
- Color: Orange (#FF9800)

**4. Staff Active**
- Icon: UserCheck (purple)
- Value: "48/52"
- Change: "92%" (gray)
- Trend: Stable
- Color: Purple (#9C27B0)

### Charts Grid

Layout: 2 columns (desktop), 1 column (mobile)

**1. Revenue Trend Chart** (Line Chart)

Card:
- White background
- Padding: 24px
- Title: "Revenue Trend"

Chart:
- Type: Line chart (Recharts)
- Data: 6 months (Jan-Jun)
- Color: Blue (#3A7BD5)
- Line width: 2px
- Dot size: 4px (filled blue)
- Grid: Dashed, light gray
- Axes: Gray (#94a3b8)
- Height: 250px

Data shows revenue progression:
- January: $125,000
- February: $132,000
- March: $142,850
- April: $138,000
- May: $145,000
- June: $152,000

**2. Weekly Appointments Chart** (Bar Chart)

Card:
- White background
- Padding: 24px
- Title: "Weekly Appointments"

Chart:
- Type: Bar chart (Recharts)
- Data: 7 days (Mon-Sun)
- Color: Green (#4CAF50)
- Bar radius: 8px (top corners rounded)
- Grid: Dashed, light gray
- Axes: Gray
- Height: 250px

Data shows daily appointments:
- Monday: 45
- Tuesday: 52
- Wednesday: 48
- Thursday: 61
- Friday: 55
- Saturday: 38
- Sunday: 25

### Bottom Grid

Layout: 2 columns (desktop), 1 column (mobile)

**1. Recent Activity Card**

Header:
- Activity icon (purple)
- "Recent Activity" title

**Activity Items** (4 shown):

Each item:
- Icon circle (left):
  - Success: Green circle with CheckCircle2 icon
  - Info: Blue circle with CheckCircle2 icon
- Activity text (bold)
- User name (gray, small)
- Bullet separator
- Time ago (gray, small)
- Bottom border (except last)

Examples:
- "New patient registration" • Dr. Martinez • 5 min ago
- "Staff shift updated" • Admin User • 12 min ago
- "Payment processed" • Billing Dept • 25 min ago
- "System backup completed" • System • 1 hour ago

**2. System Alerts Card**

Header:
- AlertCircle icon (orange)
- "System Alerts" title

**Alert Items** (3 shown):

Each alert:
- Colored left border (4px):
  - Warning: Orange (#FF9800)
  - Info: Blue (#3A7BD5)
  - Error: Red (#F44336)
- Colored background (light tint)
- Message text
- Rounded corners

Examples:
- "Server maintenance scheduled for tonight" (warning)
- "2 staff members on leave this week" (info)
- "Billing report generation pending" (warning)

**System Health Section** (below alerts):

Title: "System Health" (small, gray)
Divider line above

**Health Indicators** (3 items):

Each shows:
- Label (left, gray)
- Status badge (right):
  - Green background
  - Green text
  - "Healthy", "Fast", "Current"

Indicators:
1. Database → Healthy
2. API Response → Fast
3. Backup Status → Current

---

## Admin Management Pages

### Staff Page

**Route**: `/admin/staff`

**Status**: Placeholder
- Users icon (gray, large)
- "Staff management page coming soon..."

**Future Features**:
- Employee directory
- Shift scheduling
- Performance metrics
- Role management
- Attendance tracking

### Billing Page

**Route**: `/admin/billing`

**Status**: Placeholder

**Future Features**:
- Invoice management
- Payment processing
- Financial reports
- Insurance claims
- Revenue analytics

### Settings Page

**Route**: `/admin/settings`

**Status**: Placeholder

**Future Features**:
- System configuration
- User permissions
- Integration settings
- Backup management
- Security settings

---

## Data Persistence

### LocalStorage Keys

**Patient Portal**:
- `patientProfile`: User profile data
- `appointments`: Booked appointments

**Other Roles**:
- Currently use mock data (no persistence)

**Future Implementation**:
- Backend database
- User authentication (JWT)
- Real-time sync
- Audit logs

---

## Mock Data

**Patients** (`mockPatients`):
- ID, name, age, gender
- Medical condition
- Blood type
- Status (stable/critical/recovering)

**Appointments** (`mockAppointments`):
- Patient name
- Date, time, duration
- Type (consultation, follow-up, etc.)
- Status (scheduled/in-progress/completed/cancelled)
- Doctor name

---

## Accessibility Features

1. **Semantic HTML**: Proper heading hierarchy, nav elements
2. **ARIA Labels**: Icons and buttons have descriptive labels
3. **Focus States**: Visible focus rings (outline-ring)
4. **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
5. **Touch Targets**: Minimum 44x44px on mobile
6. **Keyboard Navigation**: Tab order follows visual hierarchy
7. **Screen Readers**: Descriptive alt text and labels

---

## Security & Compliance

**Current** (Development):
- LocalStorage for data persistence
- Client-side only
- No authentication

**Production Requirements**:
- HIPAA compliance
- End-to-end encryption
- JWT authentication
- Role-based access control (RBAC)
- Audit logging
- Secure data transmission (HTTPS)
- Regular security audits

---

## Future Enhancements

**Cross-Platform**:
- Real-time collaboration
- Video consultations
- Mobile apps (iOS/Android)
- Offline mode (PWA)

**Features**:
- E-prescribing
- Lab integration
- Imaging (PACS)
- Billing/insurance integration
- Telemedicine
- Wearable device sync
- AI diagnostics
- Multi-language support

**Analytics**:
- Predictive analytics
- Patient flow optimization
- Resource allocation
- Outcome tracking

---

*Last Updated: May 2026*  
*Version: 1.0.0*  
*Platform: Medical Management System*  
*Roles: Patient, Doctor, Nurse, Admin*
