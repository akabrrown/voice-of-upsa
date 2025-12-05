# Voice of UPSA - CSS Documentation

## Overview

This directory contains all CSS files for the Voice of UPSA application. The CSS architecture is organized into modular files for maintainability and scalability.

## File Structure

```
styles/
├── globals.css          # Main global styles and Tailwind imports
├── index.css            # Main CSS import file
├── components/          # Component-specific styles
│   ├── Layout.css       # Layout, header, footer, navigation
│   ├── ArticleCard.css  # Article card components
│   ├── Buttons.css      # Button variants and states
│   ├── Forms.css        # Form inputs, labels, validation
│   └── Modal.css        # Modal dialogs and overlays
├── utilities/           # Utility classes and helpers
│   ├── Animations.css   # Keyframes and animation classes
│   ├── Typography.css   # Font sizes, weights, line heights
│   ├── Spacing.css      # Margin, padding, gap utilities
│   └── Responsive.css   # Breakpoint-specific styles
└── README.md           # This documentation
```

## CSS Architecture

### 1. Global Styles (`globals.css`)

- **Tailwind CSS**: Base directives and utilities
- **CSS Variables**: Theme colors and design tokens
- **Base Styles**: HTML, body, typography
- **Custom Utilities**: UPSA-specific classes

#### CSS Variables
```css
:root {
  --navy-blue: #001F3F;      /* Primary brand color */
  --golden-yellow: #FFD700;  /* Accent color */
  --bg-primary: #ffffff;      /* Main background */
  --bg-secondary: #f9fafb;   /* Secondary background */
  --text-primary: #111827;   /* Main text color */
  --text-secondary: #4b5563; /* Secondary text */
  --border-color: #e5e7eb;   /* Border colors */
}
```

### 2. Component Styles

Each component has its own CSS file with:

- **Component-specific styles**
- **Variants and states**
- **Responsive design**
- **Dark mode support**
- **Accessibility features**

#### Layout Component (`Layout.css`)
- Header and navigation
- Footer styling
- Sidebar layouts
- Responsive breakpoints

#### Article Card (`ArticleCard.css`)
- Card layouts (default, featured, compact, grid)
- Image handling and aspect ratios
- Hover effects and transitions
- Loading states

#### Buttons (`Buttons.css`)
- Variants: primary, secondary, tertiary, danger, success
- Sizes: sm, md, lg, xl
- States: hover, active, disabled, loading
- Icon buttons and groups

#### Forms (`Forms.css`)
- Input fields (text, email, password, textarea)
- Select dropdowns
- Checkboxes and radio buttons
- File uploads
- Validation states
- Helper text and error messages

#### Modal (`Modal.css`)
- Overlay and backdrop
- Modal positioning
- Size variants (sm, md, lg, xl, fullscreen)
- Animation transitions
- Loading states
- Accessibility features

### 3. Utility Classes

#### Animations (`Animations.css`)
- **Fade animations**: fadeIn, fadeOut, fadeInUp, fadeOutDown
- **Slide animations**: slideIn, slideOut (all directions)
- **Scale animations**: scaleIn, scaleOut, pulse, bounce
- **Loading states**: spinners, shimmer effects
- **Hover animations**: lift, scale, rotate
- **Stagger animations**: sequential reveal effects

#### Typography (`Typography.css`)
- **Font families**: serif, sans-serif, mono
- **Font sizes**: xs (0.75rem) to 9xl (8rem)
- **Font weights**: thin (100) to black (900)
- **Line heights**: none (1) to loose (2)
- **Letter spacing**: tighter (-0.05em) to widest (0.1em)
- **Text alignment**: left, center, right, justify
- **Text transform**: uppercase, lowercase, capitalize
- **Text decoration**: underline, line-through, none
- **Text colors**: Brand colors, grays, semantic colors
- **Text overflow**: truncate, ellipsis, clip
- **Line clamp**: Multi-line truncation (1-6 lines)
- **Responsive typography**: Breakpoint-specific sizes

