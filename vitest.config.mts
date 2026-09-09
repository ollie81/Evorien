import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    // Mirrors tsconfig.json's "@/*": ["./*"] — without this, any test that
    // imports a module using the @/ alias (even transitively) fails to
    // resolve, which is why every pure/tested module until now had to
    // avoid importing anything via @/ at all.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
