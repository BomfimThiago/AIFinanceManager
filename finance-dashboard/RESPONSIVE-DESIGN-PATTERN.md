# Responsive Design Pattern

This document defines the responsive design pattern used throughout the Konta Finance Dashboard project. This pattern ensures consistent, mobile-first responsive design across all pages.

## 🎯 Design Philosophy

- **Mobile-First**: Start with mobile styles, then enhance for larger screens
- **Progressive Enhancement**: Add features as screen space allows
- **Content Priority**: Most important content visible on smallest screens
- **Consistent Breakpoints**: Use consistent Tailwind CSS breakpoints throughout

## 📱 Breakpoint Strategy

```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small tablets and large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

## 🏗️ Page Structure Pattern

### 1. Layout Structure (App Level)
```jsx
<div className="min-h-screen bg-gray-50">
  <Header />
  <Navigation />
  
  {/* Responsive layout without fixed heights */}
  <div className="flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 min-h-0 lg:overflow-y-auto">
      {/* Layout provides consistent padding with optimized spacing for 1000px breakpoint */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Page content renders here */}
      </div>
    </main>
  </div>
</div>
```

### 2. Page Structure (Page Level)
```jsx
{/* 
  CRITICAL: Pages should NOT add their own padding - layout provides it
  Use the same simple header pattern as Expenses page to avoid mobile spacing issues
*/}
<div className="space-y-6">
  {/* Page Header - Simple pattern like Expenses page */}
  <div className="flex justify-between items-start">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Page Title
      </h1>
      <p className="text-gray-600 mt-1">
        Page subtitle/description
      </p>
    </div>
    <div className="flex space-x-2">
      {/* Action buttons */}
    </div>
  </div>
  
  {/* Page content sections */}
  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
    {/* Content */}
  </div>
</div>
```

### 🎯 Alignment Rules

**CRITICAL ALIGNMENT PRINCIPLES:**
1. **Logo, First Tab, Page Title** must be vertically aligned
2. **Layout provides all horizontal padding** (`px-4 sm:px-6 lg:px-8`)
3. **Layout provides optimized vertical spacing** (`py-4 sm:py-6 lg:py-8`)
   - Mobile (0-640px): 16px top/bottom
   - Tablet (640px-1024px): 24px top/bottom  
   - Desktop (1024px+): 32px top/bottom
4. **Pages use minimal responsive spacing** (`space-y-6` only)
5. **Title positioning** must be consistent - avoid responsive typography scaling
6. **Distance from tabs to page title** optimized for problematic 1000px breakpoint
7. **No excessive spacing** that pushes content too far from navigation tabs

### 3. Header Component
```jsx
<header className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-14 sm:h-16">
      <Logo size="sm" className="sm:size-md" />
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile-friendly controls */}
        <div className="hidden sm:flex items-center space-x-4">
          {/* Desktop-only controls */}
        </div>
      </div>
    </div>
  </div>
</header>
```

### 4. Navigation Component
```jsx
<nav className="bg-white border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Mobile: Horizontal scroll */}
    <div className="flex overflow-x-auto scrollbar-hide space-x-2 sm:space-x-6 lg:space-x-8 -mx-4 px-4 sm:mx-0 sm:px-0">
      {tabs.map(tab => (
        <button className="flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Full Text</span>
          <span className="sm:hidden text-xs">Short</span>
        </button>
      ))}
    </div>
  </div>
</nav>
```

### 5. Page Header
```jsx
<div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
  <div className="flex-1">
    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
      {/* Responsive typography */}
    </h2>
    <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 max-w-2xl">
      {/* Responsive subtitle with max-width constraint */}
    </p>
  </div>
  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 shrink-0">
    {/* Responsive action buttons */}
  </div>
</div>
```

### 3. Action Buttons
```jsx
<button className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start space-x-2 text-sm sm:text-base">
  <Icon className="h-4 w-4" />
  <span className="hidden sm:inline">Full Text</span>
  <span className="sm:hidden">Short</span>
</button>
```

### 4. Content Cards
```jsx
<div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
    {/* Flexible card content */}
  </h3>
