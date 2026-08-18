import type { Config } from "tailwindcss"

import { brand } from "./src/design/tokens/colors"
import { fontSize, fontWeight, lineHeight, letterSpacing, fontFamily } from "./src/design/tokens/typography"
import { radius } from "./src/design/tokens/radius"
import { shadow } from "./src/design/tokens/shadow"
import { duration, easing } from "./src/design/tokens/animation"

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1440px",
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
        success: {
          DEFAULT: "hsl(var(--success))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
        },
        brand: brand,
      },
      borderRadius: {
        ...radius,
      },
      boxShadow: {
        ...shadow,
      },
      // NOTE: `spacing` is intentionally NOT extended — the token scale in
      // src/design/tokens/spacing.ts mirrors Tailwind's built-in spacing
      // exactly, and overriding `theme.spacing` with a static object triggers
      // a circular-reference crash in Tailwind 3.4's config resolution.
      fontFamily: {
        sans: fontFamily.sans,
        mono: fontFamily.mono,
        vazirmatn: fontFamily.vazirmatn,
        inter: fontFamily.inter,
      },
      fontSize: {
        ...fontSize,
      },
      lineHeight: {
        ...lineHeight,
      },
      fontWeight: {
        ...fontWeight,
      },
      letterSpacing: {
        ...letterSpacing,
      },
      transitionDuration: {
        ...duration,
      },
      transitionTimingFunction: {
        ...easing,
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(0.5rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        shimmer: "shimmer 1.5s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
