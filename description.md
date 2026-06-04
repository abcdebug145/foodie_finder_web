# Gen Z Energy Drink Landing Page - UI/UX Design Rules

## Color System

### Primary Colors
- **Primary Brand Color:** Neon Lime Green (`#AFFF00` / `oklch(0.92 0.2 128)`)
  - Used for accent elements, highlights, CTAs, and emphasis
  - Creates vibrant, energetic visual identity
- **Charcoal Black:** `#121212` / `oklch(0.145 0 0)`
  - Primary text, backgrounds, and dark elements
  - Represents energy and intensity
- **White/Off-white:** `oklch(1 0 0)` for backgrounds and cards
  - Clean contrast against dark text

### Secondary Colors
- **Pineapple Orange:** `#f59e0b` - used for flavor variations and accent states
- **Emerald Green:** `#84cc16` - used for flavor variations and secondary accents
- **Coconut Beige:** `oklch(0.95 0.03 90)` - subtle background overlays

### Color Rules
- Neon lime is the primary accent for all interactive elements (buttons, hover states, glows)
- Dark backgrounds (`#121212`) are used for footer, navigation (when scrolled), and dark sections
- White backgrounds for content sections ensure readability and visual separation
- Opacity overlays: Use `rgba(175,255,0,0.1)` to `rgba(175,255,0,0.6)` for glowing effects
- Border colors default to subtle grays (`#121212/10`, `#121212/20`, white/10, white/20)
- Text hierarchy: Primary text in charcoal on light backgrounds, white on dark backgrounds
- Muted text: `text-[#121212]/60` or `text-white/60` for secondary information
- Ensure minimum 4.5:1 contrast ratio for all text

## Typography

### Font Stack
- **Sans-serif (body & headings):** Inter, system-ui
  - Primary font for all UI elements
- **Monospace (secondary text, labels, metadata):** JetBrains Mono or Geist Mono
  - Used for taglines, technical labels, and small copy

### Font Sizes & Hierarchy
- **H1 (Hero/Main Headlines):** 48px (mobile) → 80px (desktop)
  - Font-weight: `font-black` (900)
  - Line-height: 0.9 (tight leading for impact)
  - Example: "FUEL YOUR AMBITION"
  
- **H2 (Section Headers):** 32px (mobile) → 56px (desktop)
  - Font-weight: `font-black` (900)
  - Line-height: 0.9
  - Example: "READY TO LEVEL UP?"

- **H3 (Sub-headers):** 24px (mobile) → 40px (desktop)
  - Font-weight: `font-bold` (700)
  - Used for flavor names and section subheadings

- **Body Text (Paragraph):** 16px - 18px
  - Font-weight: `font-normal` (400)
  - Line-height: 1.6 (relaxed for readability)

- **Small Text/Labels:** 12px - 14px
  - Font-weight: `font-mono` (monospace font)
  - Letter-spacing: `tracking-wide` or `tracking-widest` for technical labels
  - Used for taglines, badges, metadata: "CITRUS SHOCK", "OUR FLAVOURS"

- **Button Text:** 12px - 14px
  - Font-weight: `font-bold` (700)
  - Letter-spacing: `tracking-wide`

### Typography Rules
- Headlines use `tracking-tighter` (negative letter-spacing) for compact, bold appearance
- Body text uses `tracking-tight` or default spacing for natural reading flow
- Tags/labels use `tracking-widest` for emphasis and technical feel
- Use `text-balance` or `text-pretty` on headings to prevent awkward breaks
- Monospace fonts restricted to small labels, metadata, and placeholder text only
- All text must maintain readability: minimum 14px for body, minimum 12px for small labels

## Spacing System

### Spacing Scale (Tailwind conventions)
- Base unit: 4px
- **Padding:** `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px), `pt-2` (8px), `px-6` (24px horizontal)
- **Margin:** `mx-auto` for centering, `my-6` (24px vertical), `mb-12` (48px for section breaks)
- **Gap (flexbox/grid):** `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)

