---
name: Pull Request
about: Checklist for submitting a pull request
---

## What does this PR do?

<!-- A clear description of the change -->

## Type

- [ ] 🐛 Bug fix
- [ ] ✨ New feature / widget
- [ ] ♻️ Refactor / improvement
- [ ] 📝 Documentation
- [ ] 🔧 Chore / tooling / CI

## How was it tested?

<!-- e.g. "Tested on Windows 11 with llama3.2. Verified widget appears in overlay and main app chat." -->

## Screenshots / recordings

<!-- If UI changes are involved, attach a screenshot or screen recording -->

## Checklist

- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes (no lint errors)  
- [ ] `npm run electron:dev` starts without errors
- [ ] Change tested end-to-end in the running app
- [ ] New widget registered in `src/components/pills/index.tsx` (if applicable)
- [ ] New tool added to `ALLOWED_TOOLS` in `electron/main.js` (if applicable)
- [ ] No hardcoded API keys, tokens, or personal information
- [ ] No private files committed (`README_PRIVATE.md`, `TODO.md`, `IDEAS.md`)
- [ ] Follows [commit convention](CONTRIBUTING.md#commit-convention)
