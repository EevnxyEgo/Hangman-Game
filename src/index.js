/**
 * Entry point. Starts the App once the DOM is ready.
 */
(function (HM) {
  function run() {
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", HM.App);
    } else {
      HM.App();
    }
  }
  run();
})(window.HM);