### Layout Spacing Rules
- **Section vertical spacing:** 64px - 96px between major sections (use `py-16` = 64px or `py-24` = 96px)
- **Content max-width:** `max-w-7xl` (1280px) with `mx-auto` for all container sections
- **Horizontal padding:** `px-6` (24px) on container divs for mobile & desktop consistency
- **Card internal padding:** `p-6` (24px) minimum for card containers, `p-8` (32px) for spacious layouts
- **Button internal padding:** `px-6 py-3` (24px horizontal, 12px vertical) for standard buttons
- **Component gap spacing:** Always use `gap-X` between flex/grid children rather than margin
- **Never mix margin and gap** on the same element
- **Element spacing within containers:** Use consistent `space-y-4` or `space-y-6` for stacked elements

## Border Radius

### Radius Scale
- **Consistent radius:** `--radius: 0.5rem` (8px) as base
  - Small elements: `radius-sm` = 4px
  - Medium (default): `radius-md` = 6px
  - Standard: `radius-lg` = 8px (use `rounded-lg` in Tailwind)
  - Large: `radius-xl` = 12px (use `rounded-xl`)

### Radius Rules
- Buttons: `rounded-full` (50% border radius for pill-shaped buttons)
- Cards & containers: `rounded-lg` or `rounded-xl` (8px or 12px)
- Input fields: `rounded-xl` (12px)
- Badges/tags: `rounded-full` (pill-shaped)
- Carousel/spotlight containers: `rounded-3xl` (24px) for larger visual impact
- Keep radius consistent across similar component types

## Component Styling

### Buttons
**Primary CTA Button (Neon lime with dark text):**
- Background: `#AFFF00` (neon lime)
- Text color: `#121212` (charcoal black)
- Padding: `px-6 py-3` (24px × 12px)
- Border-radius: `rounded-full`
- Font: `font-bold text-sm tracking-wide`
- Hover state: `scale(1.05)` with slight glow effect
- Tap state: `scale(0.98)`
- Transition: Spring animation `stiffness: 400, damping: 17`
- Include subtle gradient overlay (white/30) for shine effect on hover

**Secondary Button (Dark border, light text on scroll):**
- Border: `border-2 border-[#121212]` or `border-2 border-white/20`
- Background: Transparent
- Hover state: Solid background fills with black/white + text color inverts
- Padding: `px-6 py-3`
- Border-radius: `rounded-full`

**Ghost Button (Nav links):**
- Background: Transparent
- Underline on hover: `underline-[#AFFF00]` scales from 0 to 1 width
- Transition: `duration-300`

### Input Fields
- Background: `bg-white/5` or `bg-white/10` (light background)
- Border: `border-2 border-white/20` (light border)
- Text color: White
- Placeholder: `placeholder:text-white/40`
- Focus state: `focus:border-[#AFFF00] focus:outline-none`
- Glow on focus: `box-shadow: 0 0 20px rgba(175,255,0,0.2)`
- Padding: `px-4 py-3`
- Border-radius: `rounded-xl`
- Font: `font-mono text-sm`

### Navigation Bar
- **Default state:** Transparent background, dark text (`text-[#121212]`)
- **Scrolled state (y > 50px):** 
  - Background: `bg-[#121212]/95` (semi-transparent dark)
  - Backdrop blur: `backdrop-blur-md`
  - Border: `border-b border-white/10`
  - Text: White/light colors (`text-white`)
- **Logo:** Split color `"Gi" + "Gi"` where second "Gi" is neon lime with pulsing glow
- **Link styling:** Hover underline effect with spring animation
- **Mobile menu:** Collapse into hamburger, same dark background and styling
- **Transition duration:** `duration-500` for smooth theme switching on scroll

### Cards & Containers
- **Card background:** White with subtle border (`border-2 border-[#121212]/10`)
- **Card padding:** `p-6` or `p-8` depending on content density
- **Border-radius:** `rounded-3xl` for larger visual impact
- **Shadow:** `shadow-xl` for depth
- **3D perspective:** Use `perspective: 1000` for mouse-interactive cards
- **Box shadow on interaction:** `0 0 20px rgba(175,255,0,0.3)` to `0 0 40px rgba(175,255,0,0.6)`

