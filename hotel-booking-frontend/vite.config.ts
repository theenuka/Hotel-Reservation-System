import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      "/api/auth": { target: "http://127.0.0.1:7102", changeOrigin: true },
      "/api/users": { target: "http://127.0.0.1:7102", changeOrigin: true },
      "/api/hotels/search": { target: "http://127.0.0.1:7105", changeOrigin: true },
      // Booking service overrides for nested hotel routes
      "^/api/hotels/.*/bookings": { target: "http://127.0.0.1:7104", changeOrigin: true },
      "^/api/hotels/.*/waitlist": { target: "http://127.0.0.1:7104", changeOrigin: true },
      // Hotel service
      "/api/hotels": { target: "http://127.0.0.1:7103", changeOrigin: true },
      "/api/my-hotels": { target: "http://127.0.0.1:7103", changeOrigin: true },
      // Booking service
      "/api/bookings": { target: "http://127.0.0.1:7104", changeOrigin: true },
      "/api/my-bookings": { target: "http://127.0.0.1:7104", changeOrigin: true },
      "/api/my-facility-bookings": { target: "http://127.0.0.1:7104", changeOrigin: true },
      "/api/maintenance": { target: "http://127.0.0.1:7104", changeOrigin: true },
      "/api/business-insights": { target: "http://127.0.0.1:7104", changeOrigin: true },
      // Notification service
      "/api/notifications": { target: "http://127.0.0.1:7101", changeOrigin: true },
      "/api/push": { target: "http://127.0.0.1:7101", changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
    },
  },
});
