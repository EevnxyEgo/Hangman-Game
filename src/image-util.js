/**
 * Loads and positions the hangman body-part images on the canvas.
 *
 * (Originally these were webpack `import`ed PNGs. With no bundler we just
 * reference them by URL relative to index.html.)
 *
 * The parts are listed in REVEAL ORDER: the gallows appears on the first
 * wrong guess, then head, body, arms and legs are added one by one until
 * the figure is complete.
 */
(function (HM) {
  const BASE = "./src/assets/";

  // The order here is the order parts are drawn as the player loses chances.
  const imageData = [
    { name: "gallows", url: BASE + "gallows.png", dx: 10, dy: 20 },
    { name: "head", url: BASE + "head.png", dx: 190, dy: 60 },
    { name: "body", url: BASE + "body.png", dx: 185, dy: 180 },
    { name: "left-arm", url: BASE + "left-arm.png", dx: 135, dy: 200 },
    { name: "right-arm", url: BASE + "right-arm.png", dx: 240, dy: 200 },
    { name: "left-leg", url: BASE + "left-leg.png", dx: 193, dy: 290 },
    { name: "right-leg", url: BASE + "right-leg.png", dx: 242, dy: 290 },
  ];

  function calculateImageSize(width, height, percent) {
    const ratio = percent / 100;
    return [width * ratio, height * ratio];
  }

  function loadImage(item) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = item.url;
      image.addEventListener("load", () =>
        resolve({ image, name: item.name, dx: item.dx, dy: item.dy })
      );
      image.addEventListener("error", () =>
        reject(new Error(`Error loading ${item.url}`))
      );
    });
  }

  function fetchAllImages() {
    return Promise.all(imageData.map(loadImage));
  }

  HM.calculateImageSize = calculateImageSize;
  HM.fetchAllImages = fetchAllImages;
  HM.TOTAL_PARTS = imageData.length;
})(window.HM);
