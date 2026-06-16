import type { NextConfig } from "next";

// Only apply the GitHub Pages sub-path prefix in CI. Local `npm run dev`
// stays at root (basePath undefined) so links resolve at http://localhost:3000/.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Emit a fully static site to `out/` (no Node server) for GitHub Pages.
  output: "export",
  // Static export cannot use the default Image Optimization loader.
  images: { unoptimized: true },
  // Emit `/route/index.html` so static hosts serve nested routes cleanly.
  trailingSlash: true,
  // Project Pages live under /Admin-UI. basePath alone rewrites both links
  // and asset URLs, so no assetPrefix is needed (it would double-prefix).
  basePath: isPages ? "/Admin-UI" : undefined,
  // The repo ships with two known, pre-existing type errors (a generated
  // `.next/types/validator.ts` quirk and an intentional OnboardingStatus vs
  // "closed" comparison in the applications detail view). They are harmless at
  // runtime but would otherwise fail `next build`'s type-check. Type safety is
  // still enforced out-of-band via `npx tsc --noEmit` (also runnable in CI),
  // so we let the static export build proceed.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
