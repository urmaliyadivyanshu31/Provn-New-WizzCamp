# PROVN Platform UI/UX Design Guide

## 🎨 **Brand Identity & Design Philosophy**

**PROVN** represents the next generation of decentralized content creation and IP ownership. Our design system emphasizes **professionalism, innovation, and creator empowerment** through a sophisticated dark-first interface with premium orange accents.

### **Core Design Principles**
1. **Creator-Centric**: Every interface prioritizes creator workflow and revenue visibility
2. **Professional Elegance**: Clean, sophisticated aesthetics that instill trust
3. **Innovation-Forward**: Modern Web3 interfaces with seamless UX
4. **Accessibility-First**: Inclusive design for all users
5. **Performance-Optimized**: Smooth animations and responsive interactions

---

## 🎯 **Color System**

### **Primary Palette**
```css
/* Core Brand Colors */
--provn-accent: #ff6d01        /* Primary orange - CTAs, highlights */
--provn-accent-press: #e56100  /* Pressed state - hover effects */
--provn-accent-subtle: rgba(255, 109, 1, 0.14) /* Subtle backgrounds */

/* Dark Mode Foundation */
--provn-bg: #1a1a1a           /* Main background */
--provn-surface: #222222      /* Card/modal backgrounds */
--provn-surface-2: #2a2a2a    /* Secondary surfaces, inputs */

/* Text Hierarchy */
--provn-text: #f5f5f5         /* Primary text */
--provn-muted: #b3b3b3        /* Secondary text, labels */
--provn-border: #2a2a2a       /* Borders, dividers */
```

### **Semantic Colors**
```css
--provn-success: #27c27a      /* Success states, confirmations */
--provn-warning: #f5a524      /* Warnings, pending states */
--provn-error: #ff4d4f        /* Errors, destructive actions */
```

