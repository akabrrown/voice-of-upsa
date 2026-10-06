// Serves the pdf.js worker from our own origin so it satisfies the
// `worker-src 'self'` CSP in middleware.ts. Runs on postinstall so the
// worker always matches the installed pdfjs-dist version.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

let source;
try {
  source = join(dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.js");
} catch {
  console.warn("[copy-pdf-worker] pdfjs-dist not installed; skipping.");
  process.exit(0);
}

if (!existsSync(source)) {
  console.error(`[copy-pdf-worker] Worker not found at ${source}`);
  process.exit(1);
}

const publicDir = join(projectRoot, "public");
mkdirSync(publicDir, { recursive: true });
copyFileSync(source, join(publicDir, "pdf.worker.min.js"));
console.log("[copy-pdf-worker] Copied pdf.worker.min.js to public/");
