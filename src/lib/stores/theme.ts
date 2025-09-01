import { writable, derived } from "svelte/store";
import { browser } from '$app/environment';

// Theme definitions (extracted from omarchy-theme-builder)
export const themePresets = {
  everforest: {
    name: "Everforest",
    colors: {
      background: "#2d353b",
      foreground: "#d3c6aa",
      surface: "#343f44",
      overlay: "#3d484d",
      muted: "#859289",
      subtle: "#9da9a0",
      text: "#d3c6aa",
      love: "#e67e80",
      gold: "#dbbc7f",
      rose: "#d699b6",
      pine: "#83c092",
      foam: "#7fbbb3",
      iris: "#a7c080",
      highlightLow: "#2d353b",
      highlightMed: "#343f44",
      highlightHigh: "#3d484d",
    },
  },
  gruvbox: {
    name: "Gruvbox Dark",
    colors: {
      background: "#282828",
      foreground: "#ebdbb2",
      surface: "#3c3836",
      overlay: "#504945",
      muted: "#665c54",
      subtle: "#7c6f64",
      text: "#ebdbb2",
      love: "#cc241d",
      gold: "#d79921",
      rose: "#b16286",
      pine: "#458588",
      foam: "#689d6a",
      iris: "#d3869b",
      highlightLow: "#32302f",
      highlightMed: "#3c3836",
      highlightHigh: "#504945",
    },
  },
  tokyoNight: {
    name: "Tokyo Night",
    colors: {
      background: "#1a1b26",
      foreground: "#c0caf5",
      surface: "#24283b",
      overlay: "#414868",
      muted: "#565f89",
      subtle: "#787c99",
      text: "#c0caf5",
      love: "#f7768e",
      gold: "#e0af68",
      rose: "#bb9af7",
      pine: "#2ac3de",
      foam: "#7dcfff",
      iris: "#bb9af7",
      highlightLow: "#1f2335",
      highlightMed: "#292e42",
      highlightHigh: "#3b4261",
    },
  },
  nord: {
    name: "Nord",
    colors: {
      background: "#2e3440",
      foreground: "#d8dee9",
      surface: "#3b4252",
      overlay: "#434c5e",
      muted: "#4c566a",
      subtle: "#616e88",
      text: "#eceff4",
      love: "#bf616a",
      gold: "#ebcb8b",
      rose: "#d08770",
      pine: "#8fbcbb",
      foam: "#88c0d0",
      iris: "#b48ead",
      highlightLow: "#2e3440",
      highlightMed: "#3b4252",
      highlightHigh: "#434c5e",
    },
  },
};

// Get initial theme from localStorage or default to Everforest
const getInitialTheme = () => {
  if (browser) {
    const savedTheme = localStorage.getItem('petalytics-theme') as keyof typeof themePresets;
    if (savedTheme && themePresets[savedTheme]) {
      return themePresets[savedTheme];
    }
  }
  return themePresets.everforest;
};

export const currentTheme = writable(getInitialTheme());

// Derived store for CSS custom properties
export const cssVariables = derived(currentTheme, ($theme) => {
  return {
    "--petalytics-bg": $theme.colors.background,
    "--petalytics-fg": $theme.colors.foreground,
    "--petalytics-surface": $theme.colors.surface,
    "--petalytics-overlay": $theme.colors.overlay,
    "--petalytics-muted": $theme.colors.muted,
    "--petalytics-subtle": $theme.colors.subtle,
    "--petalytics-text": $theme.colors.text,
    "--petalytics-love": $theme.colors.love,
    "--petalytics-gold": $theme.colors.gold,
    "--petalytics-rose": $theme.colors.rose,
    "--petalytics-pine": $theme.colors.pine,
    "--petalytics-foam": $theme.colors.foam,
    "--petalytics-iris": $theme.colors.iris,
    "--petalytics-highlight-low": $theme.colors.highlightLow,
    "--petalytics-highlight-med": $theme.colors.highlightMed,
    "--petalytics-highlight-high": $theme.colors.highlightHigh,
    "--petalytics-accent": $theme.colors.iris,
    "--petalytics-border": $theme.colors.overlay,
  };
});

// Theme manipulation functions
export function loadThemePreset(themeKey: keyof typeof themePresets) {
  if (themePresets[themeKey]) {
    currentTheme.set(themePresets[themeKey]);
    // Save to localStorage
    if (browser) {
      localStorage.setItem('petalytics-theme', themeKey);
    }
  }
}

// Apply CSS variables to document root (from omarchy-theme-builder)
export function applyCssVariables(variables: Record<string, string>) {
  if (browser) {
    const root = document.documentElement;
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
}

// Auto-apply CSS variables when theme changes
if (browser) {
  cssVariables.subscribe((variables) => {
    applyCssVariables(variables);
  });
}