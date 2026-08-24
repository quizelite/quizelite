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

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function bindButtons() {
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        try { localStorage.setItem(KEY, next); } catch (e) {}
        apply(next);
      });
    });
  }

  function bindMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var menu = document.getElementById("dropdown-menu");
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("open", open);
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!menu.classList.contains("open"));
    });

    var closeBtn = menu.querySelector(".menu-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }

    document.addEventListener("click", function (e) {
      if (
        menu.classList.contains("open") &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        setOpen(false);
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
