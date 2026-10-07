import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Verify no forbidden secret environment variables are prefixed with VITE_
for (const key of Object.keys(process.env)) {
  if (key.startsWith("VITE_")) {
    const forbidden = ["SERVICE", "SECRET", "GEMINI", "PRIVATE"];
    for (const term of forbidden) {
      if (key.toUpperCase().includes(term)) {
        throw new Error(
          `FATAL SECURITY VIOLATION: Environment variable "${key}" contains forbidden term "${term}". Secrets must never be exposed to the browser client.`
        );
      }
    }
  }
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@trustguard/shared": path.resolve(__dirname, "./src/shared/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: [
            "@radix-ui/react-accordion",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
        },
      },
    },
  },
});