### Badges & Tags
- **Background:** `bg-[#121212]/5` or `bg-[#121212]/10` (subtle dark tint)
- **Text:** `text-[#121212]/60` (muted text color)
- **Padding:** `px-2 py-1`
- **Border-radius:** `rounded-full`
- **Font:** `font-mono text-xs`

## Animation & Motion

### Spring Configuration
Standard spring settings used throughout:
- **Stiffness:** 100-400 (higher = snappier)
- **Damping:** 17-30 (higher = less bouncy)
- For most UI interactions: `stiffness: 400, damping: 17` (snappy, responsive)

### Animation Patterns

**Fade-up on scroll/view:**
```
Initial: opacity 0, y 40px
Animate: opacity 1, y 0
Duration: 0.8s
Easing: [0.25, 0.4, 0.25, 1] (custom cubic bezier)
```

**Scale-in animation:**
```
Initial: opacity 0, scale 0.8, rotate -10deg
Animate: opacity 1, scale 1, rotate 0deg
Duration: spring with stiffness 100, damping 20
Delay: 0.3s
```

**Hover interactions:**
- Buttons: `scale 1.02-1.05` on hover
- Cards: `scale 1.05` on hover
- Elements: Spring transition with stiffness 400, damping 17
- Tap: `scale 0.98` for tactile feedback

**Glowing effects:**
- Pulsing glow: `0 0 20px rgba(175,255,0,0.3)` to `0 0 40px rgba(175,255,0,0.6)` over 2s loop
- Rotation on hover: `-5deg` to `5deg` for subtle movement
- Floating animation: `-20px` vertical movement over 6s ease-in-out

**Text-specific animations:**
- Staggered children: `delayChildren: 0.15, staggerChildren: 0.08`
- Individual item delay: `delay: i * 0.1` per child index
- Overflow hidden on text for reveal effect

**Scroll-linked animations:**
- Parallax offset: Y-axis transform based on scroll progress
- Scale reduction: 1 → 0.9 as user scrolls
- Fade out: opacity 1 → 0 as section exits viewport
- Text horizontal shift:±100px based on scroll position

### Lenis Smooth Scroll
- Integrated for smooth scrolling behavior
- Smooth scroll to section offset: `-100px` for navigation anchors
- Duration: Default smooth

## Layout Structure

### Grid System
- **Desktop layout:** CSS Grid for 2+ column layouts (bento, multi-section grids)
- **Mobile-first:** Single column by default, grid columns introduced at `md:` breakpoint
- **Common grid patterns:**
  - `grid-cols-2` for 2-column layouts (md and up)
  - `grid-cols-3` or `grid-cols-4` for multi-item layouts
  - Gap: `gap-4` (16px) to `gap-8` (32px) between items
- **Hero section:** `lg:grid-cols-2` (2 columns on desktop, 1 on mobile) with `items-center`

### Flexbox Patterns
- **Navigation:** `flex items-center justify-between`
- **Button groups:** `flex flex-wrap gap-3` for flowing layout
- **Vertical stacks:** `flex flex-col gap-4` or use `space-y-*` classes
- **Centered content:** `flex items-center justify-center`
- **Alignment:** `items-center`, `items-start`, `justify-between`, `justify-center`

### Hero Section Layout
- Min-height: `min-h-[90vh]` for full-screen impact
- Content width: `max-w-7xl mx-auto`
- Padding: `px-6` horizontal, `pt-24 pb-12` vertical
- 2-column grid on desktop (text left, image right)
- Image alignment: `flex justify-center` with `relative z-10` layering
- Background: White with subtle gradient overlay and noise texture

### Section Backgrounds
- **Light sections:** White (`bg-white`) or off-white (`bg-[#FAFAFA]`)
- **Dark sections:** Charcoal (`bg-[#121212]`)
- **Background gradients:** Subtle directional gradients (`bg-gradient-to-br`, `from-white via-[color]/5 to-white`)
- **Overlay elements:** Blurred circles (`blur-3xl`) positioned absolutely for visual interest
- **Noise texture:** Optional SVG-based noise overlay with low opacity (0.03)

## Responsive Behavior