### **Usage Guidelines**
- **Primary Orange (#ff6d01)**: CTAs, purchase buttons, active states, PROVN token displays
- **Dark Surfaces**: Create depth hierarchy with subtle variations
- **Text Colors**: Maintain WCAG AA contrast ratios (4.5:1 minimum)
- **Semantic Colors**: Only for status communication, never decorative

---

## 📝 **Typography**

### **Font Hierarchy**
```css
/* Headlines & UI Elements */
font-family: 'Space Grotesk', sans-serif;
font-weight: 500-700;

/* Body Text & Content */
font-family: 'Inter', system-ui, sans-serif;
font-weight: 400-600;
```

### **Type Scale**
- **Display (48px+)**: Landing page heroes, major announcements
- **H1 (32-40px)**: Page titles, modal headers
- **H2 (24-28px)**: Section headers, card titles
- **H3 (20-24px)**: Subsection headers
- **Body (16px)**: Default text size, optimal readability
- **Caption (14px)**: Labels, metadata, secondary info
- **Small (12px)**: Minimal supporting text only

### **Implementation**
```css
.font-headline { font-family: var(--font-headline); font-weight: 500; }
.font-body { font-family: var(--font-inter); font-weight: 400; }
```

---

## 🎛️ **Component System**

### **Buttons**
```typescript
// Primary Button - Main CTAs
<ProvnButton variant="primary" size="md">
  Purchase License
</ProvnButton>

// Secondary Button - Secondary actions
<ProvnButton variant="secondary" size="md">
  Cancel
</ProvnButton>
```

**Button States:**
- **Default**: Orange background, white text
- **Hover**: Darker orange (#e56100)
- **Pressed**: Scale down (0.95x) with active background
- **Disabled**: 50% opacity, no interactions
- **Focus**: Orange ring with 2px offset

### **Cards & Surfaces**
```css
/* Standard Card */
.card-base {
  background: var(--provn-surface);
  border: 1px solid var(--provn-border);
  border-radius: 12px;
  padding: 24px;
}

/* Interactive Card (hover states) */
.card-interactive:hover {
  background: var(--provn-surface-2);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
```

### **Forms & Inputs**
```css
/* Input Styling */
input, textarea, select {
  background: var(--provn-surface-2);
  border: 1px solid var(--provn-border);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--provn-text);
  font-family: var(--font-inter);
}

input:focus {
  border-color: var(--provn-accent);
  box-shadow: 0 0 0 2px var(--provn-accent-subtle);
  outline: none;
}
```

### **Modals & Overlays**
```css
/* Modal Background */
.modal-overlay {
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
}

/* Modal Content */
.modal-content {
  background: var(--provn-surface);
  border: 1px solid var(--provn-border);
  border-radius: 16px;
  box-shadow: 0 20px 64px rgba(0,0,0,0.4);
  max-width: 90vw;
  max-height: 90vh;
}
```

---

## 🎬 **Animation & Motion**

### **Timing Functions**
```css
/* Standard Easing */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Button Transitions */
transition: all 0.15s ease-out;

/* Card Hover Transitions */
transition: all 0.3s var(--ease-out);

/* Modal Entrance */
transition: all 0.4s var(--ease-out);
```

### **Micro-Interactions**
- **Button Press**: Scale down to 95% on active state
- **Card Hover**: Lift 2px with shadow increase
- **Input Focus**: Border color change + subtle glow
- **Loading States**: Skeleton screens with shimmer effect

### **Page Transitions**
```css
/* Fade In Animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Staggered Animations */
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }
```

---

## 📐 **Layout & Spacing**

### **Spacing Scale**
```css
/* Base: 4px increment system */
--space-1: 4px;   /* Tight spacing */
--space-2: 8px;   /* Small gaps */
--space-3: 12px;  /* Default inline spacing */
--space-4: 16px;  /* Standard spacing */
--space-6: 24px;  /* Section spacing */
--space-8: 32px;  /* Large spacing */
--space-12: 48px; /* Section breaks */
--space-16: 64px; /* Page sections */
```

### **Grid System**
- **Container Max Width**: 1200px
- **Gutter**: 24px on desktop, 16px on mobile
- **Breakpoints**: 
  - Mobile: 768px and below
  - Tablet: 769px - 1024px  
  - Desktop: 1025px and above

### **Component Spacing**
- **Card Padding**: 24px (desktop), 16px (mobile)
- **Button Padding**: 12px horizontal, 8px vertical
- **Form Field Spacing**: 16px between fields
- **Section Spacing**: 48px between major sections

---

## 📱 **Responsive Design**

### **Mobile-First Approach**
```css
/* Base (Mobile) */
.hero-title { font-size: 24px; }
.card { padding: 16px; }

/* Tablet */
@media (min-width: 769px) {
  .hero-title { font-size: 32px; }
  .card { padding: 20px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .hero-title { font-size: 40px; }
  .card { padding: 24px; }
}
```

### **Touch Targets**
- **Minimum Size**: 44px x 44px (iOS standard)
- **Button Padding**: Adequate spacing for finger taps
- **Interactive Elements**: Clear visual feedback on touch

---

## 🎨 **Brand-Specific UI Patterns**

### **PROVN Token Display**
```typescript
// Consistent token formatting
const formatPROVN = (amount: number) => {
  return `${amount.toFixed(amount < 1 ? 2 : 1)} PROVN`;
}

// Token amount styling
<span className="font-headline font-bold text-provn-accent">
  {formatPROVN(price)}
</span>
```

### **License Status Indicators**
```css
/* Active License */
.license-active {
  color: var(--provn-success);
  background: rgba(39, 194, 122, 0.1);
  border: 1px solid rgba(39, 194, 122, 0.2);
}

/* Expired License */
.license-expired {
  color: var(--provn-error);
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.2);
}
```

### **Creator Revenue Visualization**
- **Revenue Cards**: Gradient backgrounds with PROVN accent
- **Charts**: Orange primary color with dark background
- **Progress Bars**: Orange fill on dark track

---

## 🔧 **Implementation Guidelines**

### **CSS Custom Properties**
Always use CSS variables for consistency:
```css
/* ✅ Correct */
background: var(--provn-accent);
color: var(--provn-text);

/* ❌ Avoid */
background: #ff6d01;
color: #f5f5f5;
```

### **Tailwind Classes**
Prefer semantic classes over arbitrary values:
```typescript
// ✅ Semantic
className="bg-provn-surface text-provn-text border-provn-border"

// ❌ Arbitrary
className="bg-[#222222] text-[#f5f5f5] border-[#2a2a2a]"
```

### **Component Structure**
```typescript
interface ComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Always include className prop for extensibility
<Component 
  variant="primary"
  size="md" 
  className="custom-styles"
/>
```

---

## 🎯 **Key UI Patterns**

### **Licensing Modal Flow**
1. **Header**: Clear title + close button
2. **Content Info**: Video title, creator, token ID
3. **License Terms**: Price, duration, permissions
4. **Purchase Flow**: PROVN approval → License purchase
5. **Success State**: Transaction hash + confirmation

### **Dashboard Cards**
- **Revenue Overview**: Total earnings in PROVN
- **Active Licenses**: List with status indicators  
- **Recent Activity**: Timeline of licensing events
- **Creator Stats**: Views, licenses sold, royalties earned

### **Video Player Integration**
- **License Button**: Prominent orange CTA
- **Status Overlay**: Current license status
- **Creator Info**: Handle, earnings display
- **Social Actions**: Like, share, license

---

## ♿ **Accessibility Standards**

### **Color Contrast**
- **Text**: Minimum 4.5:1 ratio against background
- **Interactive Elements**: Minimum 3:1 ratio
- **Focus States**: High contrast orange ring

### **Keyboard Navigation**
- **Tab Order**: Logical flow through interactive elements
- **Focus Indicators**: Visible orange ring on focus
- **Keyboard Shortcuts**: Standard web conventions

### **Screen Readers**
```typescript
// Proper labeling
<button aria-label="Purchase license for 0.5 PROVN tokens">
  Buy License
</button>

// Status announcements
<div role="status" aria-live="polite">
  License purchased successfully
</div>
```

---

## 🚀 **Performance Guidelines**

### **Animation Performance**
```css
/* GPU Acceleration */
.animated-element {
  transform: translateZ(0);
  will-change: transform;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### **Image Optimization**
- **Format**: WebP with fallbacks
- **Lazy Loading**: Implement for video thumbnails
- **Responsive Images**: Multiple sizes for different viewports

---

## 📋 **Quality Checklist**

### **Before Shipping**
- [ ] All colors use CSS variables
- [ ] Components work on mobile, tablet, desktop
- [ ] Focus states are visible and accessible
- [ ] Loading states are handled gracefully
- [ ] Error states provide clear feedback
- [ ] PROVN token amounts are consistently formatted
- [ ] Animations respect user preferences
- [ ] Text maintains proper contrast ratios

### **Brand Consistency**
- [ ] Orange accent used only for primary actions
- [ ] Space Grotesk font for headlines
- [ ] Inter font for body text
- [ ] Dark surfaces create proper hierarchy
- [ ] Hover states provide clear feedback

---

## 💡 **Design Philosophy Summary**

**PROVN's interface should feel like a premium creative tool that happens to be built on blockchain technology.** Users should experience the power of decentralized IP ownership through familiar, polished interactions that prioritize their creative and financial success.

The design system emphasizes **trust, professionalism, and empowerment** - exactly what creators need when making decisions about their intellectual property and earnings.

---

*This design guide ensures consistent, accessible, and brand-aligned experiences across the entire PROVN platform. All components and patterns should reflect the platform's mission to empower creators through innovative IP-NFT technology.*