import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/constants": path.resolve(__dirname, "./src/constants"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/store": path.resolve(__dirname, "./src/store"),
      "@/app": path.resolve(__dirname, "./src/app"),
    },
  },
  build: {
    // Target modern browsers (Baseline Widely Available - 2.5 years old)
    target: "esnext",

    // Enable minification
    minify: "esbuild",

    // Chunk size warnings
    chunkSizeWarningLimit: 500, // Warn if chunks > 500kb

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks for better caching
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "zustand-vendor": ["zustand"],
          "ui-vendor": ["lucide-react", "clsx", "tailwind-merge"],

          // Feature-based chunks
          "store": [
            "./src/store/index.ts",
            "./src/store/userSlice.ts",
            "./src/store/habitsSlice.ts",
            "./src/store/streaksSlice.ts",
            "./src/store/shopSlice.ts",
            "./src/store/chatSlice.ts",
          ],
          "services": [
            "./src/services/storage.ts",
            "./src/services/user.service.ts",
            "./src/services/habits.service.ts",
            "./src/services/streaks.service.ts",
            "./src/services/shop.service.ts",
          ],
        },

        // Naming pattern for chunks
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },

    // Source maps for production debugging (optional, can be disabled)
    sourcemap: false,

    // CSS code splitting
    cssCodeSplit: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "zustand",
      "lucide-react",
    ],
  },
});
