import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/server": path.resolve(__dirname, "../../node_modules/next/server.js"),
    },
  },
  test: {
    globals: true,
    server: { deps: { inline: ["next-auth", "@auth/core"] } },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "__tests__/lib/**/*.test.ts",
            "__tests__/actions/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["__tests__/components/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
})
