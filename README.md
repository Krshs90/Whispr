<div align="center">

<br/>

<img src="public/favicon.svg" width="72" height="72" alt="Whispr logo" />

<h1>Whispr</h1>

<p><strong>A Dynamic Island AI assistant that lives on your desktop.</strong><br/>100% local inference via Ollama — no cloud, no subscriptions, no tracking.</p>

<br/>

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?style=flat-square&logo=electron)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-white?style=flat-square)](https://ollama.ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Issues](https://img.shields.io/github/issues/Krshs90/Whispr?style=flat-square)](https://github.com/Krshs90/Whispr/issues)

<br/>

</div>

---

Whispr is a floating **Dynamic Island** for Windows that gives you instant AI access from anywhere on your desktop. Press `Ctrl+I`, ask anything, and watch it respond with live widgets — weather forecasts, sports scores, stock tickers, a scientific calculator, currency converter, and more — rendered inside a beautiful morphing overlay.

Everything runs **100% locally** on your machine via [Ollama](https://ollama.ai). No API keys required for AI chat. No data leaves your machine.

> **⚠️ Alpha Software** — Whispr is actively developed and has known bugs. See [Known Issues](#-known-issues) and check the [issue tracker](https://github.com/Krshs90/Whispr/issues) before reporting.

<br/>

## ✦ Features

### Dynamic Island Overlay
- **Always-on-top transparent window** — toggled with `Ctrl+I` from any app
- **Click-through architecture** — transparent areas pass clicks through to apps behind Whispr
- **Pill stack carousel** — multiple widgets stack with 3D depth and vertical-swipe navigation
- **Swipe-to-dismiss** — drag any widget left or right to close it
- **Orb → pill morphing** — smooth animated transition sequence on activation

### AI Chat Engine
- **Fully local inference** via [Ollama](https://ollama.ai) — runs `llama3.2` by default, any model can be swapped in Settings
- **Real-time streaming** — responses render token-by-token
- **Intent router** — fast regex first pass + LLM fallback classifier routes to 12+ specialized prompt modes
- **Tool calling** — AI can call backend tools to fetch live data and render interactive widgets
- **Specialized prompt modes** — Math (LaTeX), Translation (native scripts), Code, History, Science, Business, Engineering, Gaming

### Widget System

| Widget | Status | Data Source | Notes |
|--------|--------|-------------|-------|
| 🌤 **Weather** | ✅ Working | `wttr.in` (free) / OpenWeatherMap | Full 5-day + hourly |
| 🏀 **Sports** | ✅ Working | ESPN public API | Scores, live, standings |
| 📈 **Stocks** | ⚠️ Partial | Yahoo Finance scraping | Intermittently blocked by Yahoo |
| 📰 **News** | ✅ Working | Google News RSS | Top headlines |
| 🎵 **Music** | ⚠️ Windows Only | Windows PowerShell / SMTC | Detect-only, no playback |
| 🧮 **Calculator** | ⚠️ Needs Work | Local `new Function()` eval | Missing keyboard input, bad UX |
| 💱 **Currency** | ✅ Working | `fawazahmed0/currency-api` | No key needed |
| 🖥 **System Monitor** | ⚠️ No CPU % | Node.js `os` module | Shows static CPU info, no live usage |
| 🌍 **Translation** | 🔴 UI Shell | LLM only | No real translation API wired |
| 📅 **Calendar** | 🔴 Placeholder | None | No data source |
| ✈️ **Flight** | 🔴 Placeholder | Hardcoded fake data | No API |
| 🛜 **Connectivity** | ✅ Working | Native OS APIs + health monitor | WiFi + Ollama status |
| ⏱ **Timer** | 🔴 UI Only | None | Buttons render but don't tick |
| 🕐 **Clock** | ✅ Working | Local | Live |
| ✅ **Tasks** | ⚠️ Local Only | `localStorage` | No sync, no AI-add support |
| 🔔 **Notifications** | 🔴 Placeholder | None | Static demo only |
| 🧭 **Directions** | 🔴 Placeholder | None | Static demo only |

**Legend:** ✅ Working · ⚠️ Partial / Limited · 🔴 Not Implemented

### Main Application Window
- Full chat interface with pinned sessions, sidebar, and session management
- **Markdown rendering** with LaTeX support (`remark-math` + `rehype-katex`)
- Source citations with clickable references
- **Settings panel** with 9 tabs — AI Models, Services (API keys), Widgets Index, Shortcuts, and more
- Context memory bar showing token usage

<br/>

## ✦ Known Issues

The following are confirmed bugs or major missing features. See [GitHub Issues](https://github.com/Krshs90/Whispr/issues) for the full list.

| # | Issue | Severity |
|---|-------|----------|
| Renderer crash on startup | App loops with `render-process-gone` errors on some machines | 🔴 Critical |
| Stocks broken | Yahoo Finance scraping gets blocked, returns stale/no data | 🔴 High |
| Calculator UX poor | No keyboard input, no history, buttons look generic | 🟡 Medium |
| System Monitor | Shows static CPU model name, no live CPU % or real-time graphs | 🟡 Medium |
| Tasks widget | No AI-add ("add buy milk to my tasks"), no delete, no sync | 🟡 Medium |
| Translation widget | UI shell only — no actual API for translation | 🔴 High |
| Timer | Buttons exist but timer doesn't actually tick | 🟡 Medium |
| DuckDuckGo scraping | HTML regex fragile, breaks when DDG changes layout | 🔴 High |
| Whispr Vision | Screen capture infrastructure exists but AI pipeline not complete | 🔴 High |
| Image upload | No image upload support for AI vision queries | 🟡 Medium |
| Music playback | Detection works, but "play Blinding Lights" doesn't actually play | 🟡 Medium |
| No production build | No `electron-builder` packaging, no installer | 🟡 Medium |
| Theme toggle | Dark/light setting exists in UI but does nothing | 🟡 Medium |
| macOS / Linux | PowerShell media detection Windows-only; not tested on other platforms | 🟡 Medium |

<br/>

## ✦ Getting Started

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| [Node.js](https://nodejs.org) | 18+ | LTS recommended |
| [Ollama](https://ollama.ai) | Latest | Runs AI locally |
| Windows | 10 / 11 | Primary platform; macOS/Linux partially supported |

### 1 — Install Ollama and pull a model

```bash
# Install from https://ollama.ai, then:
ollama pull llama3.2
```

Any Ollama-compatible model works. Larger models (e.g. `qwen2.5:32b`) give better reasoning.

### 2 — Clone and install

```bash
git clone https://github.com/Krshs90/Whispr.git
cd Whispr/whisper-app
npm install
```

### 3 — Run

```bash
npm run electron:dev
```

This cleans port 5173, starts Vite, waits for it to be ready, then launches Electron. Ollama is auto-started if not running.

### 4 — Toggle the overlay

Press **`Ctrl + I`** anywhere on your desktop.

<br/>

## ✦ Troubleshooting

**App crashes immediately or shows infinite `render-process-gone` errors**

This is a known GPU/sandbox issue on some Windows machines. It's partially mitigated in the current build with `--disable-gpu` and `app.disableHardwareAcceleration()`. If you still see it, try running:

```powershell
# Kill leftover processes first
taskkill /IM electron.exe /F 2>$null
npm run electron:dev
```

If the crash persists, please [open an issue](https://github.com/Krshs90/Whispr/issues/new) with your Windows version, GPU model, and Node.js version.

**Ollama not connecting**

Make sure Ollama is running: `ollama serve`. The default host is `http://127.0.0.1:11434`.

**Stocks not loading**

Yahoo Finance scraping is intermittently blocked. This is a known issue. Adding a [Finnhub API key](https://finnhub.io) in **Settings → Services** provides a reliable fallback.

<br/>

## ✦ Configuration

### Optional API Keys

Whispr works without any API keys. Adding them unlocks more reliable data:

| Service | Widget | Where to get | Notes |
|---------|--------|-------------|-------|
| [OpenWeatherMap](https://openweathermap.org/api) | Weather | Free tier | Better accuracy than `wttr.in` |
| [Finnhub](https://finnhub.io) | Stocks | Free tier | Fixes Yahoo Finance blocking |

Add keys in **Settings → Services**. They live in browser `localStorage` and never leave your machine.

### AI Model

Default: `llama3.2`. Change in **Settings → AI Models**. You can configure separate models for fast responses and heavy reasoning tasks.

<br/>

## ✦ Project Structure

```
whisper-app/
├── electron/                    # Main process (Node.js)
│   ├── main.js                  # Window management, IPC, global shortcuts
│   ├── preload.cjs              # Context bridge (renderer ↔ main)
│   └── ai/
│       ├── llm.js               # Streaming, intent router, tool loop
│       ├── tools.js             # Tool schemas + execution handlers
│       ├── ollamaManager.js     # Auto-start Ollama
│       ├── health.js            # Background system health monitor
│       ├── mediaDetector.js     # Windows media / Spotify detection
│       └── webScraper.js        # DuckDuckGo + Wikipedia search
│
└── src/                         # React renderer (Vite + TypeScript)
    ├── App.tsx                  # Dynamic Island overlay
    ├── MainApp.tsx              # Full chat window
    ├── Settings.tsx             # Settings panel
    ├── main.tsx                 # Entry — routes by ?mode= param
    └── components/
        ├── MarkdownRenderer.tsx # Markdown + LaTeX
        ├── MathGraph.tsx        # function-plot graph renderer
        ├── Onboarding.tsx       # First-run hardware scan
        └── pills/               # Widget components
            ├── index.tsx        # Pill registry
            └── *.tsx            # Individual widgets
```

<br/>

## ✦ Contributing

Contributions are very welcome — this project is young and there's a lot to build.

**Before you start:** read [CONTRIBUTING.md](CONTRIBUTING.md) — it covers setup, PR expectations, and how to add new widgets.

Quick summary:
1. Fork and `git checkout -b feat/your-feature`
2. Run `npm run electron:dev` — always use this, not Vite + Electron separately
3. Run `npm run lint` before pushing
4. Open a PR against `main`

[Good first issues →](https://github.com/Krshs90/Whispr/issues?q=is%3Aissue+label%3A%22good+first+issue%22)

<br/>

## ✦ Roadmap

Top priorities for contributors:

- [ ] Fix Stocks widget — replace Yahoo Finance scraping with reliable API
- [ ] Fix Calculator — add keyboard input, history, proper expression parser
- [ ] Fix System Monitor — add live CPU %, GPU, network graphs
- [ ] Implement Translation — wire MyMemory or LibreTranslate API
- [ ] Implement Timer — countdown logic + desktop notification
- [ ] Implement Whispr Vision — screen capture → vision model pipeline
- [ ] Image upload — allow sending images to AI for analysis
- [ ] Cross-platform media detection — replace Windows PowerShell
- [ ] Production packaging — `electron-builder` installer
- [ ] Replace DuckDuckGo HTML scraping — use SearXNG or Brave Search API
- [ ] Dark/light theme — CSS custom properties system
- [ ] Voice input — `whisper.cpp` STT integration
- [ ] CI/CD — GitHub Actions for lint + type-check + build

<br/>

## ✦ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electron 41](https://electronjs.org) |
| Frontend | [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org) |
| Build | [Vite 8](https://vitejs.dev) |
| Animations | [Framer Motion 12](https://www.framer.com/motion/) |
| AI | [Ollama](https://ollama.ai) (local) |
| Math rendering | [KaTeX](https://katex.org) |
| Math engine | [mathjs](https://mathjs.org) |
| Graphing | [function-plot](https://mauriciopoppe.github.io/function-plot/) |
| Icons | [lucide-react](https://lucide.dev) |

<br/>

## ✦ License

MIT — see [LICENSE](LICENSE).

<br/>

<div align="center">
<sub>Built by <a href="https://github.com/Krshs90">Krshs90</a> · open to contributions</sub>
</div>
