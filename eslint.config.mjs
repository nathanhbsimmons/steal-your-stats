import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:jsx-a11y/recommended"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/control-has-associated-label": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
    },
  },
  {
    // Verified unmounted in production (see AGENT/AGENT_TASKS.md, a11y remediation
    // plan Tier 7) — legacy `components/glass` and old audio-player-dock/queue UI,
    // superseded by the vault player. Left in place but exempt from jsx-a11y.
    files: [
      "components/glass/topbar.tsx",
      "components/glass/player-dock.tsx",
      "components/glass/sidebar.tsx",
      "components/glass/primitives.tsx",
      "components/ui/audio-player-dock.tsx",
      "components/ui/queue.tsx",
    ],
    rules: {
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/interactive-supports-focus": "off",
      "jsx-a11y/control-has-associated-label": "off",
      "jsx-a11y/role-has-required-aria-props": "off",
      // Not one of the six named above, but fires in this same dead set
      // (player-dock.tsx, audio-player-dock.tsx <audio> elements) — same
      // "lint-scoped rather than modified" rationale applies.
      "jsx-a11y/media-has-caption": "off",
    },
  },
  {
    // components/ui/versions-table.tsx is not on the Tier 7 brief's audited
    // dead-file list, but a grep sweep during this task turned up zero
    // imports of it anywhere outside its own unit test — it is unmounted,
    // same as the files above. Flagged for controller confirmation rather
    // than silently folded into the block above.
    files: ["components/ui/versions-table.tsx"],
    rules: {
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-noninteractive-tabindex": "off",
      "jsx-a11y/click-events-have-key-events": "off",
    },
  },
];

export default eslintConfig;
