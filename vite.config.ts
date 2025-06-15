import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          radix: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-switch', '@radix-ui/react-label', '@radix-ui/react-checkbox', '@radix-ui/react-radio-group', '@radix-ui/react-slider', '@radix-ui/react-progress', '@radix-ui/react-separator', '@radix-ui/react-avatar', '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-popover', '@radix-ui/react-tooltip', '@radix-ui/react-hover-card', '@radix-ui/react-navigation-menu', '@radix-ui/react-menubar', '@radix-ui/react-context-menu', '@radix-ui/react-scroll-area', '@radix-ui/react-collapsible', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-aspect-ratio', '@radix-ui/react-slot'],
          motion: ['framer-motion'],
          icons: ['lucide-react', 'react-icons'],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          markdown: ['react-markdown', 'react-syntax-highlighter', 'remark-gfm'],
          query: ['@tanstack/react-query'],
          utils: ['clsx', 'class-variance-authority', 'tailwind-merge', 'date-fns', 'nanoid'],
        },
      },
    },
  },
});
