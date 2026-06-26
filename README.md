# 🎯 Hangman (행맨)

A polished, browser-based Hangman game built with **vanilla HTML, CSS, and
JavaScript** — no frameworks and **no build step**. Just open `index.html`.

**▶️ Live demo: https://hangman-game-beige-six.vercel.app**

The code follows a small **State → Component → Game-Logic** architecture
(immutable state, pure update functions, and render-only components), the
same pattern taught in the accompanying course material.

## ✨ Features

- **Hint system** — reveal a hidden letter (limited uses per difficulty).
- **Clue toggle** — show the word's definition; the category is always shown.
- **Difficulty levels** — Easy / Medium / Hard adjust word length, chances,
  timer, and number of hints.
- **Categories** — Animals, Countries, Food, Technology, Nature, Sports.
- **Offline word bank** — words ship with their own clues; no network needed.
- **Score & streak** — best streak is persisted in `localStorage`.
- **Physical keyboard support** — type letters; press `Enter` to (re)start.
- **Sound effects** — synthesized via the Web Audio API, with a mute toggle.
- **Animated UI** — letter pop-in, shake on a wrong guess, win confetti, and a
  win/lose modal that reveals the answer.
- **Responsive** — adapts from desktop to mobile.

## 🚀 Getting started

The game is fully static.

**Option A — open directly**

Double-click `index.html`.

**Option B — local server** (recommended for consistent asset loading)

```bash
python -m http.server 8123
# then open http://localhost:8123
```

## ☁️ Deployment

The site is deployed as a static project on **Vercel** — there is no build
step, so Vercel simply serves the files from the repository root.

- **Production:** https://hangman-game-beige-six.vercel.app

To redeploy from the command line:

```bash
vercel deploy --prod
```

## 🎮 How to play

1. Pick a difficulty and category, then press **Start**.
2. Guess the hidden word one letter at a time (mouse or keyboard).
3. Correct letters are revealed; wrong guesses build the hangman and cost a ❤.
4. Win by revealing every letter before the chances or the timer run out.

## 🗂️ Project structure

```
index.html            # Markup + ordered <script> tags (no bundler)
src/
├── index.css         # Theme variables, page layout, background
├── app.css           # Component styles and animations
├── dom.js            # Tiny DOM helpers (window.HM namespace)
├── util.js           # GameStatus, difficulty config, pure helpers
├── words.js          # Word bank with categories and clues
├── image-util.js     # Loads & positions the hangman artwork on canvas
├── sound.js          # Web Audio sound effects
├── state.js          # Immutable state + pure update functions
├── components.js     # Render functions for each piece of UI
├── app.js            # Controller: owns state, timer, and input handlers
├── index.js          # Entry point
└── assets/           # Hangman body-part images
```

## 🏗️ Architecture

- **State** is treated as immutable. Every updater in `state.js` returns a new
  object instead of mutating the current one.
- **Components** in `components.js` only read state and render; they never
  change it. They emit "requests" through handler callbacks.
- **`app.js`** is the only place that holds the live state and the timer, and
  it is the only code that decides *how* the state changes.

## 🛠️ Tech

Vanilla JavaScript (ES2015+), Canvas 2D, Web Audio API, CSS animations.

---

Built as part of the **KADA Batch 4 — Advanced HTML, CSS, JavaScript** course.