#### Spacing (`Spacing.css`)
- **Margin**: m-0 to m-96, directional variants
- **Padding**: p-0 to p-96, directional variants
- **Gap**: gap-0 to gap-96, directional variants
- **Space between**: space-y, space-x utilities
- **Negative margins**: -m-0 to -m-96
- **Auto margins**: m-auto, mx-auto, my-auto
- **Responsive spacing**: Breakpoint-specific variants

#### Responsive (`Responsive.css`)
- **Display utilities**: block, inline, flex, grid, hidden
- **Container**: Responsive container classes
- **Grid system**: Responsive grid columns
- **Flexbox**: Responsive flex direction, wrap, justify, align
- **Width/Height**: Responsive sizing
- **Fractional widths**: 1/2, 1/3, 2/3, 1/4, 3/4, etc.
- **Print utilities**: Print-specific styles
- **Orientation**: Portrait/landscape utilities
- **Touch/Pointer**: Device-specific utilities
- **Motion**: Reduced motion support
- **Dark mode**: Color scheme utilities

## Usage Guidelines

### 1. Import Structure

All CSS is imported through `globals.css`:

```css
@import './index.css';
```

The `index.css` file imports all modules:

```css
@import './globals.css';
@import './components/Layout.css';
@import './components/ArticleCard.css';
@import './components/Buttons.css';
@import './components/Forms.css';
@import './components/Modal.css';
@import './utilities/Animations.css';
@import './utilities/Typography.css';
@import './utilities/Spacing.css';
@import './utilities/Responsive.css';
```

### 2. Class Naming Conventions

- **Components**: Use BEM methodology (Block__Element--Modifier)
- **Utilities**: Use kebab-case for consistency
- **States**: Use prefixes like `is-`, `has-`, `loading-`
- **Responsive**: Use breakpoint prefixes (`sm:`, `md:`, `lg:`, `xl:`)

### 3. Component Classes

#### Article Card
```html
<div class="article-card featured">
  <div class="article-image-container">
    <img class="article-image" src="..." alt="...">
    <span class="article-badge trending">Trending</span>
  </div>
  <div class="article-content">
    <h3 class="article-title">Article Title</h3>
    <p class="article-excerpt">Article excerpt...</p>
    <div class="article-meta">
      <span class="article-author">Author Name</span>
      <span class="article-stats">5 min read</span>
    </div>
  </div>
</div>
```

#### Buttons
```html
<button class="btn btn-primary btn-lg btn-loading">
  Primary Button
</button>

<button class="btn btn-secondary btn-icon">
  <Icon />
</button>

<div class="btn-group">
  <button class="btn btn-tertiary">Cancel</button>
  <button class="btn btn-primary">Submit</button>
</div>
```

#### Forms
```html
<div class="form-container">
  <div class="form-group">
    <label class="form-label required">Email</label>
    <input class="form-input form-input-lg" type="email" placeholder="Enter your email">
    <span class="form-error">Please enter a valid email</span>
  </div>
</div>
```

