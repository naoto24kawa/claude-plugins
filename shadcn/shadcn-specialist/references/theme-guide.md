# shadcn/ui Theme and Styling Guide

Complete guide for theming and customizing shadcn/ui components.

## Theme Architecture

shadcn/ui uses CSS variables for theming, enabling easy customization and dark mode support.

### Color System

Colors are defined using HSL (Hue, Saturation, Lightness) format in CSS variables.

**Why HSL?**
- Easy color manipulation
- Better for generating color scales
- Intuitive color adjustments (just change saturation or lightness)

## CSS Variables Structure

### globals.css Setup

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### Semantic Color Tokens

| Token | Purpose | Usage |
|-------|---------|-------|
| `background` | Default page background | Main app background |
| `foreground` | Default text color | Body text |
| `card` | Card backgrounds | Card, Sheet, Dialog |
| `card-foreground` | Card text | Text on cards |
| `popover` | Popover backgrounds | Popover, Dropdown, Tooltip |
| `popover-foreground` | Popover text | Text in popovers |
| `primary` | Primary brand color | Primary buttons, links |
| `primary-foreground` | Primary text | Text on primary elements |
| `secondary` | Secondary color | Secondary buttons |
| `secondary-foreground` | Secondary text | Text on secondary elements |
| `muted` | Muted backgrounds | Disabled states, subtle backgrounds |
| `muted-foreground` | Muted text | Helper text, placeholders |
| `accent` | Accent color | Hover states, highlights |
| `accent-foreground` | Accent text | Text on accent elements |
| `destructive` | Error/danger color | Delete buttons, error messages |
| `destructive-foreground` | Destructive text | Text on destructive elements |
| `border` | Border color | Component borders |
| `input` | Input border | Form input borders |
| `ring` | Focus ring | Focus indicators |

## Tailwind Configuration

### tailwind.config.js

```js
const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## Dark Mode Implementation

### Next.js App Router

```tsx
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Theme Switcher Component

```tsx
// components/theme-switcher.tsx
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## Custom Color Schemes

### Creating a Custom Theme

**Step 1: Choose your primary color**

Use an HSL color picker to find your desired color.

Example: Purple theme
- Hue: 270
- Saturation: 70%
- Lightness: 50%
- Result: `270 70% 50%`

**Step 2: Update CSS variables**

```css
:root {
  --primary: 270 70% 50%;
  --primary-foreground: 0 0% 100%;
}

.dark {
  --primary: 270 70% 60%;
  --primary-foreground: 0 0% 100%;
}
```

**Step 3: Generate complementary colors**

For a cohesive theme, adjust other colors accordingly:

```css
:root {
  /* Purple theme */
  --primary: 270 70% 50%;
  --primary-foreground: 0 0% 100%;

  --secondary: 270 30% 90%;
  --secondary-foreground: 270 70% 20%;

  --accent: 280 60% 92%;
  --accent-foreground: 270 70% 30%;

  --muted: 270 20% 95%;
  --muted-foreground: 270 20% 45%;
}
```

### Popular Color Scheme Examples

#### Blue Theme (Professional)

```css
:root {
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 214 32% 91%;
  --secondary-foreground: 221 83% 20%;
}
```

#### Green Theme (Success)

```css
:root {
  --primary: 142 71% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 142 25% 90%;
  --secondary-foreground: 142 71% 20%;
}
```

#### Orange Theme (Energetic)

```css
:root {
  --primary: 25 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 25 40% 92%;
  --secondary-foreground: 25 95% 20%;
}
```

## Component-Specific Customization

### Custom Button Variant

```tsx
// components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        // Add custom variant
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Usage
<Button variant="gradient">Gradient Button</Button>
```

### Custom Border Radius

```css
/* globals.css */
:root {
  --radius: 0.5rem; /* Default */
}

/* For more rounded corners */
:root {
  --radius: 0.75rem;
}

/* For sharp corners */
:root {
  --radius: 0;
}

/* For very rounded corners */
:root {
  --radius: 1rem;
}
```

### Custom Font

```tsx
// app/layout.tsx
import { Inter, Roboto_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

```css
/* globals.css */
@layer base {
  body {
    @apply font-sans;
  }
  code {
    @apply font-mono;
  }
}
```

## Advanced Theming

### Multiple Theme Support

```tsx
// Define multiple themes
const themes = {
  light: {
    primary: "221 83% 53%",
    secondary: "214 32% 91%",
    // ...
  },
  dark: {
    primary: "217 91% 60%",
    secondary: "217 33% 18%",
    // ...
  },
  ocean: {
    primary: "199 89% 48%",
    secondary: "199 30% 90%",
    // ...
  },
}

// Apply theme dynamically
function applyTheme(theme: keyof typeof themes) {
  const root = document.documentElement
  Object.entries(themes[theme]).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}
```

### Gradient Backgrounds

```tsx
// Custom gradient utilities
<div className="bg-gradient-to-r from-primary to-accent">
  Gradient background
</div>

<div className="bg-gradient-to-br from-primary via-accent to-secondary">
  Multi-color gradient
</div>
```

### Custom Shadows

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      boxShadow: {
        'glow': '0 0 20px rgba(var(--primary), 0.5)',
        'elevated': '0 10px 40px rgba(0, 0, 0, 0.1)',
      },
    },
  },
}

// Usage
<Card className="shadow-glow">Glowing card</Card>
```

## Responsive Theming

### Breakpoint-Specific Styles

```tsx
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>

<Button size="sm" className="md:h-11 md:px-8">
  Responsive button
</Button>
```

### Container Queries (Experimental)

```css
/* globals.css */
@layer utilities {
  .container-card {
    container-type: inline-size;
  }
}

/* Component styles based on container size */
@container (min-width: 400px) {
  .card-content {
    @apply grid-cols-2;
  }
}
```

## Theming Best Practices

### 1. Maintain Semantic Consistency

Always use semantic tokens for their intended purpose:
- `primary` for main actions
- `destructive` for dangerous actions
- `muted` for less important content

### 2. Test Both Themes

Always test light and dark modes:
```tsx
// Quick dark mode test
<div className="dark">
  <YourComponent />
</div>
```

### 3. Ensure Sufficient Contrast

Use tools like WebAIM Contrast Checker to verify WCAG compliance:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

### 4. Document Custom Variables

```css
:root {
  /* Custom brand colors */
  --brand-primary: 270 70% 50%;
  --brand-secondary: 280 60% 55%;

  /* Feature-specific colors */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --info: 199 89% 48%;
}
```

### 5. Use CSS Variables for Dynamic Theming

```tsx
// Allow runtime theme customization
function setThemeColor(color: string) {
  document.documentElement.style.setProperty('--primary', color)
}

<input
  type="color"
  onChange={(e) => setThemeColor(rgbToHsl(e.target.value))}
/>
```

## Troubleshooting

### Flash of Unstyled Content (FOUC)

```tsx
// Add suppressHydrationWarning to prevent flash
<html lang="en" suppressHydrationWarning>
```

### CSS Variables Not Applying

Ensure you're using the `hsl()` function:
```css
/* Wrong */
background-color: var(--primary);

/* Correct */
background-color: hsl(var(--primary));
```

### Dark Mode Not Working

1. Check ThemeProvider is properly configured
2. Ensure `darkMode: ["class"]` in tailwind.config
3. Verify CSS variables are defined in `.dark` class
