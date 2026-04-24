# Planning Guide

ARGOS Co-Sell IQ is an AI-powered co-sell detection tool for Microsoft enterprise sellers that scans communications to identify potential partner engagement opportunities and tracks them through the pipeline.

**Experience Qualities**:
1. **Premium** - Enterprise-grade polish with smooth animations and refined interactions that convey professional sophistication
2. **Intelligent** - AI-powered insights surface automatically with clear confidence scoring and contextual explanations
3. **Efficient** - Streamlined workflows minimize documentation burden while maximizing visibility into partner engagement opportunities

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This application features 5 distinct views with authentication, sophisticated state management across scan settings and detections, interactive filtering and sorting, real-time scanning simulation, and contextual actions based on detection types.

## Essential Features

**Authentication & Authorization**
- Functionality: Simulated Azure AD sign-in that gates access to authenticated views
- Purpose: Enterprise security pattern recognition and role-based interface
- Trigger: "Sign in with Azure Active Directory" button on landing page
- Progression: Click sign-in → 1.5s loading spinner → set authenticated state → redirect to Dashboard
- Success criteria: User object stored, all protected routes accessible, sign-out returns to landing

**Multi-Source Communication Scanning**
- Functionality: Configurable scanning of email, Teams chat, and meeting transcripts with filters for date range, accounts, and keywords
- Purpose: Surface undocumented co-sell engagements from actual seller communications
- Trigger: "Start Detection" button in Scan Settings view
- Progression: Configure sources/filters → Start Detection → 3s dramatic scan animation → populate Detections view with mock results
- Success criteria: Settings persist during session, scan animation completes, 8-10 detection cards appear with varied data

**AI-Powered Detection Management**
- Functionality: Review detection cards with confidence scores, view explanations, ignore false positives, or create/associate opportunities
- Purpose: Convert AI signals into documented MSX engagements efficiently
- Trigger: Navigation to Detections view after running scan
- Progression: Review card → assess confidence/explanation → Ignore (fade out + toast) OR Create/Associate (success state + green border)
- Success criteria: Cards update visually on action, toast notifications confirm, ignored items disappear, confirmed items show checkmark

**Comprehensive Dashboard Metrics**
- Functionality: 8-card metrics grid showing opportunities, referrals, mismatches, and undocumented engagements with drill-down actions
- Purpose: At-a-glance visibility into co-sell health and areas requiring attention
- Trigger: Landing on authenticated Dashboard view
- Progression: View loads → 1s skeleton animation → metrics populate → hover for tooltips → click actionable cards for navigation/alerts
- Success criteria: All metrics render with correct formatting, hover tooltips appear, clickable cards trigger appropriate actions

**Pipeline Tracking & Analysis**
- Functionality: Filterable, sortable table of all referrals and opportunities with status tracking
- Purpose: Unified view of active co-sell pipeline with partner attribution
- Trigger: Navigation to Pipeline view
- Progression: Load view → 1s skeleton → table populates → apply filters → click column headers to sort → click names for MSX simulation
- Success criteria: 15-20 rows render, filters update table in real-time, sorting toggles asc/desc, row clicks show modal

## Edge Case Handling

- **No Scan Run Yet** - Show compelling empty state with "Name it, I find it" and clear CTA to run first scan
- **Zero Detections** - Display encouraging message that no new co-sell signals found, prompt to adjust scan settings
- **High Keyword Count** - Warn users with amber alert when >5 keywords may over-constrain results
- **Unauthenticated Access** - Redirect all protected routes back to landing page if auth state is false
- **Export/Sync Actions** - Show informative toast about what would happen in production ("Generating Excel…", "Would open in MSX")
- **Ignored Detection Resurfacing** - Toast message explains ignored items will return if new evidence appears

## Design Direction

The design should evoke confidence, intelligence, and enterprise credibility - a premium tool that serious sellers trust with high-stakes partner relationships. Visual language balances professional restraint with moments of technological sophistication through subtle animations and glowing accent effects. Dark theme conveys focus and modernity while electric blue accents signal AI-powered intelligence and actionable insights.

## Color Selection

Dark enterprise theme with electric blue intelligence accents and status-driven color coding.

