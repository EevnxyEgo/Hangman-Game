/**
 * COMPONENTS
 *
 * Each component is a function that reads the (immutable) state and renders
 * one slice of the UI into its container. Components never change state —
 * they only emit "requests" through the handler callbacks passed to render().
 */
(function (HM) {
  const {
    h,
    id,
    onClick,
    GameStatus,
    Difficulty,
    isGameActive,
    isGameEnded,
    formatTime,
    calculateImageSize,
    TOTAL_PARTS,
    categories,
    Sound,
  } = HM;

  // Module-scoped memory used for diffing / one-shot animations.
  const prev = {
    wordArr: null,
    chances: null,
    status: null,
    parts: 0,
    rafId: null,
  };

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  /* ----------------------------- Hangman canvas ---------------------------- */

  function partsToShow(state) {
    const wrong = state.maxChances - state.chancesLeft;
    if (wrong <= 0) return 0;
    return Math.min(TOTAL_PARTS, Math.ceil((wrong * TOTAL_PARTS) / state.maxChances));
  }

  function drawPart(ctx, part, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      part.image,
      part.dx,
      part.dy,
      ...calculateImageSize(part.image.width, part.image.height, 70)
    );
    ctx.restore();
  }

  function HangmanImage(state, images) {
    const canvas = id("hangman-image");
    if (!canvas || !images) return;
    const ctx = canvas.getContext("2d");

    const count = partsToShow(state);

    if (prev.rafId) {
      cancelAnimationFrame(prev.rafId);
      prev.rafId = null;
    }

    const drawStatic = (n) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < n; i++) drawPart(ctx, images[i], 1);
    };

    // Fade-in only the newly added part (not on timer-only re-renders).
    if (count > prev.parts && count > 0) {
      const start = performance.now();
      const duration = 320;
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < count - 1; i++) drawPart(ctx, images[i], 1);
        drawPart(ctx, images[count - 1], t);
        if (t < 1) prev.rafId = requestAnimationFrame(step);
      };
      prev.rafId = requestAnimationFrame(step);
    } else {
      drawStatic(count);
    }

    prev.parts = count;
  }

  /* -------------------------------- Header -------------------------------- */

  function Header(state, handlers) {
    const container = id("app-header");
    container.innerHTML = "";

    const top = h("div", "header-top");
    top.appendChild(h("div", "brand", "🎯 HANGMAN"));

    const sound = h(
      "button",
      "icon-btn sound-toggle",
      state.soundOn ? "🔊" : "🔇"
    );
    sound.title = state.soundOn ? "Sound on" : "Sound off";
    onClick(sound, handlers.onToggleSound);
    top.appendChild(sound);
    container.appendChild(top);

    const controls = h("div", "header-controls");

    // Difficulty segmented control
    const group = h("div", "difficulty-group");
    ["EASY", "MEDIUM", "HARD"].forEach((key) => {
      const btn = h(
        "button",
        "diff-btn" + (state.difficulty === key ? " active" : ""),
        Difficulty[key].label
      );
      btn.disabled = isGameActive(state.gameStatus);
      onClick(btn, () => handlers.onSetDifficulty(key));
      group.appendChild(btn);
    });
    controls.appendChild(group);

    // Category selector
    const select = h("select", "category-select");
    categories().forEach((cat) => {
      const opt = h("option", null, cat);
      opt.value = cat;
      if (cat === state.filterCategory) opt.selected = true;
      select.appendChild(opt);
    });
    select.disabled = isGameActive(state.gameStatus);
    select.addEventListener("change", (e) => handlers.onSetCategory(e.target.value));
    controls.appendChild(select);

    container.appendChild(controls);
  }

  /* ------------------------------- Stats bar ------------------------------ */

  function StatsBar(state) {
    const container = id("stats-bar");
    container.innerHTML = "";

    // Hearts for remaining chances
    const hearts = h("div", "stat-hearts");
    hearts.title = `${state.chancesLeft} chances left`;
    for (let i = 0; i < state.maxChances; i++) {
      const heart = h("span", "heart" + (i < state.chancesLeft ? "" : " lost"));
      heart.innerText = i < state.chancesLeft ? "♥" : "♡";
      hearts.appendChild(heart);
    }
    container.appendChild(hearts);

    // Timer bar
    const timerWrap = h("div", "stat-timer");
    const bar = h("div", "timer-bar");
    const fill = h("div", "timer-fill");
    const ratio = state.maxTimer ? state.timer / state.maxTimer : 0;
    fill.style.width = `${Math.max(0, ratio) * 100}%`;
    fill.classList.add(ratio > 0.5 ? "ok" : ratio > 0.25 ? "warn" : "danger");
    bar.appendChild(fill);
    timerWrap.appendChild(bar);
    const label = h("div", "timer-label", `⏱ ${formatTime(state.timer)}`);
    timerWrap.appendChild(label);
    container.appendChild(timerWrap);

    // Score / streak / best
    const score = h("div", "stat-score");
    score.innerHTML =
      `<span class="score-num">${state.score}</span> pts` +
      ` · <span class="streak">🔥 ${state.streak}</span>` +
      ` · Best ${state.bestStreak}`;
    container.appendChild(score);
  }

  /* ---------------------------- Category / clue --------------------------- */

  function Clue(state) {
    const container = id("clue");
    container.innerHTML = "";
    if (state.gameStatus === GameStatus.READY) return;

    const badge = h("span", "category-badge", `🏷 ${state.category}`);
    container.appendChild(badge);

    if (state.clueShown && state.hint) {
      container.appendChild(h("span", "clue-text", `💬 ${state.hint}`));
    }
  }

  /* --------------------------------- Word --------------------------------- */

  function Word(state) {
    const container = id("word");
    container.innerHTML = "";

    if (state.gameStatus === GameStatus.READY) {
      container.appendChild(
        h("div", "word-prompt", "Choose a difficulty and press Start!")
      );
      prev.wordArr = null;
      return;
    }

    const wrap = h("div", "word-text");

    state.wordArr.forEach((ch, i) => {
      if (ch === " ") {
        wrap.appendChild(h("span", "space"));
        return;
      }

      const span = h("span", "character");

      if (ch !== "*") {
        // Correctly revealed letter
        span.classList.add("filled");
        span.innerText = ch;
        if (prev.wordArr && prev.wordArr[i] !== ch) span.classList.add("reveal");
      } else if (state.gameStatus === GameStatus.LOSE) {
        // Reveal the missed letters in red after a loss
        span.classList.add("missed");
        span.innerText = state.word[i];
      } else {
        span.innerHTML = "&nbsp;";
      }

      wrap.appendChild(span);
    });

    container.appendChild(wrap);
    prev.wordArr = [...state.wordArr];
  }

  /* ------------------------------- Keyboard ------------------------------- */

  function Keyboard(state, handlers) {
    const container = id("keyboard-layout");
    container.innerHTML = "";

    const ul = h("ul", "keyboard-layout");
    const ended = isGameEnded(state.gameStatus);

    ALPHABET.forEach((c) => {
      const li = h("li");
      const button = h("button", "keyboard-button", c);

      if (state.correctCharacters[c]) button.classList.add("correct");
      else if (state.enteredCharacters[c]) button.classList.add("wrong");

      button.disabled = ended || !!state.enteredCharacters[c];
      onClick(button, () => handlers.onClickItem(c));

      li.appendChild(button);
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }

  /* ------------------------------ Action bar ------------------------------ */

  function ActionBar(state, handlers) {
    const container = id("action-bar");
    container.innerHTML = "";

    const active = isGameActive(state.gameStatus);

    const hint = h("button", "action-btn hint-btn", `💡 Hint (${state.hintsLeft})`);
    hint.disabled = !active || state.hintsLeft <= 0;
    onClick(hint, handlers.onClickHint);
    container.appendChild(hint);

    const clue = h(
      "button",
      "action-btn clue-btn" + (state.clueShown ? " active" : ""),
      "👁 Clue"
    );
    clue.disabled = !active;
    onClick(clue, handlers.onToggleClue);
    container.appendChild(clue);

    let label = "▶ Start Game";
    if (active) label = "↻ Restart";
    else if (isGameEnded(state.gameStatus) && state.gameStatus !== GameStatus.READY)
      label = "▶ Play Again";

    const start = h("button", "action-btn start-button", label);
    start.disabled = state.wordLoading;
    onClick(start, handlers.onClickStart);
    container.appendChild(start);
  }

  /* -------------------------------- Overlay ------------------------------- */

  function Overlay(state, handlers) {
    const container = id("overlay");
    container.innerHTML = "";

    if (state.gameStatus !== GameStatus.WIN && state.gameStatus !== GameStatus.LOSE) {
      container.classList.remove("show");
      return;
    }

    container.classList.add("show");
    const won = state.gameStatus === GameStatus.WIN;

    const card = h("div", "overlay-card " + (won ? "win" : "lose"));
    card.appendChild(h("div", "overlay-emoji", won ? "🎉" : "💀"));
    card.appendChild(h("h2", "overlay-title", won ? "You Won!" : "Game Over"));
    card.appendChild(
      h("p", "overlay-word", `The word was: ${state.word}`)
    );

    if (won) {
      card.appendChild(
        h("p", "overlay-points", `+${state.lastGain} points · 🔥 streak ${state.streak}`)
      );
    } else {
      card.appendChild(h("p", "overlay-points", "Better luck next time!"));
    }

    const again = h("button", "action-btn start-button", "Play Again");
    onClick(again, handlers.onClickStart);
    card.appendChild(again);

    container.appendChild(card);
  }

  /* ------------------------- Effects (shake/confetti) --------------------- */

  function shakeCard() {
    const app = document.querySelector(".app");
    if (!app) return;
    app.classList.remove("shake");
    void app.offsetWidth; // restart the animation
    app.classList.add("shake");
  }

  function burstConfetti() {
    const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#f87171"];
    for (let i = 0; i < 80; i++) {
      const piece = h("div", "confetti");
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      piece.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3200);
    }
  }

  /* -------------------------------- Render -------------------------------- */

  function render(state, handlers, images) {
    Sound.setEnabled(state.soundOn);

    // One-shot effects driven by state transitions.
    if (
      prev.chances != null &&
      state.chancesLeft < prev.chances &&
      isGameActive(state.gameStatus)
    ) {
      shakeCard();
    }
    if (prev.status !== GameStatus.WIN && state.gameStatus === GameStatus.WIN) {
      burstConfetti();
    }

    Header(state, handlers);
    StatsBar(state);
    Clue(state);
    Word(state);
    Keyboard(state, handlers);
    ActionBar(state, handlers);
    HangmanImage(state, images);
    Overlay(state, handlers);

    prev.chances = state.chancesLeft;
    prev.status = state.gameStatus;
  }

  HM.render = render;
})(window.HM);
