/**
 * Local word bank.
 *
 * Each entry has a { word, hint, category }. Keeping the words local (instead
 * of fetching from an external API) means the game works offline AND lets us
 * power the "clue" feature, since every word ships with its own hint.
 *
 * Difficulty is derived from the number of letters (spaces ignored):
 *   Easy 3-5 · Medium 6-8 · Hard 9+
 */
(function (HM) {
  const WORDS = [
    // ---- Animals ----
    { word: "CAT", hint: "A common house pet that purrs.", category: "Animals" },
    { word: "FOX", hint: "A clever wild canine.", category: "Animals" },
    { word: "HORSE", hint: "You can ride this animal.", category: "Animals" },
    { word: "TIGER", hint: "A big striped cat.", category: "Animals" },
    { word: "DOLPHIN", hint: "A smart marine mammal.", category: "Animals" },
    { word: "PENGUIN", hint: "A bird that swims but cannot fly.", category: "Animals" },
    { word: "GIRAFFE", hint: "The tallest land animal.", category: "Animals" },
    { word: "ELEPHANT", hint: "Largest land animal, has a trunk.", category: "Animals" },
    { word: "POLAR BEAR", hint: "A white bear of the Arctic.", category: "Animals" },
    { word: "CHIMPANZEE", hint: "A highly intelligent great ape.", category: "Animals" },
    { word: "RHINOCEROS", hint: "A large animal with a horn on its nose.", category: "Animals" },

    // ---- Countries ----
    { word: "PERU", hint: "South American home of Machu Picchu.", category: "Countries" },
    { word: "CHINA", hint: "The most populous Asian country.", category: "Countries" },
    { word: "EGYPT", hint: "Land of the ancient pyramids.", category: "Countries" },
    { word: "BRAZIL", hint: "Largest country in South America.", category: "Countries" },
    { word: "CANADA", hint: "Famous for maple syrup.", category: "Countries" },
    { word: "FRANCE", hint: "Home of the Eiffel Tower.", category: "Countries" },
    { word: "GERMANY", hint: "European country famous for its cars.", category: "Countries" },
    { word: "THAILAND", hint: "Southeast Asian land of smiles.", category: "Countries" },
    { word: "SOUTH KOREA", hint: "Asian country, the home of K-pop.", category: "Countries" },
    { word: "ARGENTINA", hint: "South American country famous for tango.", category: "Countries" },
    { word: "SWITZERLAND", hint: "Alpine land of chocolate and watches.", category: "Countries" },

    // ---- Food ----
    { word: "EGG", hint: "Chickens lay these.", category: "Food" },
    { word: "RICE", hint: "A staple grain across Asia.", category: "Food" },
    { word: "BREAD", hint: "Baked from flour and water.", category: "Food" },
    { word: "PIZZA", hint: "Italian dish with cheese and toppings.", category: "Food" },
    { word: "BURGER", hint: "A patty served in a bun.", category: "Food" },
    { word: "NOODLE", hint: "Long strands you slurp.", category: "Food" },
    { word: "PANCAKE", hint: "Flat breakfast cake with syrup.", category: "Food" },
    { word: "ICE CREAM", hint: "A frozen sweet dessert.", category: "Food" },
    { word: "CHOCOLATE", hint: "Sweet treat made from cocoa.", category: "Food" },
    { word: "WATERMELON", hint: "A big green fruit, red inside.", category: "Food" },

    // ---- Technology ----
    { word: "WIFI", hint: "Wireless internet.", category: "Technology" },
    { word: "CODE", hint: "Instructions for a computer.", category: "Technology" },
    { word: "MOUSE", hint: "You click with it.", category: "Technology" },
    { word: "LAPTOP", hint: "A portable computer.", category: "Technology" },
    { word: "BROWSER", hint: "Software used to surf the web.", category: "Technology" },
    { word: "KEYBOARD", hint: "You type on it.", category: "Technology" },
    { word: "INTERNET", hint: "The global network.", category: "Technology" },
    { word: "ALGORITHM", hint: "A step-by-step problem-solving procedure.", category: "Technology" },
    { word: "JAVASCRIPT", hint: "A popular web programming language.", category: "Technology" },
    { word: "SMARTPHONE", hint: "A handheld device for calls and apps.", category: "Technology" },

    // ---- Nature ----
    { word: "SUN", hint: "The star at the center of our system.", category: "Nature" },
    { word: "RAIN", hint: "Water falling from the clouds.", category: "Nature" },
    { word: "RIVER", hint: "A flowing body of water.", category: "Nature" },
    { word: "OCEAN", hint: "A vast body of salt water.", category: "Nature" },
    { word: "FOREST", hint: "A large area covered with trees.", category: "Nature" },
    { word: "DESERT", hint: "A dry, sandy region.", category: "Nature" },
    { word: "VOLCANO", hint: "A mountain that can erupt.", category: "Nature" },
    { word: "RAINBOW", hint: "A colorful arc after the rain.", category: "Nature" },
    { word: "MOUNTAIN", hint: "A tall natural elevation of land.", category: "Nature" },
    { word: "WATERFALL", hint: "Water cascading off a cliff.", category: "Nature" },

    // ---- Sports ----
    { word: "GOLF", hint: "Played with clubs and a small ball.", category: "Sports" },
    { word: "JUDO", hint: "A Japanese martial art.", category: "Sports" },
    { word: "TENNIS", hint: "Played with rackets over a net.", category: "Sports" },
    { word: "SOCCER", hint: "Kick the ball into the goal.", category: "Sports" },
    { word: "BOXING", hint: "A combat sport with gloves.", category: "Sports" },
    { word: "CRICKET", hint: "Bat-and-ball sport popular in India.", category: "Sports" },
    { word: "SWIMMING", hint: "A water sport done in a pool.", category: "Sports" },
    { word: "BADMINTON", hint: "Played with a shuttlecock.", category: "Sports" },
    { word: "BASKETBALL", hint: "Shoot hoops in this sport.", category: "Sports" },
    { word: "VOLLEYBALL", hint: "Hit the ball over a high net.", category: "Sports" },
  ];

  // All categories, with "All" first, for the category selector.
  function categories() {
    const set = [];
    WORDS.forEach((w) => {
      if (!set.includes(w.category)) set.push(w.category);
    });
    return ["All", ...set];
  }

  /**
   * Pick a random word for the given difficulty + category filter.
   * Falls back gracefully so we always return *something*:
   *   exact match -> ignore category -> ignore difficulty.
   */
  function pickWord(difficulty, filterCategory) {
    const cfg = HM.Difficulty[difficulty] || HM.Difficulty.MEDIUM;

    const inBand = (w) => {
      const len = HM.letterCount(w.word);
      return len >= cfg.minLen && len <= cfg.maxLen;
    };
    const inCategory = (w) =>
      !filterCategory || filterCategory === "All" || w.category === filterCategory;

    let pool = WORDS.filter((w) => inBand(w) && inCategory(w));
    if (pool.length === 0) pool = WORDS.filter(inBand); // relax category
    if (pool.length === 0) pool = WORDS.filter(inCategory); // relax difficulty
    if (pool.length === 0) pool = WORDS;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  HM.WORDS = WORDS;
  HM.categories = categories;
  HM.pickWord = pickWord;
})(window.HM);