### Breakpoints
Use Tailwind CSS breakpoints:
- **sm:** 640px (tablets, small devices)
- **md:** 768px (medium tablets, landscape phones)
- **lg:** 1024px (standard desktop)
- **xl:** 1280px and up (large desktop)

### Responsive Patterns
- **Navigation:** Hide desktop nav items on mobile (`hidden md:flex`), show hamburger menu (`md:hidden`)
- **Grid changes:** 
  - `grid-cols-1` (mobile) → `md:grid-cols-2` → `lg:grid-cols-4`
  - Cards stack vertically on mobile, spread horizontally on desktop
- **Font scaling:** 
  - Headings: `text-4xl` → `md:text-5xl` → `lg:text-6xl`
  - Body: `text-base` stays constant for readability
- **Button layout:** 
  - `flex-col gap-3` on mobile → `flex-row gap-3` on md+
  - Full-width buttons on mobile, auto-width on desktop
- **Padding/spacing:** 
  - Mobile: `px-4` or `px-6`
  - Desktop: `px-6` or `px-8` with max-width container
- **Image sizing:** Use responsive `width` and `height` props with Next.js `Image` component
- **Hero layout:** 
  - Single column stacked text+image on mobile
  - Two-column grid on `lg:` breakpoint with `gap-8`

## Interactive States

### Hover States
- **Buttons:** Scale 1.02 to 1.05 with spring transition, optional glow
- **Links:** Color change to neon lime, optional underline expansion
- **Cards:** Scale 1.05, shadow/glow enhancement
- **Icons:** Rotate ±5deg, optional color shift
- All hover states use spring config: stiffness 400, damping 17

### Focus States
- **Input focus:** Border color changes to neon lime, glow shadow appears
- **Button focus:** Same as hover (visible focus indicator)
- **Outline:** `outline-ring/50` for keyboard navigation visibility

### Active States
- **Carousel indicators:** Current slide color is accent color, others are muted
- **Navigation links:** Underline for current/active section
- **Tabs:** Active tab has background fill, inactive are transparent

### Disabled States
- **Buttons:** Opacity 0.5, no hover effects, cursor: not-allowed
- **Inputs:** Opacity 0.6, background darkening, cursor: not-allowed

### Loading States
- **Buttons:** Animate text with pulsing opacity or show spinner
- **Inputs:** Subtle border glow pulsing
- **Containers:** Skeleton shimmer or fade overlay

## Component-Specific Rules

### Hero Section
- Full viewport height: `min-h-[90vh]`
- Animated background orbs: Blur-3xl, moving in continuous loops
- Product image: Floating animation with 6s ease-in-out cycle
- Scroll indicator: Animated pulse at bottom, reveals scroll hint
- Tagline badge: Animated dot with pulsing scale effect
- CTA buttons: Gradient shine effect on hover

### Flavor Carousel
- Active slide: 3D perspective with mouse-linked rotation (rotateX/Y ±5deg)
- Transition: Spring-based slide animation with scale and opacity
- Indicators: Animated width change, colored by accent
- Navigation arrows: Hidden on mobile, visible on md+ with hover scale effect
- Card background: Gradient specific to current flavor accent color

### Bento Grid / Product Showcase
- Responsive grid layout: 1 column mobile → 2-3 columns desktop
- Image containers: Aspect ratio locked with fill property
- Text overlays: Positioned absolutely with semi-transparent backgrounds
- Interactive elements: Hover scale and shadow effects

### Social Section
- Organized in grid (2 or 3 columns depending on screen size)
- Image content: Full bleed with overlay text
- Hashtag/metadata: Positioned overlay with semi-transparent background
- Call-to-action: Icon link or button overlaid

### Footer
- Background: Dark (`bg-[#121212]`)
- Link sections: 2 columns mobile → 4 columns desktop (`grid-cols-2 md:grid-cols-4`)
- Newsletter signup: Input + button row, stack vertically on mobile
- Logo animation: Scale and glow on hover with pulsing effect
- Bottom metadata: Flex row with `justify-between`, stacks on mobile

## Empty, Loading & Error States

