// QuizElite — theme toggle (light/dark) with persistence
(function () {
  "use strict";

  var root = document.documentElement;
  var KEY = "quizelite-theme";

  function iconFor(theme) {
    return theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.textContent = iconFor(theme);
      b.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
      b.classList.remove("spin");
      void b.offsetWidth;
      b.classList.add("spin");
    });
  }

  // Initial theme: saved preference -> system preference -> light
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var initial =
    saved ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  apply(initial);

  function bindMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var menu = document.getElementById("dropdown-menu");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function init() {
    bindButtons();
    bindMenu();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