</div>
```

### 5. Grid Layouts
```jsx
{/* 2-column grid that stacks on mobile */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

{/* 3-column grid with flexible breakpoints */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

{/* Integration cards - responsive grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
</div>
```

## 📊 Component Patterns

### Tables (Mobile-Friendly)
```jsx
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <table className="min-w-full divide-y divide-gray-200">
    <thead>
      <tr>
        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Always Visible
        </th>
        <th className="hidden sm:table-cell px-6 py-3">
          Hidden on Mobile
        </th>
        <th className="hidden lg:table-cell px-6 py-3">
          Hidden Until Large
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="px-3 sm:px-6 py-4">
          <div className="sm:hidden">
            {/* Stacked mobile layout */}
            <div className="font-medium">Primary Info</div>
            <div className="text-xs text-gray-500 mt-1">Secondary Info</div>
          </div>
          <div className="hidden sm:block">Desktop Layout</div>
        </td>
        <td className="hidden sm:table-cell px-6 py-4">
          Desktop Only Column
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Loading States
```jsx
{loading && (
  <div className="flex justify-center py-8 sm:py-12">
    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
  </div>
)}
```

### Error States
```jsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
    <p className="text-red-800 text-xs sm:text-sm">{error}</p>
  </div>
)}
```

### Collapsible Sections
```jsx
<div className="bg-green-50 p-4 sm:p-6 rounded-xl border border-green-200">
  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
    <div className="flex items-center space-x-2">
      <h3 className="text-base sm:text-lg font-semibold text-green-900">Title</h3>
      <button className="p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100 transition-colors">
        <Info className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>
    </div>
    <button className="text-green-600 hover:text-green-800 transition-colors flex items-center justify-center sm:justify-start space-x-1 text-sm sm:text-base">
      <span>{showInfo ? 'Hide' : 'Show Details'}</span>
      {showInfo ? <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />}
    </button>
  </div>
</div>
```

## 🎨 Typography Scale

```jsx
/* Headings */
h1: "text-2xl sm:text-3xl lg:text-4xl font-bold"
h2: "text-xl sm:text-2xl lg:text-3xl font-bold"
h3: "text-base sm:text-lg font-semibold"
h4: "text-sm sm:text-base font-medium"

/* Body Text */
body: "text-sm sm:text-base"
small: "text-xs sm:text-sm"

/* Buttons */
button: "text-sm sm:text-base"
button-small: "text-xs sm:text-sm"
```

## 🔲 Spacing Scale

```jsx
/* Padding */
card-padding: "p-4 sm:p-6"
section-padding: "px-4 sm:px-6 lg:px-8"
vertical-padding: "py-6 sm:py-8 lg:py-12"

/* Margins and Gaps */
section-spacing: "space-y-6 sm:space-y-8"
card-spacing: "gap-4 sm:gap-6"
small-spacing: "space-y-3 sm:space-y-4"

/* Element Sizes */
icon-small: "h-3 w-3 sm:h-4 sm:w-4"
icon-medium: "h-4 w-4 sm:h-5 sm:w-5"
spinner: "h-6 w-6 sm:h-8 sm:w-8"
```

## 🎯 Content Strategy

### Progressive Disclosure
- **Mobile**: Show essential information only
- **Tablet**: Add secondary information
- **Desktop**: Show full details and additional context

### Text Content
- **Mobile**: Use shorter labels ("Consents" vs "Manage Consents")
- **Desktop**: Use full descriptive text
- **Implementation**: Use conditional rendering with `hidden sm:inline` and `sm:hidden`

### Navigation
- **Mobile**: Stack vertically, prioritize important actions
- **Desktop**: Horizontal layout with full labels

## 🚀 Implementation Checklist

When implementing a new page, ensure:

- [ ] Main container uses the standard responsive wrapper
- [ ] Page header follows the responsive header pattern
- [ ] Content sections use consistent card styling
- [ ] Tables implement mobile-friendly patterns
- [ ] Buttons adapt to screen size (full-width on mobile)
- [ ] Typography scales appropriately
- [ ] Spacing uses consistent responsive values
- [ ] Loading and error states are responsive
- [ ] Touch targets are at least 44px on mobile
- [ ] Content is readable at all breakpoints
- [ ] Interactive elements work well on touch devices

## 📝 Usage Example

See the `Integrations.tsx` component for a complete implementation of this pattern.

## 🎨 Custom CSS Utilities

### Scrollbar Hide
```css
/* Hide scrollbar but allow scrolling */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

## 🛠️ Tools and Resources

- **Tailwind CSS**: Used for all responsive utilities
- **Chrome DevTools**: Test responsive breakpoints
- **Responsive Design Mode**: Test various screen sizes
- **Accessibility**: Ensure touch targets meet minimum size requirements

---

**Note**: This pattern should be used consistently across all pages in the Konta Finance Dashboard to ensure a cohesive user experience across all device types.