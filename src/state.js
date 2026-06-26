/**
 * STATE MANAGEMENT
 *
 * Following the pattern from the slides: the state is treated as immutable.
 * Every function here takes the current state and returns a *brand-new*
 * state object — it never mutates the one it was given. Components never
 * change state directly; they ask these functions for the next state.
 */
(function (HM) {
  const { GameStatus, Difficulty, wordToMap } = HM;

  const BEST_KEY = "hangman.bestStreak";

  function loadBestStreak() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function saveBestStreak(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch (e) {
      /* ignore (e.g. private mode) */
    }
  }

  const initialState = {
    // --- the answer ---
    word: "",
    hint: "",
    category: "",
    charMap: {}, // letter -> [positions] in the answer
    wordArr: [], // what is shown on screen ("*" hidden, " " space, or letter)

    // --- progress ---
    enteredCharacters: {}, // every guessed letter
    correctCharacters: {}, // only the correct ones (for green keys)
    charsLeft: 0, // unique letters still hidden
    chancesLeft: Difficulty.MEDIUM.chances,
    maxChances: Difficulty.MEDIUM.chances,
    timer: Difficulty.MEDIUM.timer,
    maxTimer: Difficulty.MEDIUM.timer,
    hintsLeft: Difficulty.MEDIUM.hints,
    maxHints: Difficulty.MEDIUM.hints,

    // --- status ---
    gameStatus: GameStatus.READY,
    wordLoading: false,

    // --- scoring ---
    score: 0,
    streak: 0,
    bestStreak: loadBestStreak(),
    lastGain: 0,

    // --- settings / ui ---
    difficulty: "MEDIUM",
    filterCategory: "All",
    clueShown: false,
    soundOn: true,
  };

  // Choose a difficulty (only meaningful before a game starts).
  function setDifficulty(state, difficulty) {
    const cfg = Difficulty[difficulty] || Difficulty.MEDIUM;
    return {
      ...state,
      difficulty,
      maxChances: cfg.chances,
      chancesLeft: cfg.chances,
      maxTimer: cfg.timer,
      timer: cfg.timer,
      maxHints: cfg.hints,
      hintsLeft: cfg.hints,
    };
  }

  function setFilterCategory(state, filterCategory) {
    return { ...state, filterCategory };
  }

  function toggleClue(state) {
    return { ...state, clueShown: !state.clueShown };
  }

  function toggleSound(state) {
    return { ...state, soundOn: !state.soundOn };
  }

  function setWordLoading(state, wordLoading) {
    return { ...state, wordLoading };
  }

  // Mark the game as actively being played.
  function startGame(state) {
    return { ...state, gameStatus: GameStatus.START };
  }

  /**
   * Begin a fresh round with the chosen word entry.
   * Carries over settings + scoreboard, resets everything round-specific.
   */
  function initializeRound(state, entry) {
    const cfg = Difficulty[state.difficulty] || Difficulty.MEDIUM;
    const word = entry.word.toUpperCase();
    const charMap = wordToMap(word);

    const wordArr = word
      .split("")
      .map((c) => (c === " " ? " " : "*"));

    // Count of UNIQUE letters to reveal (spaces already excluded by wordToMap).
    const charsLeft = Object.keys(charMap).length;

    return {
      ...state,
      word,
      hint: entry.hint,
      category: entry.category,
      charMap,
      wordArr,
      charsLeft,
      enteredCharacters: {},
      correctCharacters: {},
      chancesLeft: cfg.chances,
      maxChances: cfg.chances,
      timer: cfg.timer,
      maxTimer: cfg.timer,
      hintsLeft: cfg.hints,
      maxHints: cfg.hints,
      clueShown: false,
      lastGain: 0,
      gameStatus: GameStatus.START,
    };
  }

  function decreaseTimer(state) {
    return { ...state, timer: state.timer - 1 };
  }

  // Points awarded for a win: harder + faster + fewer hints = more points.
  function computeScore(state) {
    const cfg = Difficulty[state.difficulty] || Difficulty.MEDIUM;
    const hintsUsed = state.maxHints - state.hintsLeft;
    const points =
      cfg.basePoints +
      state.chancesLeft * 5 +
      Math.floor(state.timer / 5) -
      hintsUsed * 5;
    return Math.max(cfg.basePoints, points);
  }

  /**
   * The single place that decides whether the game is over.
   * Only finalizes once, when transitioning out of START.
   */
  function checkGameStatus(state) {
    if (state.gameStatus !== GameStatus.START) return state;

    if (state.charsLeft === 0) {
      const lastGain = computeScore(state);
      const streak = state.streak + 1;
      const bestStreak = Math.max(state.bestStreak, streak);
      saveBestStreak(bestStreak);
      return {
        ...state,
        gameStatus: GameStatus.WIN,
        score: state.score + lastGain,
        lastGain,
        streak,
        bestStreak,
      };
    }

    if (state.chancesLeft === 0 || state.timer <= 0) {
      return { ...state, gameStatus: GameStatus.LOSE, streak: 0, lastGain: 0 };
    }

    return state;
  }

  /**
   * Apply a guessed letter. Updates the counters only — whether the game has
   * ended is decided afterwards by checkGameStatus (keeps logic in one place).
   */
  function selectCharacter(state, enteredCharacter) {
    if (state.enteredCharacters[enteredCharacter]) return state;

    const enteredCharacters = {
      ...state.enteredCharacters,
      [enteredCharacter]: true,
    };

    // Wrong guess -> lose a chance.
    if (!state.charMap[enteredCharacter]) {
      return {
        ...state,
        enteredCharacters,
        chancesLeft: state.chancesLeft - 1,
      };
    }

    // Correct guess -> reveal every position of that letter.
    const wordArr = [...state.wordArr];
    state.charMap[enteredCharacter].forEach((i) => {
      wordArr[i] = enteredCharacter;
    });

    return {
      ...state,
      enteredCharacters,
      correctCharacters: {
        ...state.correctCharacters,
        [enteredCharacter]: true,
      },
      wordArr,
      charsLeft: state.charsLeft - 1,
    };
  }

  /**
   * Use a hint: reveal one random hidden letter for free.
   * Limited by `hintsLeft`.
   */
  function useHint(state) {
    if (state.gameStatus !== GameStatus.START || state.hintsLeft <= 0) {
      return state;
    }

    const candidates = Object.keys(state.charMap).filter(
      (c) => !state.enteredCharacters[c]
    );
    if (candidates.length === 0) return state;

    const c = candidates[Math.floor(Math.random() * candidates.length)];
    const revealed = selectCharacter(state, c);
    return { ...revealed, hintsLeft: state.hintsLeft - 1 };
  }

  HM.initialState = initialState;
  HM.setDifficulty = setDifficulty;
  HM.setFilterCategory = setFilterCategory;
  HM.toggleClue = toggleClue;
  HM.toggleSound = toggleSound;
  HM.setWordLoading = setWordLoading;
  HM.startGame = startGame;
  HM.initializeRound = initializeRound;
  HM.decreaseTimer = decreaseTimer;
  HM.checkGameStatus = checkGameStatus;
  HM.selectCharacter = selectCharacter;
  HM.useHint = useHint;
})(window.HM);
