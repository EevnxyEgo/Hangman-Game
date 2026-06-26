/**
 * APP (the game logic / controller)
 *
 * Owns the single `state` value and the timer. Whenever something needs to
 * change, it routes the request through `changeState`, which produces the
 * next immutable state and re-renders the components.
 */
(function (HM) {
  const {
    initialState,
    render,
    fetchAllImages,
    pickWord,
    GameStatus,
    isGameActive,
    // state updaters
    startGame,
    initializeRound,
    decreaseTimer,
    selectCharacter,
    checkGameStatus,
    useHint,
    setDifficulty,
    setFilterCategory,
    toggleClue,
    toggleSound,
    Sound,
  } = HM;

  function App() {
    let state = { ...initialState };
    let imageSources = null;
    let timerId = null;

    function changeState(callback) {
      state = callback(state);
      render(state, handlers, imageSources);
    }

    /* ------------------------------- timer ------------------------------- */

    function stopTimer() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function startTimer() {
      stopTimer(); // never run two timers at once
      timerId = setInterval(() => {
        if (!isGameActive(state.gameStatus)) {
          stopTimer();
          return;
        }
        changeState((s) => checkGameStatus(decreaseTimer(s)));
        if (state.gameStatus === GameStatus.LOSE) {
          stopTimer();
          Sound.play("lose");
        }
      }, 1000);
    }

    /* ------------------------------ handlers ----------------------------- */

    function onClickStart() {
      stopTimer();
      const entry = pickWord(state.difficulty, state.filterCategory);
      changeState((s) => startGame(initializeRound(s, entry)));
      startTimer();
      Sound.play("start");
    }

    function onClickItem(c) {
      if (!isGameActive(state.gameStatus)) return;
      if (state.enteredCharacters[c]) return;

      const wasCorrect = !!state.charMap[c];
      changeState((s) => checkGameStatus(selectCharacter(s, c)));

      if (state.gameStatus === GameStatus.WIN) {
        stopTimer();
        Sound.play("win");
      } else if (state.gameStatus === GameStatus.LOSE) {
        stopTimer();
        Sound.play("lose");
      } else {
        Sound.play(wasCorrect ? "correct" : "wrong");
      }
    }

    function onClickHint() {
      if (!isGameActive(state.gameStatus) || state.hintsLeft <= 0) return;
      changeState((s) => checkGameStatus(useHint(s)));
      if (state.gameStatus === GameStatus.WIN) {
        stopTimer();
        Sound.play("win");
      } else {
        Sound.play("hint");
      }
    }

    function onToggleClue() {
      changeState(toggleClue);
      Sound.play("click");
    }

    function onToggleSound() {
      changeState(toggleSound);
      // Use the new value so toggling ON gives audible feedback.
      Sound.setEnabled(state.soundOn);
      if (state.soundOn) Sound.play("click");
    }

    function onSetDifficulty(key) {
      if (isGameActive(state.gameStatus)) return;
      changeState((s) => setDifficulty(s, key));
      Sound.play("click");
    }

    function onSetCategory(category) {
      changeState((s) => setFilterCategory(s, category));
    }

    const handlers = {
      onClickStart,
      onClickItem,
      onClickHint,
      onToggleClue,
      onToggleSound,
      onSetDifficulty,
      onSetCategory,
    };

    /* ------------------------ physical keyboard -------------------------- */

    window.addEventListener("keydown", (e) => {
      const key = e.key.toUpperCase();
      if (key.length === 1 && key >= "A" && key <= "Z") {
        onClickItem(key);
      } else if (e.key === "Enter" && !isGameActive(state.gameStatus)) {
        onClickStart();
      }
    });

    /* --------------------------- initialize ------------------------------ */

    function initializeData() {
      return fetchAllImages()
        .then((images) => {
          imageSources = images;
        })
        .catch((err) => {
          // The game still works without the artwork.
          console.warn("Hangman images failed to load:", err);
          imageSources = [];
        });
    }

    initializeData().then(() => render(state, handlers, imageSources));
  }

  HM.App = App;
})(window.HM);
