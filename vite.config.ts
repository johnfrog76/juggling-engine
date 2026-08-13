import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Served from a project page (johnfrog76.github.io/juggling-engine) as well
  // as from a dev server at the root, so asset URLs stay relative.
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
