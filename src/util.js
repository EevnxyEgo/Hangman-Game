/**
 * Pure helpers + game constants.
 *
 * `GameStatus` is the single source of truth for the game's current
 * condition: READY (before start), START (playing), WIN, or LOSE.
 */
(function (HM) {
  const GameStatus = {
    READY: "READY",
    START: "START",
    LOSE: "LOSE",
    WIN: "WIN",
  };

  // The game is "active" only while playing.
  function isGameActive(gameStatus) {
    return gameStatus === GameStatus.START;
  }

  // The game has "ended" any time it is not actively being played.
  function isGameEnded(gameStatus) {
    return gameStatus !== GameStatus.START;
  }

  /**
   * Per-difficulty configuration.
   *  - chances : number of wrong guesses allowed
   *  - timer   : seconds on the clock
   *  - hints   : free letter reveals available
   *  - minLen / maxLen : word length range (letters only, spaces ignored)
   */
  const Difficulty = {
    EASY: {
      key: "EASY",
      label: "Easy",
      chances: 8,
      timer: 90,
      hints: 3,
      minLen: 3,
      maxLen: 5,
      basePoints: 10,
    },
    MEDIUM: {
      key: "MEDIUM",
      label: "Medium",
      chances: 7,
      timer: 60,
      hints: 2,
      minLen: 6,
      maxLen: 8,
      basePoints: 20,
    },
    HARD: {
      key: "HARD",
      label: "Hard",
      chances: 6,
      timer: 45,
      hints: 1,
      minLen: 9,
      maxLen: 99,
      basePoints: 35,
    },
  };

  // Number of letters in a word, ignoring spaces.
  function letterCount(word) {
    return word.replace(/\s/g, "").length;
  }

  /**
   * Build a map of letter -> [positions] for the answer word.
   * Spaces are intentionally skipped so they never count as guessable.
   */
  function wordToMap(word) {
    return word
      .toUpperCase()
      .split("")
      .reduce((map, c, idx) => {
        if (c === " ") return map;
        if (!map[c]) map[c] = [];
        map[c].push(idx);
        return map;
      }, {});
  }

  // Seconds -> "M:SS"
  function formatTime(seconds) {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  HM.GameStatus = GameStatus;
  HM.Difficulty = Difficulty;
  HM.isGameActive = isGameActive;
  HM.isGameEnded = isGameEnded;
  HM.letterCount = letterCount;
  HM.wordToMap = wordToMap;
  HM.formatTime = formatTime;
})(window.HM);