### Empty States
- **Content:** Centered message with icon
- **Background:** Light or semi-transparent overlay
- **Typography:** Large heading + supporting body text
- **CTA:** Optional action button directing to next step

### Loading States
- **Indicators:** Spinning icon or shimmer effect
- **Overlay:** Semi-transparent dark layer over content if full-page load
- **Text:** "Loading..." or "Processing..." with animated ellipsis
- **Color:** Use neon accent for loading indicator (animated pulsing)

### Error States
- **Color:** Red/destructive color (`#ef4444` or use --destructive token)
- **Icon:** Exclamation mark or error symbol
- **Message:** Clear error description in body text
- **Action:** Retry button with primary styling
- **Persistence:** Error message remains visible until resolved

## Accessibility & Contrast

### Color Contrast
- **Text on background:** Minimum 4.5:1 contrast ratio (WCAG AA)
- **Light text on dark:** White on `#121212` ✓
- **Dark text on light:** `#121212` on white ✓
- **Accent text:** Neon lime on dark ✓, ensure readability on light backgrounds
- **Avoid:** Low contrast text (e.g., `text-white/30` on light backgrounds)

### Interactive Elements
- **Focus indicators:** Visible outline for keyboard navigation
- **Semantic HTML:** Use `<button>` for actions, `<a>` for navigation
- **ARIA labels:** Add where needed for screen readers
- **Screen reader text:** Use `sr-only` class for hidden descriptive text

### Motion Preferences
- **Respect `prefers-reduced-motion`:** Disable animations for users who opt out
- **Provide alternatives:** Ensure static content is still readable without motion

## Microinteractions

### Click Feedback
- Buttons: Immediate scale-down to 0.98, then scale-back to 1 or up to 1.05
- Cards: Scale effect with shadow enhancement
- All transitions: 150-300ms for immediate feedback

### Smooth Transitions
- Color changes: `duration-300` minimum
- Opacity changes: 0.3-0.8s depending on prominence
- Position/transform: 0.4-0.8s with spring animation
- Enter animations: Stagger children for sequence effect

### Feedback Indicators
- **Success:** Green highlight or check icon with fade-in animation
- **Warning:** Yellow/orange background with icon
- **Error:** Red background with icon and shake animation (optional)
- **Info:** Blue or neutral color with icon

## Typography Edge Cases

### Narrow Viewports
- Headlines break naturally: Use `text-balance` to prevent orphans
- Emphasis words: Remain on same line when possible
- Monospace text: Reduce letter-spacing slightly on mobile

### Long Content
- Truncate with ellipsis: `truncate` class or `line-clamp-N`
- Break strategies: `break-words`, `break-all` for URLs/code
- Paragraph max-width: Approximately 65-75 characters for readability

## Animation Performance

### Best Practices
- Use GPU-accelerated properties: `transform`, `opacity`, `scale`, `rotate`
- Avoid animating: `width`, `height`, `top`, `left` (use transform instead)
- Limit simultaneous animations: Max 3-4 concurrent animations per component
- Use `will-change` sparingly for frequently animated elements
- Test on lower-end devices for smooth performance

---

## Summary: Quick Reference for Prompting

When generating similar pages, enforce:
1. **Color:** Neon lime accents (`#AFFF00`), charcoal text (`#121212`), white/dark backgrounds
2. **Typography:** Inter sans-serif (headlines + body), monospace for labels, tight headlines (0.9 line-height)
3. **Spacing:** 4px base unit, consistent 24px padding on containers, 64px+ between sections
4. **Buttons:** Lime green primary, charcoal text, full-width on mobile, `rounded-full`
5. **Layout:** Mobile-first single column → multi-column on md/lg, max-width container with mx-auto
6. **Animations:** Fade-up on scroll, spring stiffness 400/damping 17, hover scale 1.05
7. **Sections:** Hero full-height, light/dark alternating, blurred gradient overlays
8. **Responsive:** Hidden/shown based on breakpoints, stack on mobile, spread on desktop
9. **Interactivity:** Smooth spring transitions, glow effects on lime, focus states visible
10. **Consistency:** One border radius standard (8px), one spacing scale, unified motion language
