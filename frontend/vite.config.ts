import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

import path from "node:path"

// https://vitejs.dev/config
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      open: true,
      host: true,
    },
    preview: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
            motion: ["framer-motion", "gsap"],
          },
        },
      },
    },
  }
})
