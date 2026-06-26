/**
 * Tiny DOM helpers shared across components.
 *
 * Everything attaches to the single global namespace `window.HM` so the
 * files can talk to each other without an ES-module bundler.
 */
window.HM = window.HM || {};

(function (HM) {
  // create an element, optionally with a class name and text
  function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.innerText = text;
    return el;
  }

  // get an element by id
  function id(value) {
    return document.getElementById(value);
  }

  // attach a click handler and return the element (handy for chaining)
  function onClick(el, handler) {
    el.addEventListener("click", handler);
    return el;
  }

  HM.h = h;
  HM.id = id;
  HM.onClick = onClick;
})(window.HM);
