# Design Guidelines: DHL Payment Verification Application

## Design Approach

**Reference-Based Approach**: Drawing from established payment platforms and enterprise admin interfaces:
- DHL payment flow: Inspired by Stripe's checkout and DHL's official brand guidelines
- PayPal verification: Match PayPal's actual login interface styling
- Admin panel: Linear/Notion-style clean dashboard aesthetic

**Core Principle**: Professional, trustworthy, secure-looking interface that builds user confidence during payment flows.

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN)
- Fallback: system-ui, sans-serif

**Hierarchy**:
- Page Headers: text-3xl font-bold
- Section Titles: text-xl font-semibold
- Form Labels: text-sm font-medium
- Input Text: text-base font-normal
- Helper Text: text-sm text-gray-600
- Button Text: text-base font-semibold
- Admin Panel Headers: text-2xl font-bold

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8
- Form spacing: gap-4 between fields, gap-6 between sections
- Card padding: p-6 for compact cards, p-8 for main forms
- Page margins: py-8 for mobile, py-12 for desktop
- Component spacing: space-y-4 within forms, space-y-6 between major sections

**Container Strategy**:
- Payment forms: max-w-md mx-auto (centered, focused)
- Admin panel: max-w-6xl mx-auto (wider for data management)
- Full-width header/footer: w-full with inner container

**Grid System**:
- Payment forms: Single column stack
- Admin panel: 2-column layout (lg:grid-cols-2) for configuration sections
- OTP inputs: grid-cols-6 for individual digit boxes

## Component Library

### DHL Payment Flow Components

**1. Card Payment Form**
- Card number input with masking (•••• •••• •••• 1234)
- Expiry date: 2-column grid (MM/YY split)
- CVV input with security icon
- Cardholder name input
- "Proceed to Verification" primary button at bottom
- DHL logo placement at top center
- Progress indicator: Step 1 of 4

**2. OTP Verification Pages (2 pages)**
- 6-digit OTP input with individual boxes (w-12 h-12 each)
- "Enter the code sent to your device" instruction text
- Resend code link (text-sm, underlined)
- "Verify Code" primary button
- Progress indicators: Step 2 of 4, Step 3 of 4

**3. Success/Confirmation Page**
- Large checkmark icon (Heroicons: check-circle)
- "Merci de votre paiement" heading (text-2xl)
- Order summary card with payment details
- "Return to Home" secondary button

### PayPal Verification Section

**PayPal Login Page**
- PayPal logo at top (authentic branding)
- Email input field
- Password input field with show/hide toggle icon
- "Log In" primary button (PayPal blue styling reference)
- "Having trouble logging in?" link below
- Security badge/trust indicators at bottom

**Image Placement**: PayPal logo and security badge images (describe: Official PayPal logo SVG, security lock badge)

### Admin Panel Components

**Navigation Sidebar**:
- Fixed left sidebar (w-64)
- Dashboard, Settings, Notifications menu items
- Logout at bottom
- Icons from Heroicons (cog, bell, chart-bar)

**Telegram Configuration Card**:
- Section header: "Telegram Integration"
- Bot Token input (full width, monospace font for token)
- Chat ID input
- Test Connection button (secondary style)
- Save Configuration button (primary style, positioned at bottom-right)
- Success/error message toast display area
- 2-column grid for connection status and last sync time

**Activity Log Section**:
- Table layout with columns: Timestamp, Payment ID, Amount, Status
- 10 rows per page
- Pagination controls at bottom
- Filter/search bar at top

## Form Design Patterns

**Input Fields**:
- Height: h-12 for all text inputs
- Border: border with subtle rounded corners (rounded-lg)
- Focus state: Enhanced border treatment
- Label positioning: Above input with mb-2
- Required field indicator: Asterisk in label

**Buttons**:
- Primary: Large (h-12), full-width on mobile, auto-width on desktop
- Secondary: h-10, outlined style
- Disabled state: Reduced opacity
- Icons: Leading icons for actions (lock, send, save)

**Card Containers**:
- White background with subtle shadow
- Rounded corners: rounded-xl
- Border: Optional light border for definition
- Padding: p-6 standard, p-8 for forms

## Layout Specifications

**Page Structure**:
1. **DHL Payment Pages**: Centered card layout (max-w-md) with logo header, progress stepper, and form content
2. **PayPal Page**: Similar centered layout matching PayPal's authentic design
3. **Admin Panel**: Full-width dashboard with fixed sidebar + main content area

**Responsive Behavior**:
- Mobile: Single column, full-width forms with p-4 padding
- Desktop: Centered forms with generous whitespace (p-8)
- Admin panel: Collapse sidebar to hamburger menu on mobile

## Security Visual Cues

- Lock icons next to sensitive inputs (CVV, passwords)
- SSL/security badge in footer
- Step progress indicators showing current position
- "Secure Payment" text with shield icon above card form

## Images

**Required Images**:
1. DHL Logo (SVG/PNG): Top center of payment pages, h-12
2. PayPal Logo (SVG): Authentic PayPal branding, h-10
3. Security Badges: SSL certificate badge, payment provider logos

No hero images needed - this is a form-focused application prioritizing trust and usability over marketing aesthetics.

## Animations

**Minimal Motion**:
- Form validation: Subtle shake on error
- Button loading states: Spinner icon
- Page transitions: Simple fade (avoid distracting animations during payment flow)
- Success state: Scale-in animation for checkmark icon only