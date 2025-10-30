import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["firefly-top-jackal.ngrok-free.app", "api.shipsar.in"],
    port: 3000,       // change port
    strictPort: true, // fail if taken instead of auto-increment
    host: true        // listen on LAN (0.0.0.0); optional
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
  },
  preview: {
    port: 5500,
    strictPort: true
  }
})
