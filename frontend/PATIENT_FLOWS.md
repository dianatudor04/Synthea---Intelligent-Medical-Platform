# Patient Portal - Flows & Functionality Documentation

## Overview

A modern, responsive medical management platform for patients with a calming design using soft blues (#E6F0FA / #3A7BD5) and muted greens (#E8F5E9). The platform provides comprehensive health management features including appointment booking, medical records, wellness resources, and AI assistance.

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Patient Dashboard](#patient-dashboard)
3. [Appointment Booking Flow](#appointment-booking-flow)
4. [Calendar Management](#calendar-management)
5. [Medical Files & Records](#medical-files--records)
6. [Wellness Blog](#wellness-blog)
7. [Profile Management](#profile-management)
8. [Settings](#settings)
9. [AI Chatbot](#ai-chatbot)
10. [Navigation](#navigation)

---

## Authentication Flow

### Welcome/Role Selection Page (`/`)

**Purpose**: Entry point for all users to select their role

**Elements**:
- **Patient Button**: Card with User icon
  - Action: Navigates to `/patient/auth/signup`
  - Design: White card with blue icon, hover animation
  
- **Doctor Button**: Card with Stethoscope icon
  - Action: Navigates to `/doctor`
  - Design: White card with green icon, hover animation
  
- **Nurse Button**: Card with Activity icon
  - Action: Navigates to `/nurse`
  - Design: White card with orange icon, hover animation
  
- **Admin Button**: Card with Shield icon
  - Action: Navigates to `/admin`
  - Design: White card with purple icon, hover animation

### Sign Up Page (`/patient/auth/signup`)

**Purpose**: Create new patient account

**Form Fields**:
- Email input (with Mail icon)
- Password input (with Lock icon and show/hide toggle)
- Confirm Password input (with Lock icon and show/hide toggle)

**Buttons**:
- **Back Button** (top-left with ArrowLeft icon)
  - Action: Returns to `/` (role selection)
  
- **Show/Hide Password Toggle** (eye icon in password field)
  - Action: Toggles password visibility
  
- **Create Account Button** (gradient blue-green)
  - Action: Validates form and navigates to `/patient/auth/profile-setup`
  - Validation: 
    - Email format check
    - Password minimum 8 characters
    - Passwords must match

**Links**:
- "Already have an account? Log in" → `/patient/auth/login`

### Login Page (`/patient/auth/login`)

**Purpose**: Authenticate existing patient

**Form Fields**:
- Email input
- Password input (with show/hide toggle)

**Buttons**:
- **Back Button** (top-left)
  - Action: Returns to `/`
  
- **Login Button** (gradient blue-green)
  - Action: Validates credentials and navigates to `/patient`
  - Validation: Email format, password required

**Links**:
- "Forgot password?" → `/patient/auth/forgot-password`
- "Don't have an account? Sign up" → `/patient/auth/signup`

### Forgot Password Page (`/patient/auth/forgot-password`)

**Purpose**: Password recovery

**Form Fields**:
- Email input

**Buttons**:
- **Back to Login** (top-left)
  - Action: Returns to `/patient/auth/login`
  
- **Send Reset Link Button** (gradient blue-green)
  - Action: Displays success confirmation modal
  - After success: "Back to Login" button → `/patient/auth/login`

### Profile Setup/Onboarding (`/patient/auth/profile-setup`)

**Purpose**: Complete patient profile after signup

**Step 1 - Personal Information**:

**Form Fields**:
- Full Name input (with User icon)
- Date of Birth date picker (with Calendar icon)

**Buttons**:
- **Continue Button** (gradient blue-green)
  - Action: Advances to Step 2
  - Validation: Full name and DOB required

**Step 2 - Medical Information**:

**Form Fields**:
- **Allergies Input** (with AlertCircle icon)
  - Searchable dropdown with predefined options:
    - Penicillin, Peanuts, Tree nuts, Shellfish, Eggs, Milk, Soy, Wheat, Fish, Latex, Aspirin, Ibuprofen, Sulfa drugs, Pollen
  - Can add custom allergies
  - Displays as blue tags with X button to remove
  - Press Enter to add

- **Medical Conditions Input** (with FileText icon)
  - Searchable dropdown with predefined options:
    - Diabetes, Hypertension, Asthma, Heart Disease, Arthritis, Depression, Anxiety, COPD, Kidney Disease, Thyroid Disorder
  - Can add custom conditions
  - Displays as green tags with X button to remove
  - Press Enter to add

- **Additional Notes Textarea** (optional)
  - Free-form text area for other medical information

**Buttons**:
- **Back Button**
  - Action: Returns to Step 1
  
- **Complete Setup Button** (gradient blue-green)
  - Action: Saves profile to localStorage and navigates to `/patient`
  - Data saved: fullName, dateOfBirth, allergies[], conditions[], medicalInfo

**Dropdown Interactions**:
- Click predefined option → Adds to list
- Type custom text + Enter → Adds custom entry
- X button on tag → Removes item

**Progress Indicator**:
- Visual stepper showing Step 1 or Step 2 of 2
- Step 1 shows checkmark when complete

---

## Patient Dashboard (`/patient`)

**Purpose**: Main hub for patient health management

### Header Section

**Elements**:
- **Personalized Greeting**: "Hello, [FirstName]"
  - Displays first name from localStorage profile
  - Fallback: "Hello, Guest" if no profile

**Buttons**:
- **Settings Button** (top-right, Settings icon in white circle)
  - Action: Navigates to `/patient/settings`
  
- **Profile Button** (top-right, User icon in gradient circle)
  - Action: Navigates to `/patient/profile`

### Primary Action

**Button**:
- **Book an Appointment** (large, prominent gradient button with CalendarPlus icon)
  - Action: Opens appointment booking modal
  - Design: Full-width, 80px height, gradient blue-green

### Calendar Section

**Purpose**: Display upcoming appointments and personal events

**Features**:
- Monthly calendar view
- Color-coded events:
  - Today: Gradient blue-green highlight
  - Appointments: Green background (#E8F5E9)
  - Personal events: Blue background (#E6F0FA)
- Small dots on dates with events

**Buttons**:
- **Previous Month** (ChevronLeft icon)
  - Action: Shows previous month
  
- **Next Month** (ChevronRight icon)
  - Action: Shows next month
  
- **Sync Calendar** (outline button with Plus icon)
  - Action: Placeholder for calendar sync functionality

**Legend**:
- Today indicator (gradient circle)
- Appointments (green circle)
- Personal Events (blue circle)

### Appointments Section

**Purpose**: List recent and upcoming appointments

**Appointment Cards** (each displays):
- Doctor avatar (initials in gradient circle)
- Doctor name and specialty
- Date and time (with Calendar and Clock icons)
- Location/Type (with MapPin or Video icons)
- Status badge:
  - **Missed**: Red badge
  - **Finalized**: Green badge
  - **Upcoming**: Blue badge

**Card Layout**:
- Hover effect: Shadow increases
- Smooth animations on load (staggered)

### Medical Files Section (Right Column)

**Purpose**: Manage medical documents

**Tabs**:
1. **Shared with Doctor**
   - Files visible to healthcare providers
   - Each file shows: icon, name, type, size, date
   - **Action Buttons** per file:
     - Eye icon: Preview file
     - Download icon: Download file

2. **Personal Uploads**
   - Patient's private documents
   - Each file shows: icon, name, type, size, date
   - **Action Buttons** per file:
     - Eye icon: Preview file
     - Trash icon: Delete file
   
   - **Upload Zone** (dashed border):
     - Upload icon
     - "Upload New File"
     - "Drag and drop or click to browse"
     - Action: Opens file picker

### Wellness Blog Section

**Purpose**: Health education and tips

**Blog Cards** (3 displayed, each shows):
- High-quality wellness image from Unsplash
- Category badge (Nutrition/Mental Health/Lifestyle)
- Title
- Short description

**Buttons**:
- **View All** (top-right with ArrowRight icon)
  - Action: Navigates to `/patient/blog`
  
- **Each Blog Card** (clickable)
  - Action: Navigates to `/patient/blog`
  - Hover: Card lifts up (-4px)

---

## Appointment Booking Flow

### Book Appointment Modal

**Triggered by**: "Book an Appointment" button on dashboard

**Modal Header**:
- "Book Appointment" title
- Step indicator: "Step X of 3"
- Close button (X icon)
  - Action: Closes modal

### Step 1: Select a Doctor

**Doctor Cards** (each displays):
- Avatar circle with initials (gradient background)
- Doctor name
- Specialty
- Chevron right icon

**Interactions**:
- Hover: Border turns blue, background lightens
- Click: Selects doctor and advances to Step 2

### Step 2: Select Date & Appointment Type

**Navigation**:
- **Back to doctors** link (top)
  - Action: Returns to Step 1

**Date Selection**:
- Grid of 5 available dates
- Each date shows:
  - Calendar icon
  - Formatted date (e.g., "Thu, May 08")
- Click to select
- Selected date: Blue border and background

**Appointment Type**:
- **In-Person Button**
  - MapPin icon
  - "In-Person" label
  - Selected: Blue border and background
  
- **Video Call Button**
  - Video icon
  - "Video Call" label
  - Selected: Green border and background

**Buttons**:
- **Continue to Time Selection** (gradient button)
  - Action: Advances to Step 3
  - Enabled only when date is selected

### Step 3: Select Time & Confirm

**Navigation**:
- **Back to date** link (top)
  - Action: Returns to Step 2

**Time Selection**:
- Grid of available time slots (3 columns)
- Each slot shows:
  - Clock icon
  - Time (e.g., "09:00 AM")
- States:
  - Available: White background, hover effect
  - Selected: Blue border and background
  - Unavailable: Gray, disabled

**Appointment Summary** (appears when time selected):
- Blue background panel
- Shows:
  - Doctor name (User icon)
  - Date (Calendar icon)
  - Time (Clock icon)
  - Type (Video or MapPin icon)

**Buttons**:
- **Confirm Appointment** (gradient button)
  - Action: 
    - Saves appointment to localStorage
    - Updates calendar
    - Closes modal
    - Returns to dashboard

---

## Calendar Management

### Calendar Integration

**Data Flow**:
1. Booked appointments stored in localStorage
2. Calendar component reads appointments on load
3. Displays appointments as events on calendar
4. Updates automatically when new appointment booked

**Event Types**:
- **Today**: Gradient background, white text
- **Appointments**: Green background (#E8F5E9), green text
- **Personal Events**: Blue background (#E6F0FA), blue text
- **Regular Days**: White background, gray text, hover effect

**Interaction**:
- Click any date: Potential for showing day details (placeholder)
- Month navigation: Previous/Next buttons

---

## Medical Files & Records

### Shared Files Section

**Purpose**: Documents accessible to healthcare providers

**File Display**:
- Icon (gradient background)
- File name
- Metadata: Type • Size • Upload date

**Actions per File**:
- **View Button** (Eye icon)
  - Action: Preview file (placeholder)
  
- **Download Button** (Download icon)
  - Action: Download file (placeholder)

### Personal Uploads Section

**Purpose**: Patient's private document storage

**File Display**:
- Icon (gradient background)
- File name
- Metadata: Type • Size • Upload date

**Actions per File**:
- **View Button** (Eye icon)
  - Action: Preview file (placeholder)
  
- **Delete Button** (Trash icon, red on hover)
  - Action: Remove file (placeholder)

**Upload Area**:
- Dashed border, rounded corners
- Upload icon
- Primary text: "Upload New File"
- Secondary text: "Drag and drop or click to browse"
- **Interaction**:
  - Click: Opens file picker
  - Drag & drop: Accepts files (placeholder)

---

## Wellness Blog

### Blog Listing Page (`/patient/blog`)

**Purpose**: Browse health and wellness articles

**Header**:
- Page title: "Wellness Blog"
- Subtitle: "Expert tips and advice for a healthier lifestyle"
- **Back Button** (top-left, only on mobile)
  - Action: Returns to `/patient`

**Blog Grid**:
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Each card shows:
  - Featured image (Unsplash wellness photo)
  - Category badge (blue)
  - Read time estimate
  - Article title
  - Description preview
  - Full article content excerpt

**Card Interactions**:
- Hover: Lifts up (-8px), shadow increases
- Click: Placeholder for article detail view

**Categories**:
- Nutrition (green theme)
- Mental Health (blue theme)
- Lifestyle (orange theme)

---

## Profile Management

### Profile Page (`/patient/profile`)

**Purpose**: View and edit personal and medical information

**Header**:
- **Back Button** (top-left)
  - Action: Returns to `/patient`
  
- **Edit Profile Button** (when not editing)
  - Edit2 icon, gradient background
  - Action: Enables editing mode
  
- **Cancel Button** (when editing)
  - X icon, outline style
  - Action: Discards changes, exits editing mode
  
- **Save Changes Button** (when editing)
  - Save icon, gradient background
  - Action: Saves to localStorage, exits editing mode

### Profile Form

**Fields** (all read-only unless editing):

1. **Full Name**
   - User icon
   - Text input
   - Editable in edit mode

2. **Date of Birth**
   - Calendar icon
   - Date picker
   - Editable in edit mode

3. **Allergies**
   - AlertCircle icon
   - In edit mode: Searchable dropdown (same as profile setup)
   - Display: Blue tags with X button to remove
   - Shows "No allergies recorded" if empty

4. **Medical Conditions**
   - FileText icon
   - In edit mode: Searchable dropdown (same as profile setup)
   - Display: Green tags with X button to remove
   - Shows "No conditions recorded" if empty

5. **Additional Notes**
   - Textarea
   - Editable in edit mode

**Interaction Flow**:
1. Click "Edit Profile"
2. Fields become editable
3. Modify information
4. Click "Save Changes" or "Cancel"

---

## Settings

### Settings Page (`/patient/settings`)

**Purpose**: Manage preferences and account settings

**Header**:
- **Back Button**
  - Action: Returns to `/patient`

### Notifications Section

**Icon**: Bell in blue circle

**Toggles** (Switch components):

1. **Push Notifications**
   - Description: "Receive notifications in the app"
   - Default: ON
   - Action: Toggles push notification permission

2. **Email Notifications**
   - Description: "Receive updates via email"
   - Default: ON
   - Action: Toggles email preferences

3. **SMS Notifications**
   - Description: "Receive text message updates"
   - Default: OFF
   - Action: Toggles SMS preferences

4. **Appointment Reminders**
   - Description: "Get reminded before appointments"
   - Default: ON
   - Action: Toggles reminder notifications

### Appearance Section

**Icon**: Moon in green circle

**Toggle**:
- **Dark Mode**
  - Description: "Toggle dark theme"
  - Default: OFF
  - Action: Switches theme (placeholder)

### Privacy & Security Section

**Icon**: Shield in blue circle

**Options** (Clickable rows):

1. **Change Password**
   - Lock icon
   - Description: "Update your password"
   - Action: Navigates to change password page (placeholder)

2. **Language**
   - Globe icon
   - Current: "English (US)"
   - Action: Opens language selector (placeholder)

### Account Actions

**Button**:
- **Log Out** (full-width, red outline)
  - LogOut icon
  - Action: 
    - Clears localStorage (profile, appointments)
    - Navigates to `/` (role selection)

---

## AI Chatbot

### Floating Chatbot Button

**Purpose**: 24/7 AI health assistance

**Location**: Fixed bottom-right corner (all patient pages)

**Button**:
- Circular, gradient blue-green
- 64x64 pixels
- MessageCircle icon (or X when open)
- **Actions**:
  - Click: Opens/closes chat window
  - Hover: Scales up (1.1x)
  - Tap: Scales down (0.95x)

### Chat Window

**Header**:
- Gradient blue-green background
- Avatar circle with MessageCircle icon
- "Health Assistant" title
- "Online" status
- **Close Button** (X icon)
  - Action: Closes chat window

**Chat Area**:
- Height: 384px
- Scrollable message list
- Messages display:
  - Bot messages: Left-aligned, gray background
  - User messages: Right-aligned, gradient background
- Default bot message: "Hello! I'm your health assistant. How can I help you today?"

**Input Area**:
- Text input field
  - Placeholder: "Type your message..."
  - Rounded pill shape
  - Press Enter: Sends message

- **Send Button** (circular, gradient)
  - Send icon
  - Action: Sends message

**Message Flow**:
1. User types message
2. Clicks Send or presses Enter
3. User message appears (right side)
4. After 1 second delay
5. Bot response appears (left side)
6. Bot message: "I'm here to help with booking appointments, answering health questions, and providing guidance. What would you like assistance with?"

---

## Navigation

### Bottom Navigation Bar (Mobile)

**Location**: Fixed bottom, 80px height
**Background**: White with backdrop blur

**Navigation Items** (5 total):

1. **Home** (Home icon)
   - Route: `/patient`
   - Active: Blue text, blue background
   
2. **Appointments** (Calendar icon)
   - Route: `/patient/appointments`
   - Active: Blue text, blue background
   
3. **Wellness** (BookOpen icon)
   - Route: `/patient/blog`
   - Active: Blue text, blue background
   
4. **Ask AI** (MessageSquare icon)
   - Route: `/patient/chat`
   - Active: Blue text, blue background
   
5. **Alerts** (Bell icon)
   - Route: `/patient/notifications`
   - Active: Blue text, blue background
   - Badge: Red dot notification indicator (animated pulse)

**Interaction**:
- Click: Navigates to route
- Active state: Blue color, rounded background
- Inactive state: Gray color, no background

---

## Data Persistence

### LocalStorage Keys

1. **`patientProfile`** (JSON object)
   - Stores: fullName, dateOfBirth, allergies[], conditions[], medicalInfo
   - Set by: Profile setup, Profile edit
   - Read by: Dashboard (greeting), Profile page, Calendar

2. **`appointments`** (JSON array)
   - Stores: [{doctor, specialty, date, time, type}]
   - Set by: Book appointment modal
   - Read by: Dashboard (appointments list), Calendar (events)

### Data Flow

**Profile Creation**:
1. Sign up → Profile setup → Save to localStorage
2. Dashboard reads fullName for greeting
3. Profile page displays all data

**Appointment Booking**:
1. Modal captures: doctor, date, time, type
2. Saves to localStorage.appointments[]
3. Calendar reads and displays as events
4. Appointments list shows recent bookings

**Logout**:
1. Clears localStorage.patientProfile
2. Clears localStorage.appointments
3. Redirects to role selection

---

## Responsive Behavior

### Mobile (< 768px)
- Bottom navigation visible
- Single column layout
- Stacked sections
- Full-width components
- Touch-optimized tap targets (44px minimum)

### Tablet (768px - 1024px)
- Bottom navigation visible
- 2-column grid for blog
- Larger tap targets
- Modal max-width: 90vw

### Desktop (> 1024px)
- Bottom navigation hidden
- 3-column layouts
- Sidebar for medical files
- Modal max-width: 672px
- Hover effects active

---

## Design System

### Colors

**Primary**:
- Medical Blue: `#3A7BD5`
- Medical Blue Light: `#E6F0FA`
- Medical Green: `#4CAF50`
- Medical Green Light: `#E8F5E9`

**Status**:
- Missed: `#ef4444` (red)
- Finalized: `#4CAF50` (green)
- Upcoming: `#3A7BD5` (blue)

**Gradients**:
- Primary: `from-[#3A7BD5] to-[#4CAF50]`
- Background: `from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30`

### Typography

**Headings**:
- H1: 36px (2.25rem), font-bold
- H2: 30px (1.875rem), font-bold
- H3: 24px (1.5rem), font-semibold
- H4: 20px (1.25rem), font-semibold

**Body**: 16px base, font-normal

### Spacing

**Border Radius**:
- Small: 12px (rounded-xl)
- Medium: 24px (rounded-2xl)
- Large: 28px (rounded-3xl)
- Full: 9999px (rounded-full)

**Shadows**:
- Small: `shadow-sm`
- Medium: `shadow-lg`
- Large: `shadow-xl`
- Extra Large: `shadow-2xl`

### Animations

**Motion Library** (Framer Motion):
- Entrance: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`
- Hover: `whileHover={{ y: -4 }}`
- Tap: `whileTap={{ scale: 0.98 }}`
- Transitions: `duration: 0.5s` (default)

---

## Accessibility Features

1. **Semantic HTML**: Proper heading hierarchy, button elements
2. **ARIA Labels**: Icons have descriptive labels
3. **Focus States**: Visible focus rings on interactive elements
4. **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
5. **Touch Targets**: Minimum 44x44px on mobile
6. **Keyboard Navigation**: Tab order follows visual flow
7. **Screen Reader**: Descriptive text for icons and actions

---

## Future Enhancements

1. **Video Call Integration**: WebRTC implementation for video appointments
2. **Real-time Notifications**: WebSocket for live updates
3. **File Upload**: Actual document upload with cloud storage
4. **Payment Integration**: Billing and insurance management
5. **Multi-language Support**: i18n implementation
6. **Offline Mode**: PWA with service workers
7. **Wearable Integration**: Sync health data from devices
8. **Medication Reminders**: Push notifications for prescriptions
9. **Telemedicine**: In-app doctor consultations
10. **Health Analytics**: Track vitals, trends, and insights

---

## Error Handling

### Validation Errors
- Inline error messages below fields
- Red text color (#ef4444)
- Prevents form submission until resolved

### Network Errors
- Toast notifications (placeholder)
- Retry mechanisms
- Fallback UI states

### Empty States
- "No allergies recorded"
- "No conditions recorded"
- "No appointments scheduled"
- Helpful illustrations and CTAs

---

## Security Considerations

1. **Data Storage**: Currently localStorage (development only)
2. **Production**: Requires backend authentication, JWT tokens
3. **HIPAA Compliance**: Encrypted data transmission, audit logs
4. **Password Requirements**: Minimum 8 characters
5. **Session Management**: Logout clears sensitive data
6. **Input Sanitization**: Prevent XSS attacks
7. **File Upload**: Virus scanning, file type validation

---

*Last Updated: May 2026*
*Version: 1.0.0*
