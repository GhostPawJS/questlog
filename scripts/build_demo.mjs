#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as esbuild from 'esbuild';

const OUT_DIR = 'demo';
const ENTRY = 'src/demo/main.tsx';
const WATCH = process.argv.includes('--watch');

/** @type {import("esbuild").BuildOptions} */
const buildOptions = {
	entryPoints: [ENTRY],
	outdir: OUT_DIR,
	bundle: true,
	format: 'esm',
	platform: 'browser',
	target: ['es2022'],
	sourcemap: true,
	jsx: 'automatic',
	jsxImportSource: 'preact',
	loader: { '.wasm': 'file' },
	entryNames: 'app',
	assetNames: 'assets/[name]-[hash]',
	alias: { fs: './src/demo/empty_module.ts', path: './src/demo/empty_module.ts' },
};

// ---------------------------------------------------------------------------
// CSS design system — cyberpunk RPG / WoW-style quest markers
// ---------------------------------------------------------------------------

const CSS = /* css */ `
/* ── Fonts ─────────────────────────────────────────────────────────────── */
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500&display=swap");

/* ── Custom properties ─────────────────────────────────────────────────── */
:root {
  color-scheme: dark;

  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;

  --bg-base: #080c14;
  --bg-surface: rgba(10, 18, 34, 0.80);
  --bg-elevated: rgba(20, 30, 52, 0.65);
  --bg-input: rgba(6, 10, 22, 0.95);

  --border-subtle: rgba(100, 160, 220, 0.10);
  --border-hover: rgba(100, 160, 220, 0.22);

  --marker-yellow: #ffaa00;
  --marker-blue: #00aaff;
  --marker-gray: #6b7a8d;

  --accent: #06d6a0;
  --accent-dim: rgba(6, 214, 160, 0.12);
  --accent-glow: rgba(6, 214, 160, 0.25);

  --success: #22c55e;
  --danger: #ff2d55;
  --warning: #f59e0b;

  --text-primary: #e8edf5;
  --text-secondary: #8899aa;
  --text-tertiary: #556677;

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 16px;
  --radius-pill: 999px;
}

/* ── Reset / base ──────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html, body {
  height: 100%;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--text-primary);
  background: var(--bg-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  line-height: 1.6;
  background:
    radial-gradient(ellipse 80% 50% at 20% 0%, var(--accent-glow), transparent),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(100, 160, 220, 0.06), transparent),
    var(--bg-base);
  background-attachment: fixed;
}

button, input, select, textarea { font: inherit; color: inherit; }

h1, h2, h3, h4 { font-family: var(--font-display); font-weight: 600; }

a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ── Layout ────────────────────────────────────────────────────────────── */
.demo-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
}

.demo-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  padding: 24px 16px;
  gap: 20px;
}

.demo-main {
  padding: 32px 28px;
  max-width: 1100px;
  width: 100%;
}

@media (max-width: 768px) {
  .demo-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .demo-sidebar {
    position: relative;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 14px 16px;
    gap: 10px;
  }
  .demo-main { padding: 20px 14px; }
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
.sidebar-brand {
  margin-bottom: 8px;
}
.sidebar-brand h1 {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
.sidebar-brand small {
  display: block;
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-weight: 400;
  margin-top: 2px;
}

.sidebar-banner {
  border: 1px dashed var(--border-hover);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  cursor: pointer;
  text-align: left;
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: 0.88rem;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}
.nav-item:hover {
  background: var(--accent-dim);
  color: var(--text-primary);
}
.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
  font-weight: 500;
  box-shadow: inset 3px 0 0 var(--accent);
}
.nav-item small {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.sidebar-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}
.sidebar-status .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  flex-shrink: 0;
}
.sidebar-status .dot.loading {
  background: var(--warning);
}

/* ── Buttons ───────────────────────────────────────────────────────────── */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 18px;
  border: 1px solid var(--border-hover);
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.button.primary {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.button.primary:hover {
  box-shadow: 0 0 14px var(--accent-glow);
}
.button.secondary {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}
.button.secondary:hover {
  border-color: var(--border-hover);
}
.button.danger {
  background: var(--danger);
  color: #fff;
  border-color: var(--danger);
}
.button.danger:hover {
  box-shadow: 0 0 14px rgba(255, 45, 85, 0.3);
}
.button.sm {
  min-height: 30px;
  padding: 0 12px;
  font-size: 0.8rem;
}
.button.ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}
.button.ghost:hover {
  color: var(--text-primary);
  background: var(--bg-elevated);
}
.button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Panels ────────────────────────────────────────────────────────────── */
.panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.25);
  padding: 22px 24px;
  animation: fadeSlideIn 0.3s ease-out both;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.panel:hover {
  border-color: var(--border-hover);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--accent-glow);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.panel-header h2, .panel-header h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.panel-subtitle {
  color: var(--text-secondary);
  font-size: 0.82rem;
  margin: -8px 0 14px;
}

/* ── Page heading ─────────────────────────────────────────────────────── */
.page-heading {
  margin: 0 0 20px;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-family: var(--font-display);
}

/* ── Page grid ─────────────────────────────────────────────────────────── */
.page-grid {
  display: grid;
  gap: 20px;
}
.page-grid.two {
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
}
@media (max-width: 768px) {
  .page-grid.two { grid-template-columns: 1fr; }
}

.page-dashboard,
.page-search {
  display: grid;
  gap: 20px;
}

/* ── Forms ──────────────────────────────────────────────────────────────── */
.form {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.form h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-display);
}
.form .button {
  justify-self: start;
}

.form-grid {
  display: grid;
  gap: 14px;
}
.form-grid.two {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

/* ── Detail sections ───────────────────────────────────────────────────── */
.questline-detail {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
}
.questline-detail h3 {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 700;
}
.data-rows {
  display: grid;
  gap: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.field label .required {
  color: var(--danger);
  margin-left: 2px;
}
.field .hint {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}
.field .error {
  font-size: 0.72rem;
  color: var(--danger);
}

input, select, textarea {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
  outline: none;
}
textarea { resize: vertical; min-height: 80px; }

/* ── Summary cards ─────────────────────────────────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}
.summary-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 16px;
}
.summary-label {
  display: block;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
  font-weight: 500;
}
.summary-value {
  display: block;
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 700;
  margin-top: 4px;
  color: var(--text-primary);
}
.summary-sublabel {
  display: block;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* ── Data rows ─────────────────────────────────────────────────────────── */
.data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-subtle);
}
.data-row:last-child { border-bottom: none; }
.data-row-label {
  font-size: 0.88rem;
  color: var(--text-primary);
  flex-shrink: 0;
}
.data-row-hint {
  font-size: 0.72rem;
  color: var(--text-tertiary);
}
.data-row-value {
  font-weight: 500;
  font-size: 0.88rem;
  color: var(--text-secondary);
  text-align: right;
  word-break: break-word;
}

/* ── Lists ──────────────────────────────────────────────────────────────── */
.list, .stack {
  display: grid;
  gap: 8px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s, border-color 0.15s;
}
.list-item:hover {
  border-color: var(--border-hover);
  background: rgba(20, 30, 52, 0.8);
}
.list-item.selected, .list-item.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent-dim);
}
.list-item-body { flex: 1; min-width: 0; }
.list-item-body strong {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
}
.list-item-body small {
  display: block;
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* ── Badges ─────────────────────────────────────────────────────────────── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: var(--font-display);
}
.badge.state   { background: rgba(148, 163, 184, 0.15); color: var(--text-secondary); }
.badge.tag     { background: rgba(100, 160, 220, 0.12); color: #93c5fd; }
.badge.entity  { background: rgba(255, 170, 0, 0.15); color: #fbbf24; }
.badge.success { background: rgba(34, 197, 94, 0.12); color: var(--success); }
.badge.danger  { background: rgba(255, 45, 85, 0.12); color: var(--danger); }
.badge.warning { background: rgba(245, 158, 11, 0.12); color: var(--warning); }
.badge.info    { background: rgba(0, 170, 255, 0.12); color: var(--marker-blue); }

/* ── Markers (hero element) ────────────────────────────────────────────── */
.marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
}
.marker.sm { width: 22px; height: 22px; font-size: 13px; }
.marker.md { width: 32px; height: 32px; font-size: 18px; }
.marker.lg { width: 48px; height: 48px; font-size: 28px; }

.marker.yellow {
  color: var(--marker-yellow);
  background: rgba(255, 170, 0, 0.12);
  text-shadow: 0 0 8px rgba(255, 170, 0, 0.6), 0 0 20px rgba(255, 170, 0, 0.3);
}
.marker.blue {
  color: var(--marker-blue);
  background: rgba(0, 170, 255, 0.12);
  text-shadow: 0 0 8px rgba(0, 170, 255, 0.6), 0 0 20px rgba(0, 170, 255, 0.3);
}
.marker.gray {
  color: var(--marker-gray);
  background: rgba(107, 122, 141, 0.12);
  text-shadow: 0 0 8px rgba(107, 122, 141, 0.3), 0 0 20px rgba(107, 122, 141, 0.15);
}
.marker.attention {
  animation: markerPulse 2s ease-in-out infinite;
}

/* ── Tabs ───────────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  background: var(--bg-input);
  padding: 4px;
  border-radius: var(--radius-sm);
  gap: 4px;
  margin-bottom: 14px;
}
.tab-btn {
  flex: 1;
  background: none;
  border: none;
  border-radius: 6px;
  padding: 7px 14px;
  font-family: var(--font-body);
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.tab-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
.tab-btn.active { background: var(--bg-elevated); color: var(--accent); }

/* ── Toast ──────────────────────────────────────────────────────────────── */
.toast-stack {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  z-index: 9999;
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  background: var(--bg-surface);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  min-width: 260px;
  max-width: 380px;
  border-left: 3px solid var(--text-tertiary);
  animation: toastSlideIn 0.25s ease-out both;
}
.toast.ok   { border-left-color: var(--success); }
.toast.fail { border-left-color: var(--danger); }
.toast.warn { border-left-color: var(--warning); }

.toast-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-primary);
}
.toast-body {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 3px;
  line-height: 1.4;
}

/* ── Tables ─────────────────────────────────────────────────────────────── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.85rem;
}
th {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
td { color: var(--text-primary); }
tr:hover td { background: var(--bg-elevated); }

/* ── Code block ────────────────────────────────────────────────────────── */
.code-block {
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 0.82rem;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  overflow-x: auto;
  line-height: 1.55;
  color: var(--text-primary);
}

/* ── Explainer ─────────────────────────────────────────────────────────── */
details.explainer {
  margin-top: 12px;
  border: 1px dashed var(--border-hover);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}
details.explainer summary {
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 0.88rem;
  color: var(--text-secondary);
  list-style: none;
}
details.explainer summary::before {
  content: "▸ ";
  color: var(--accent);
}
details.explainer[open] summary::before { content: "▾ "; }
details.explainer .explainer-body {
  margin-top: 10px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

/* ── Empty state ───────────────────────────────────────────────────────── */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 40px 20px;
  border: 1px dashed var(--border-hover);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  font-size: 0.88rem;
  text-align: center;
}

/* ── Actions layout ───────────────────────────────────────────────────── */
.actions, .inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

/* ── Animations ────────────────────────────────────────────────────────── */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes markerPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.7; }
}

/* ── Utilities ─────────────────────────────────────────────────────────── */
.gap-sm  { gap: 8px; }
.gap-md  { gap: 14px; }
.mt-sm   { margin-top: 8px; }
.mt-md   { margin-top: 16px; }
.mb-md   { margin-bottom: 16px; }
.flex-row { display: flex; align-items: center; }
.flex-col { display: flex; flex-direction: column; }
.muted    { color: var(--text-secondary); font-size: 0.88rem; }
.muted-sm { color: var(--text-tertiary); font-size: 0.78rem; }
`;

// ---------------------------------------------------------------------------
// HTML shell
// ---------------------------------------------------------------------------

const FAVICON = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='30' fill='%23080c14' stroke='%23ffaa00' stroke-width='3'/><text x='32' y='46' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='40' fill='%23ffaa00'>!</text></svg>`;

function writeHtmlShell() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Questlog Demo</title>
<link rel="icon" href="${FAVICON}" />
<style>${CSS}</style>
</head>
<body>
<div id="app"></div>
<script type="module" src="./app.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

async function main() {
	await mkdir(OUT_DIR, { recursive: true });

	if (WATCH) {
		const ctx = await esbuild.context(buildOptions);
		await ctx.watch();
		console.log('[demo] watching for changes …');
	} else {
		await esbuild.build(buildOptions);
		console.log('[demo] build complete');
	}

	await writeFile(join(OUT_DIR, 'index.html'), writeHtmlShell());
	console.log('[demo] wrote index.html');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