- **Primary Color**: Dark Navy (#0f1729 / oklch(0.12 0.02 240)) - Deep, authoritative background that conveys enterprise professionalism and reduces eye strain
- **Secondary Colors**: 
  - Slate Gray (#1e293b / oklch(0.20 0.015 240)) for card surfaces providing subtle elevation
  - Muted Gray (#64748b / oklch(0.52 0.012 240)) for secondary text and borders
- **Accent Color**: Electric Blue (#3b82f6 / oklch(0.62 0.19 250)) - Vibrant, intelligent accent for CTAs, active states, and key metrics that draws attention and signals AI capability
- **Foreground/Background Pairings**: 
  - Primary Navy (#0f1729): White text (#ffffff) - Ratio 16.2:1 ✓
  - Card Slate (#1e293b): White text (#ffffff) - Ratio 13.8:1 ✓
  - Electric Blue (#3b82f6): White text (#ffffff) - Ratio 4.9:1 ✓
  - Muted Gray (#64748b): White text (#ffffff) - Ratio 6.2:1 ✓

Additional semantic colors: Green (#10b981) success, Amber (#f59e0b) warning, Red (#ef4444) alert, Purple (#a855f7) outbound, Cyan (#06b6d4) data accents

## Font Selection

Typography should project modern enterprise professionalism with excellent readability across data-dense interfaces and long-form descriptions.

- **Primary Typeface**: Inter - Clean geometric sans-serif with excellent legibility at all sizes, professional without being sterile, optimal for both metrics and body text
- **Typographic Hierarchy**: 
  - H1 (View Titles): Inter Bold/32px/tight letter-spacing (-0.02em)/line-height 1.2
  - H2 (Section Headings): Inter SemiBold/24px/normal letter-spacing/line-height 1.3
  - H3 (Card Titles): Inter SemiBold/18px/normal letter-spacing/line-height 1.4
  - Body (Descriptions): Inter Regular/14px/normal letter-spacing/line-height 1.6
  - Metrics (Large Numbers): Inter Bold/28px/tight letter-spacing (-0.01em)/line-height 1.2
  - Small/Muted (Labels): Inter Medium/12px/slight letter-spacing (0.01em)/line-height 1.5

## Animations

Animations reinforce intelligence and responsiveness while maintaining enterprise professionalism - subtle functional transitions for everyday interactions, with dramatic "moments of magic" reserved for the AI scanning process to emphasize capability.

Key animation principles: Card hovers elevate 4px with soft blue glow (200ms ease), page transitions use 300ms fade, the scan animation features pulsing concentric radar circles over 3 seconds to build anticipation, toast notifications slide in from bottom-right (250ms ease), confirmed detection cards grow green left-border smoothly (300ms), and all buttons scale 1.02 on hover with brightness increase.

## Component Selection

- **Components**: 
  - Shadcn Button (primary, outline, ghost variants) for all CTAs and actions
  - Shadcn Card for metric cards, detection cards, and panel sections
  - Shadcn Badge for confidence scores, status pills, and tags
  - Shadcn Tooltip for metric hover descriptions
  - Shadcn Select for filter dropdowns in Pipeline
  - Shadcn Switch for toggles in Scan Settings
  - Shadcn Table for Top Opportunities and Pipeline data
  - Shadcn Dialog for modal confirmations
  - Sonner for toast notifications (success, warning, info)
  - Custom scanning animation overlay with SVG radar/pulse effect
  - Custom navigation tabs with animated underline indicator
  
- **Customizations**: 
  - Metric cards get custom hover state with transform translateY(-4px) and blue box-shadow glow
  - Detection cards have complex layout with left icon column, main content, and action button row
  - Navigation tabs custom-styled with active state electric blue underline that animates position
  - Table rows have custom alternating background opacity and smooth hover highlight
  - Loading skeletons match card layouts with pulsing gradient animation
  
- **States**: 
  - Buttons: default → hover (scale 1.02, brighten) → active (scale 0.98) → loading (spinner) → disabled (50% opacity)
  - Cards: default → hover (elevate + glow) → confirmed (green left-border + checkmark) → ignored (fade out)
  - Toggles: off (gray) → on (blue) with smooth slide and color transition
  - Table rows: default → hover (blue-tinted background) → selected (persistent highlight)
  
- **Icon Selection**: 
  - Lucide Shield/Radar for app logo
  - Lucide Mail, MessageSquare, Video, Layers for data sources
  - Lucide LayoutDashboard, Settings, Search, TrendingUp for navigation
  - Lucide CheckCircle for success states
  - Lucide AlertTriangle for warnings
  - Lucide Download for exports
  - Lucide X for removing chips/closing
  - Lucide ChevronDown for dropdowns
  - Lucide ArrowUpDown for sortable columns
  
- **Spacing**: 
  - Card internal padding: 16px (p-4)
  - Gap between cards: 24px (gap-6)
  - Section spacing: 32px (space-y-8)
  - Metric grid gap: 20px (gap-5)
  - Page container padding: 24px horizontal, 32px vertical
  
- **Mobile**: 
  - Metric grid: 4 columns → 2 columns (md) → 1 column (sm)
  - Navigation tabs: horizontal scroll with snap points on mobile
  - Detection cards: stack icon above content on narrow screens
  - Pipeline table: horizontal scroll container with sticky first column
  - Filter bar: vertical stack on mobile with full-width dropdowns
  - Top metrics in Pipeline: stack vertically on mobile
  - Dashboard insights panels: stack vertically below 768px
