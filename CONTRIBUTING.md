# Contributing to Whispr

Thank you for your interest in contributing! This guide covers everything you need to know to get your changes merged cleanly.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Before You Start](#before-you-start)
- [Setup](#setup)
- [Development Workflow](#development-workflow)
- [Project Architecture](#project-architecture)
- [Adding a New Widget](#adding-a-new-widget)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

Be kind, assume good intent, and focus on the code. Harassment, discrimination, or hostility of any kind will result in an immediate ban.

---

## Before You Start

1. **Search existing issues first** — your bug or feature idea may already be tracked: [github.com/Krshs90/Whispr/issues](https://github.com/Krshs90/Whispr/issues)
2. **For large changes**, open an issue *before* writing code. This prevents wasted effort if the direction isn't right.
3. **For small fixes** (typos, obvious bugs, documentation), just open a PR.

---

## Setup

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ LTS | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Bundled with Node.js |
| Ollama | Latest | [ollama.ai](https://ollama.ai) |
| Git | Any | [git-scm.com](https://git-scm.com) |

### Step-by-step

```bash
# 1. Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Whispr.git
cd Whispr/whisper-app

# 2. Add upstream remote so you can pull future changes
git remote add upstream https://github.com/Krshs90/Whispr.git

# 3. Install dependencies
npm install

# 4. Pull at least one Ollama model (required for AI features)
ollama pull llama3.2

# 5. Verify setup — this should start the app without errors
npm run electron:dev
```

### Verify your setup works

After running `npm run electron:dev`, you should see:

```
[0]   VITE v8.x.x  ready in NNN ms
[0]   ➜  Local:   http://localhost:5173/
[1]   [AI Engine] Ollama running.
```

The Electron window will open. Press `Ctrl+I` to toggle the Dynamic Island overlay.

If you see `Main window renderer crashed: crashed` repeating, see the [Troubleshooting](README.md#-troubleshooting) section in the README.

---

## Development Workflow

### 1. Create a branch

```bash
git checkout -b feat/my-feature    # For new features
git checkout -b fix/bug-name       # For bug fixes
git checkout -b chore/task-name    # For refactors / docs / tooling
```

### 2. Make your changes

See [Project Architecture](#project-architecture) below to understand where things live.

### 3. Run quality checks (REQUIRED before PR)

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Manual smoke test
npm run electron:dev
```

All three must pass cleanly. PRs that fail lint or type-check will be asked to fix before review.

### 4. Commit your changes

Follow the [commit convention](#commit-convention).

### 5. Sync with upstream

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push and open a PR

```bash
git push origin feat/my-feature
```

Then open a PR on GitHub against the `main` branch. Fill out the PR template completely.

---

## Project Architecture

```
whisper-app/
├── electron/                    ← Node.js main process
│   ├── main.js                  ← Window creation, IPC handlers, global shortcuts
│   ├── preload.cjs              ← Secure context bridge (only place with Node access in renderer)
│   └── ai/
│       ├── llm.js               ← Ollama streaming, intent router, tool calling loop
│       ├── tools.js             ← Tool schema registry + execution handlers
│       ├── ollamaManager.js     ← Auto-start + model list
│       ├── health.js            ← Background health monitor (broadcasts every 60s)
│       ├── mediaDetector.js     ← Windows media / Spotify detection via PowerShell
│       └── webScraper.js        ← DuckDuckGo + Wikipedia native fetch scraper
│
└── src/                         ← React renderer (Vite + TypeScript)
    ├── App.tsx                  ← Dynamic Island overlay (transparent window)
    ├── MainApp.tsx              ← Full chat application window
    ├── Settings.tsx             ← Settings panel (9 tabs)
    ├── main.tsx                 ← Entry — renders App or MainApp based on ?mode= URL param
    └── components/
        ├── MarkdownRenderer.tsx ← Custom markdown + syntax highlighting + LaTeX
        ├── MathGraph.tsx        ← function-plot graph renderer
        ├── Onboarding.tsx       ← First-run hardware scan flow
        ├── ErrorBoundary.tsx    ← React error boundary
        └── pills/
            ├── index.tsx        ← PILL REGISTRY — single source of truth for all widgets
            ├── PillLayout.tsx   ← Shared layout wrapper
            └── *.tsx            ← Individual widget components
```

### Key architectural rules

| Rule | Reason |
|------|--------|
| Always use `npm run electron:dev`, never `vite` and `electron .` separately | Separate invocations leave orphan processes on port 5173 |
| Port 5173 is hardcoded in `main.js` | `strictPort: true` in Vite config enforces this |
| The overlay and main app share `localStorage` | Both are `BrowserWindow`s on the same `localhost:5173` origin |
| All IPC messages are broadcast to both windows | AI responses stay in sync between overlay and main app |
| The pill registry (`index.tsx`) is the single source of truth | New widgets **must** be registered there to appear anywhere |

### IPC channels reference

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `chat-request` | Renderer → Main | Send user message to AI |
| `chat-token` | Main → All | Stream response token |
| `chat-tool` | Main → All | AI invoked a tool (show widget) |
| `chat-tool-result` | Main → All | Tool returned live data |
| `chat-end` | Main → All | Response complete |
| `show-island` | Main → Renderer | Show overlay |
| `hide-island` | Main → Renderer | Hide overlay |
| `set-ignore-mouse-events` | Renderer → Main | Toggle click-through |
| `system-health` | Main → All | Health status broadcast (60s interval) |

---

## Adding a New Widget

Follow these steps in order. Skipping any step will cause the widget to silently not appear.

### Step 1 — Create the pill component

Create `src/components/pills/YourPill.tsx`:

```tsx
import { useState } from 'react';

interface YourData {
  // define the shape of your data
  value: string;
}

export function YourPill({ data, defaultExpanded = false, onExpand }: {
  data?: any;
  defaultExpanded?: boolean;
  onExpand?: (height: number) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const parsed: YourData | null = data?.yourKey || null;

  if (!parsed) {
    return <div style={{ padding: 20, color: '#888', fontSize: 12 }}>No data available</div>;
  }

  return (
    <div style={{ width: '100%', background: '#1A1A1A', padding: 20 }}>
      {/* Your widget UI */}
    </div>
  );
}

// REQUIRED — used by the pill registry
export const yourPillMeta = {
  name: 'Your Widget',
  height: 200,          // compact height in pixels
  keywords: ['keyword1', 'keyword2']
};
```

### Step 2 — Register in the pill registry

Open `src/components/pills/index.tsx` and add:

```tsx
import { YourPill, yourPillMeta } from './YourPill';

// Add to PILL_REGISTRY array:
{ ...yourPillMeta, component: (props) => <YourPill {...props} /> },
```

### Step 3 — Add render case in MainApp

Open `src/MainApp.tsx`, find the `renderPill()` function, and add:

```tsx
case 'your_key':
  return <div style={{ ...pillCard, minHeight: 200 }}><YourPill data={data} defaultExpanded={true} /></div>;
```

### Step 4 — (If live data needed) Add tool schema

Open `electron/ai/tools.js` and add to `availableTools`:

```js
{
  type: "function",
  function: {
    name: "get_your_data",
    description: "Description for the LLM of when to call this.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The user's query." }
      },
      required: ["query"]
    }
  }
}
```

Then add the execution handler inside `executeTool()`:

```js
if (name === 'get_your_data') {
  try {
    // fetch your data here
    return JSON.stringify({ status: 'success', yourKey: { value: 'result' } });
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}
```

Also add to the allowlist in `main.js`:

```js
const ALLOWED_TOOLS = [
  // ... existing tools
  'get_your_data',   // ← add here
];
```

### Step 5 — (Optional) Add intent keyword mapping

Open `electron/ai/llm.js` and add to `DIRECT_WIDGET_MAP` if users should be able to trigger it by exact phrase:

```js
{ patterns: ['your widget', 'open your thing'], tool: 'get_your_data', args: {} },
```

### Step 6 — Test it

1. Start `npm run electron:dev`
2. Press `Ctrl+I` and type one of your keywords
3. The widget should appear in the overlay
4. Open the main app and verify it also renders correctly in the chat thread
5. Check **Settings → Widgets** — your widget should appear in the index

---

## Pull Request Guidelines

### PR template

When opening a PR, please fill in:

```markdown
## What does this PR do?
<!-- A clear description of the change -->

## Type
- [ ] Bug fix
- [ ] New feature / widget
- [ ] Refactor / improvement
- [ ] Documentation
- [ ] Chore / tooling

## How was it tested?
<!-- e.g. "Tested on Windows 11 with llama3.2. Verified widget appears in overlay and main chat." -->

## Screenshots / videos
<!-- If it changes UI, attach a screenshot or screen recording -->

## Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run electron:dev` starts without errors
- [ ] New widget registered in pill registry (if applicable)
- [ ] New tool added to ALLOWED_TOOLS allowlist in main.js (if applicable)
- [ ] No hardcoded API keys or secrets
- [ ] No console.log statements left in production paths
```

### PR expectations

- **Scope**: Keep PRs focused. One feature or bug fix per PR.
- **Tests**: Run the full smoke test (`npm run electron:dev`) and verify your change works end-to-end.
- **No secrets**: Run a quick `git diff HEAD` scan. If you see anything that looks like an API key or password, **do not push**.
- **No private files**: `README_PRIVATE.md`, `TODO.md`, and `IDEAS.md` are in `.gitignore` — never commit them.
- **Types**: Avoid `any` where possible. Use the interfaces in `src/lib/types.ts`.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <description>

[optional body]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature or widget |
| `fix` | Bug fix |
| `refactor` | Code restructure with no behavior change |
| `chore` | Tooling, deps, CI, config |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or updating tests |

**Examples:**

```
feat(widgets): add working timer with desktop notification on completion
fix(stocks): replace Yahoo Finance scraping with Finnhub API fallback
chore(ci): add GitHub Actions for lint and type-check on PR
docs(readme): update widget status table to reflect actual state
```

---

## Code Style

- **TypeScript**: Prefer explicit types over `any`. Use interfaces in `src/lib/types.ts` for shared shapes.
- **React**: Functional components only. Hooks at the top, no conditionals before hooks.
- **IPC safety**: All `webContents.send()` calls must check `!win.isDestroyed()` AND `!win.webContents.isCrashed()` before sending.
- **Tool allowlist**: Any new tool name MUST be added to `ALLOWED_TOOLS` in `electron/main.js` — this is a security boundary.
- **No inline secrets**: Never hardcode API keys, tokens, or passwords. Use the `apiKeys` object passed through IPC.
- **Error handling**: All tool executions must be wrapped in try/catch and return `JSON.stringify({ error: ... })` on failure.
- **CSS**: Inline styles only (no CSS files per component). Use the established color tokens: `#1A1A1A` (bg), `#2A2A2A` (border), `#FFFFEB` (text), `#4ADE80` (accent).

---

## Reporting Bugs

Use the [Bug Report](https://github.com/Krshs90/Whispr/issues/new?template=bug_report.md) issue template.

Please include:

- **OS and version** (e.g. Windows 11 23H2)
- **Node.js version** (`node --version`)
- **Electron version** (shown in `package.json`)
- **Ollama model** being used
- **Steps to reproduce** — the exact sequence of actions
- **Expected behavior** — what should have happened
- **Actual behavior** — what actually happened, including any console output
- **GPU/graphics card** — especially for renderer crash issues

**Before reporting:**
- [ ] Search [existing issues](https://github.com/Krshs90/Whispr/issues) first
- [ ] Try with a fresh `npm install` (delete `node_modules` and reinstall)
- [ ] Check the terminal output for any error messages

---

## Suggesting Features

Use the [Feature Request](https://github.com/Krshs90/Whispr/issues/new?template=feature_request.md) template.

For new widgets, explain:
- What data it shows
- Where the data comes from (free API, local computation, etc.)
- What problem it solves / who benefits

---

## Questions?

Open a [Discussion](https://github.com/Krshs90/Whispr/discussions) rather than an issue for general questions or ideas.
