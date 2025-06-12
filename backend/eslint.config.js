import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: ["@eslint/js", "react"], // Plugins should be array items
    extends: ["plugin:react/recommended", "js/recommended"], // React config included properly
    languageOptions: { globals: globals.browser },
  },
]);
