<div align="center">

<br/>

<img src="public/favicon.svg" width="72" height="72" alt="Whispr logo" />

<h1>Whispr</h1>

<p><strong>A Dynamic Island AI assistant that lives on your desktop.</strong><br/>Powered by local LLMs via Ollama — no cloud, no subscriptions, no tracking.</p>

<br/>

[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-41-47848F?style=flat-square&logo=electron)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Ollama](https://img.shields.io/badge/Powered%20by-Ollama-white?style=flat-square)](https://ollama.ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

<br/>

</div>

---

Whispr is a floating **Dynamic Island** for Windows that gives you instant AI access from anywhere on your desktop. Press `Ctrl+I`, ask anything — and watch it respond with live weather, sports scores, stock tickers, a scientific calculator, and more, right inside a beautiful animated overlay.

Everything runs **100% locally** on your machine. No API keys required for chat. No data ever leaves your computer.

<br/>

## ✦ What it looks like

```
┌─────────────────────────────────┐   ← Floating transparent overlay
│  ●  What's the weather in NYC?  │     always on top of your apps
└─────────────────────────────────┘
           ↓ morphs into ↓
┌───────────────────────────────────────────────┐
│  🌤  New York City            72°F / 22°C     │
│  ────────────────────────────────────────────  │
│  Mon  Tue  Wed  Thu  Fri                       │
│  ☀️   ⛅   🌧️   ☀️   ☀️                          │
│  75   70   64   78   80                        │
└───────────────────────────────────────────────┘
```

<br/>

## ✦ Features

### Dynamic Island Overlay
- **Always-on-top transparent window** — toggled via `Ctrl+I` from anywhere
- **Click-through architecture** — clicks pass through transparent areas to the app behind Whispr
- **Pill stack carousel** — multiple widgets stack with 3D depth perspective, navigable by vertical swipe
- **Swipe-to-dismiss** — drag any widget left or right to remove it from the stack
- **Orb → Pill animation** — smooth morphing sequence when the island activates

### AI Chat Engine
- **Fully local inference** via [Ollama](https://ollama.ai) — runs `llama3.2` by default, swap any model in Settings
- **Real-time streaming** — responses render token-by-token as they generate
- **Intent router** — classifies queries into 14+ specialized categories and routes to the best prompt
- **Tool execution** — AI can call backend tools that fetch live data and render results as interactive widgets
- **Specialized system prompts** — math queries get a LaTeX engine; translation gets a polyglot engine

### 19 Widget Pills

| Widget | Status | Data Source |
|--------|--------|-------------|
| 🌤 **Weather** | ✅ Live | OpenWeatherMap API |
| 🏀 **Sports** | ✅ Live | Web scraping + search |
| 📈 **Stocks** | ✅ Live | Finnhub API / web fallback |
| 📰 **News** | ✅ Live | DuckDuckGo News API |
| 🎵 **Music** | ✅ Detection | Windows PowerShell (native) |
| 🧮 **Calculator** | ✅ Full | Local computation (TI-84 layout) |
| 💱 **Currency** | ✅ Live | ExchangeRate API |
| 🖥 **System Monitor** | ✅ Live | Node.js `os` module |
| 🌍 **Translation** | 🔶 UI Shell | LLM-powered |
| 📅 **Calendar** | 🔶 UI Shell | Placeholder (contribution wanted) |
| ✈️ **Flight** | 🔶 UI Shell | Placeholder (contribution wanted) |
| 🛜 **Connectivity** | ✅ Live | Native OS APIs |
| ⏱ **Timer** | 🔶 UI Only | Needs backend wiring |
| 🔴 **Recording** | 🔶 UI Only | Indicator placeholder |
| 🕐 **Clock** | ✅ Live | Local |
| 🧭 **Directions** | 🔶 UI Shell | Placeholder |
| 🔔 **Notifications** | 🔶 UI Shell | Placeholder |
| ✅ **Tasks** | ✅ Local | LocalStorage |

### Main Application Window
- Full chat interface with session management, pinned chats, and search
- Sidebar with conversation history
- **Markdown rendering** with LaTeX equation support (`remark-math` + `rehype-katex`)
- Source citations — AI responses show clickable references
- **Settings panel** with 9 tabs: General, AI Models, Shortcuts, Voice, Security, Appearance, Notifications, Widgets, Services

<br/>

## ✦ Getting Started

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| [Node.js](https://nodejs.org) | 18+ | LTS recommended |
| [Ollama](https://ollama.ai) | Latest | For local AI inference |
| Windows | 10 / 11 | macOS/Linux: most features work, media detection is Windows-only |

### 1 — Install Ollama and pull a model

```bash
# Install Ollama from https://ollama.ai, then:
ollama pull llama3.2
```

> Any Ollama-compatible model works. Larger models (e.g. `qwen2.5:32b`) give better results for complex reasoning.

### 2 — Clone and install

```bash
git clone https://github.com/Krshs90/Whispr.git
cd Whispr/whisper-app
npm install
```

### 3 — Run in development mode

```bash
npm run electron:dev
```

This will:
1. Auto-clean any zombie processes on port 5173
2. Start the Vite dev server at `http://localhost:5173`
3. Launch Electron once Vite is ready
4. Auto-start Ollama if it isn't already running

### 4 — Use it

Press **`Ctrl + I`** anywhere on your desktop to toggle the Dynamic Island.

<br/>

## ✦ Configuration

### Optional API Keys

Whispr works with zero API keys for AI chat. For enhanced widget data, add keys in **Settings → Services**:

| Service | Widget | Where to get it |
|---------|--------|-----------------|
| [OpenWeatherMap](https://openweathermap.org/api) | Weather forecasts | Free tier available |
| [Finnhub](https://finnhub.io) | Live stock prices | Free tier available |

Keys are stored in browser `localStorage` — they never leave your machine.

### Changing the AI model

Open **Settings → AI Models** and type any model name from your `ollama list`. You can also configure separate models for fast responses and heavy reasoning tasks.

<br/>

## ✦ Project Structure

```
whisper-app/
├── electron/                    # Electron main process (Node.js)
│   ├── main.js                  # Window management, IPC, global shortcuts
│   ├── preload.cjs              # Context bridge (renderer ↔ main)
│   └── ai/
│       ├── llm.js               # Ollama streaming, intent router, tool routing
│       ├── tools.js             # Tool schemas & execution handlers
│       ├── ollamaManager.js     # Auto-start Ollama if not running
│       ├── health.js            # Background system health monitor
│       ├── mediaDetector.js     # Spotify / media detection via PowerShell
│       └── webScraper.js        # DuckDuckGo + Wikipedia search engine
│
└── src/                         # React frontend (Vite + TypeScript)
    ├── App.tsx                  # Dynamic Island overlay UI
    ├── MainApp.tsx              # Full chat application window
    ├── Settings.tsx             # Settings panel
    ├── main.tsx                 # Entry point — routes by ?mode= query param
    └── components/
        ├── MarkdownRenderer.tsx # Markdown + LaTeX rendering
        └── pills/               # Widget components
            ├── index.tsx        # Pill registry — single source of truth
            ├── PillLayout.tsx   # Shared layout wrapper
            └── *.tsx            # Individual widget components
```

<br/>

## ✦ Contributing

Contributions are very welcome! Whispr is young and there's a lot of ground to cover.

### How to contribute

1. **Fork** the repo and create a branch: `git checkout -b feat/my-feature`
2. Make your changes
3. **Test** with `npm run electron:dev`
4. Open a **pull request** — describe what you changed and why

### Good first issues

Look for issues tagged [`good first issue`](https://github.com/Krshs90/Whispr/issues?q=is%3Aissue+label%3A%22good+first+issue%22) — these are self-contained and well-documented.

### Adding a new widget

1. Create your pill component in `src/components/pills/YourPill.tsx`
2. Export a meta object:
   ```tsx
   export const yourPillMeta = {
     name: 'Your Widget',
     height: 200,
     keywords: ['keyword1', 'keyword2']
   };
   ```
3. Register it in `src/components/pills/index.tsx`
4. Add a render case in `MainApp.tsx → renderPill()`
5. *(Optional)* Add a tool schema in `electron/ai/tools.js` for live data
6. *(Optional)* Add intent keywords to `DIRECT_WIDGET_MAP` in `electron/ai/llm.js`

### Key rules for contributors

- **Run `npm run electron:dev`** — never run Vite and Electron separately or you'll leave orphan processes
- **Port 5173 is hardcoded** — Electron's main process points to `localhost:5173`. The `strictPort: true` config ensures Vite stays there
- **Both windows share state** — the overlay and main app are separate `BrowserWindow`s but share the same `localStorage` origin
- **The pill registry is the single source of truth** — every widget must be in `src/components/pills/index.tsx`

<br/>

## ✦ Roadmap

The following are the highest-priority items. PRs for any of these are especially appreciated:

- [ ] 🔌 **Cross-platform media detection** — replace Windows PowerShell with a cross-platform solution
- [ ] 📅 **Calendar integration** — Google Calendar via `.ics` URL or OAuth
- [ ] ✈️ **Flight tracking** — real flight data API (AviationStack, AeroDataBox)
- [ ] 🗺 **Directions widget** — Google Maps or Mapbox integration
- [ ] 🎤 **Voice input** — `whisper.cpp` STT integration
- [ ] 📦 **Production packaging** — `electron-builder` distributable builds
- [ ] 🔄 **Auto-updater** — Electron auto-update for public releases
- [ ] 🧪 **Test suite** — unit tests for intent router and tool execution
- [ ] 🔁 **CI/CD** — GitHub Actions for lint, type-check, and build

<br/>

## ✦ Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | [Electron 41](https://electronjs.org) |
| Frontend | [React 19](https://react.dev) + [TypeScript](https://typescriptlang.org) |
| Build tool | [Vite 8](https://vitejs.dev) |
| Animations | [Framer Motion 12](https://www.framer.com/motion/) |
| AI backend | [Ollama](https://ollama.ai) (local) |
| Math rendering | [KaTeX](https://katex.org) + [remark-math](https://github.com/remarkjs/remark-math) |
| Math engine | [mathjs](https://mathjs.org) |
| Icons | [lucide-react](https://lucide.dev) |

<br/>

## ✦ License

MIT — see [LICENSE](LICENSE) for details.

<br/>

<div align="center">
<sub>Built with ❤️ by <a href="https://github.com/Krshs90">Krshs90</a> · contributions welcome</sub>
</div>
