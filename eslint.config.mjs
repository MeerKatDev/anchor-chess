import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

export default [
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json", // optional, but enables stricter rules
      },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        self: "readonly",
        Buffer: "readonly", // ✅ fix "Buffer not declared"
        process: "readonly", // optional: process, __dirname etc.
        __dirname: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@next/next": nextPlugin,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...prettier.rules,

      // unused vars/imports
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "import/no-unused-modules": [
        "warn",
        { unusedExports: true, missingExports: true },
      ],
    },
  },
];
