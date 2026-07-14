import type { Config } from "tailwindcss";

/** Colors are CSS variables (RGB channel triplets) so light/dark swap at runtime.
 *  The `/<alpha-value>` pattern keeps Tailwind opacity modifiers (bg-phosphor/10). */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: v("ink-900"),
          800: v("ink-800"),
          700: v("ink-700"),
          600: v("ink-600"),
          500: v("ink-500"),
          400: v("ink-400"),
        },
        line: v("line"),
        mist: v("mist"),
        chalk: v("chalk"),
        hot: v("hot"),
        qualified: v("qualified"),
        insight: v("insight"),
        watch: v("watch"),
        noise: v("noise"),
        phosphor: v("phosphor"),
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        glow: "0 0 0 1px rgb(var(--phosphor) / 0.4), 0 0 24px -6px rgb(var(--phosphor) / 0.5)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.22,1,0.36,1) both",
        sweep: "sweep 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