#### Modal
```html
<div class="modal-overlay active">
  <div class="modal modal-lg">
    <div class="modal-header">
      <h2 class="modal-title">Modal Title</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      Modal content...
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### 4. Utility Classes

#### Animations
```html
<div class="animate-fadeInUp">Fade in from bottom</div>
<div class="animate-pulse">Pulsing element</div>
<div class="loading-spinner">Loading...</div>
<div class="shimmer">Shimmer loading effect</div>
```

#### Typography
```html
<h1 class="heading-1 text-navy">Main Heading</h1>
<p class="body-base text-secondary">Body text</p>
<span class="text-sm text-golden">Small accent text</span>
<div class="line-clamp-3">Truncated text...</div>
```

#### Spacing
```html
<div class="p-4 m-2">Padding and margin</div>
<div class="space-y-4">Vertical spacing between children</div>
<div class="gap-4">Grid/flex gap</div>
```

#### Responsive
```html
<div class="hidden md:block lg:flex">Responsive display</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">Responsive grid</div>
<div class="w-full md:w-1/2 lg:w-1/3">Responsive width</div>
```

## Customization

### 1. Adding New Components

1. Create a new CSS file in `styles/components/`
2. Follow the existing component structure
3. Add the import to `styles/index.css`
4. Document the component in this README

### 2. Adding New Utilities

1. Create a new CSS file in `styles/utilities/`
2. Follow the existing utility structure
3. Add the import to `styles/index.css`
4. Update this documentation

### 3. Theme Customization

Modify CSS variables in `globals.css`:

```css
:root {
  --navy-blue: #your-color;
  --golden-yellow: #your-accent;
  /* Add more variables as needed */
}
```

### 4. Breakpoint Customization

Responsive breakpoints are defined in `utilities/Responsive.css`:

```css
/* Default breakpoints */
sm: 640px   /* Small screens */
md: 768px   /* Medium screens */
lg: 1024px  /* Large screens */
xl: 1280px  /* Extra large screens */
xxl: 1536px /* 2X large screens */
```

## Best Practices

### 1. Performance
- Use utility classes for rapid development
- Component styles for complex UI elements
- Minimize CSS duplication
- Use CSS variables for theming
- Optimize for critical path rendering

### 2. Accessibility
- Include focus states for interactive elements
- Use semantic HTML with appropriate CSS
- Support reduced motion preferences
- Ensure sufficient color contrast
- Provide visual indicators for states

### 3. Maintainability
- Follow consistent naming conventions
- Document complex components
- Use modular CSS architecture
- Keep CSS files focused and small
- Regular refactoring and cleanup

### 4. Responsive Design
- Mobile-first approach
- Use consistent breakpoints
- Test across all screen sizes
- Consider touch interactions
- Optimize for performance

## Troubleshooting

### Common Issues

1. **CSS Not Loading**: Check import paths in `index.css`
2. **Styles Not Applying**: Verify class names and CSS specificity
3. **Responsive Issues**: Check breakpoint usage and media queries
4. **Animation Problems**: Ensure proper class names and CSS properties
5. **Dark Mode Issues**: Verify CSS variables and theme classes

### Debug Tools

- **Browser DevTools**: Inspect elements and computed styles
- **CSS Validation**: Use CSS validators to check syntax
- **Performance Audit**: Check CSS loading and rendering performance
- **Accessibility Audit**: Test with screen readers and accessibility tools

## Migration Guide

### From Tailwind Only

1. **Keep Tailwind**: Continue using Tailwind utilities
2. **Add Components**: Use component CSS for complex UI
3. **Custom Utilities**: Add custom utilities as needed
4. **Gradual Migration**: Migrate components incrementally

### From Plain CSS

1. **Modularize**: Split CSS into component and utility files
2. **Add Variables**: Use CSS variables for theming
3. **Responsive**: Add responsive utilities
4. **Documentation**: Document components and utilities

## Future Enhancements

### Planned Features

1. **CSS-in-JS Integration**: Consider styled-components or emotion
2. **CSS Modules**: Implement CSS modules for better scoping
3. **Critical CSS**: Extract critical CSS for performance
4. **CSS Optimization**: Minification and compression
5. **Theme System**: Advanced theming capabilities

### Contributing

When adding new CSS:

1. Follow existing patterns and conventions
2. Test across browsers and devices
3. Update documentation
4. Consider performance impact
5. Ensure accessibility compliance

---

## Quick Reference

### Common Classes

| Purpose | Classes |
|---------|---------|
| Layout | `.container`, `.flex`, `.grid` |
| Spacing | `.p-4`, `.m-2`, `.gap-3` |
| Typography | `.text-lg`, `.font-bold`, `.text-navy` |
| Colors | `.bg-navy`, `.text-golden`, `.border-gray` |
| Animations | `.animate-fadeIn`, `.hover-lift` |
| Responsive | `.sm:block`, `.md:flex`, `.lg:grid` |

### Component Quick Start

```html
<!-- Article Card -->
<div class="article-card">
  <img class="article-image" src="...">
  <h3 class="article-title">Title</h3>
  <p class="article-excerpt">Excerpt</p>
</div>

<!-- Button -->
<button class="btn btn-primary">Click me</button>

<!-- Form -->
<input class="form-input" type="text" placeholder="Enter text">

<!-- Modal -->
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">Header</div>
    <div class="modal-body">Content</div>
  </div>
</div>
```

This CSS architecture provides a solid foundation for the Voice of UPSA application with scalability, maintainability, and performance in mind.
