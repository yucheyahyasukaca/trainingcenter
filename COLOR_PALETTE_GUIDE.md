# 🎨 Color Palette Guide - GARUDA-21

## Primary Color: Red

Aplikasi GARUDA-21 Training Center menggunakan **Red Color Palette** yang mewakili logo GARUDA-21.

---

## 🔴 Color Palette

### Primary Colors (Red)

```css
primary-50:  #fef2f2  /* Lightest - backgrounds */
primary-100: #fee2e2  /* Very light - hover states */
primary-200: #fecaca  /* Light - borders */
primary-300: #fca5a5  /* Light accent */
primary-400: #f87171  /* Medium light */
primary-500: #ef4444  /* Base red */
primary-600: #dc2626  /* Primary brand color */
primary-700: #b91c1c  /* Dark - hover states */
primary-800: #991b1b  /* Darker */
primary-900: #7f1d1d  /* Darkest */
```

---

## 📍 Usage Guide

### Main Brand Color
**`primary-600: #dc2626`** - This is the main GARUDA-21 brand color

Use for:
- ✅ Logos
- ✅ Primary buttons
- ✅ Icons
- ✅ Links
- ✅ Active states

### Backgrounds

**Light backgrounds:**
- `primary-50` - Very subtle backgrounds
- `primary-100` - Soft hover states
- `bg-gradient-to-br from-primary-50 via-white to-red-50` - Hero sections

**Dark backgrounds:**
- `primary-600 to red-700` - CTA sections
- `primary-700` - Button hover states

### Text Colors

- `text-primary-600` - Primary text/links
- `text-primary-700` - Emphasized text
- `text-primary-500` - Lighter text

### Borders

- `border-primary-200` - Light borders
- `border-primary-600` - Emphasized borders

---

## 🎯 Component Usage

### Buttons

```tsx
// Primary button
className="bg-primary-600 hover:bg-primary-700 text-white"

// Secondary button
className="bg-gray-200 hover:bg-gray-300 text-gray-800"

// Danger button (already red)
className="bg-red-600 hover:bg-red-700 text-white"
```

### Cards

```tsx
// Card with primary border
className="border-2 border-primary-100 hover:border-primary-200"

// Card with primary background
className="bg-primary-50"
```

### Badges

```tsx
// Success badge (keep green)
className="bg-green-100 text-green-800"

// Warning badge (keep yellow)
className="bg-yellow-100 text-yellow-800"

// Info badge (change to red)
className="bg-primary-100 text-primary-800"
```

### Icons

```tsx
// Primary icon
className="text-primary-600"

// Light background icon
className="bg-primary-100 text-primary-600"
```

---

## 🌈 Supporting Colors

Keep these colors as-is for semantic meaning:

### Success (Green)
```css
green-500: #10b981
green-600: #059669
```

### Warning (Yellow/Orange)
```css
yellow-500: #f59e0b
orange-500: #f97316
```

### Danger/Error (Red) - Same as Primary
```css
red-600: #dc2626  /* Same as primary-600 */
```

### Info (Blue) - For charts/stats
```css
blue-500: #3b82f6
blue-600: #2563eb
```

### Neutral (Gray)
```css
gray-50 to gray-900  /* Keep default Tailwind grays */
```

---

## 📊 Gradient Combinations

### Hero Section
```tsx
bg-gradient-to-br from-primary-50 via-white to-red-50
```

### CTA Section
```tsx
bg-gradient-to-br from-primary-600 to-red-700
```

### Cards
```tsx
bg-gradient-to-br from-primary-50 to-red-50
```

---

## 🎨 Where Colors Are Used

### Landing Page
- ✅ Navbar logo background: `primary-600`
- ✅ Hero gradient: `from-primary-50 to-red-50`
- ✅ Primary buttons: `primary-600`
- ✅ Feature icons: Various colors (keep diverse)
- ✅ CTA section: `from-primary-600 to-red-700`

### Login/Register
- ✅ Background gradient: `from-primary-50 to-red-50`
- ✅ Logo background: `primary-600`
- ✅ Primary button: `primary-600`

### Dashboard
- ✅ Sidebar logo: `primary-600`
- ✅ Active menu item: `primary-50` background, `primary-700` text
- ✅ Stats cards: Keep diverse colors (blue, green, purple, orange)

### Components
- ✅ Sidebar branding: `primary-600`
- ✅ Header user dropdown: `primary` colors
- ✅ Form inputs focus: `ring-primary-500`

---

## 🔄 Migration Summary

### Changed:
```
primary-blue → primary-red
blue-50 → red-50 (gradients)
blue-700 → red-700 (gradients)
```

### Kept:
- Green for success states
- Yellow/Orange for warnings
- Blue for charts/info
- Gray for neutrals
- Purple, indigo for feature variety

---

## ✅ Current Implementation

### Files Updated:
1. ✅ `tailwind.config.js` - Primary color palette changed to red
2. ✅ `app/page.tsx` - Gradients updated to red
3. ✅ `app/login/page.tsx` - Background gradient to red
4. ✅ `app/register/page.tsx` - Background gradient to red

### Automatic Changes:
All components using `primary-*` classes will automatically use red:
- Buttons with `bg-primary-600`
- Text with `text-primary-600`
- Borders with `border-primary-600`
- Backgrounds with `bg-primary-50`
- Icons in primary color containers

---

## 🎨 Design Tips

### Do's ✅
- Use `primary-600` as the main brand color
- Use lighter shades (`50-200`) for backgrounds
- Use darker shades (`700-900`) for text and hover states
- Keep semantic colors (green=success, yellow=warning)
- Use variety in feature cards (not all red)

### Don'ts ❌
- Don't make everything red (overwhelming)
- Don't use red for success messages (use green)
- Don't remove color variety from charts
- Don't use dark red on dark backgrounds (poor contrast)

---

## 🎯 Brand Colors

**Primary Brand:** Red (`#dc2626`)  
**Supporting:** Gray scale for balance  
**Accents:** Keep diverse (blue, green, purple, orange) for different features

---

## 🚀 Testing

After color change, verify:
- [ ] Logo background is red
- [ ] Primary buttons are red
- [ ] Gradients show red tones
- [ ] Links are red
- [ ] Active states use red
- [ ] Focus rings are red
- [ ] Success messages still green
- [ ] Warning badges still yellow
- [ ] Charts keep variety

---

**Color palette successfully updated to RED for GARUDA-21! 🔴🦅**

