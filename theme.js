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

  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
    });
  });
})();
