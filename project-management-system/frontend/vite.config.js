import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so GitHub Codespaces can forward the port
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5173,
  },
})
