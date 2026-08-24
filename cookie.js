// QuizElite — minimal cookie consent banner
(function () {
  "use strict";

  var KEY = "quizelite-cookie-consent";

  function decided() {
    try { return localStorage.getItem(KEY); } catch (e) { return true; }
  }

  function remember(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  if (decided()) return;

  function build() {
    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");

    var text = document.createElement("p");
    text.innerHTML =
      "🍪 We use cookies for essential site functions and — after your consent — " +
      "for advertising through Google AdSense partners. Read our " +
      '<a href="privacy-policy.html">Privacy Policy</a>.';

    var actions = document.createElement("div");
    actions.className = "cookie-actions";

    var decline = document.createElement("button");
    decline.className = "btn btn-secondary cookie-btn";
    decline.type = "button";
    decline.textContent = "Decline";

    var accept = document.createElement("button");
    accept.className = "btn btn-primary cookie-btn";
    accept.type = "button";
    accept.textContent = "Accept";

    accept.addEventListener("click", function () {
      remember("accepted");
      close();
    });
    decline.addEventListener("click", function () {
      remember("declined");
      close();
    });

    function close() {
      banner.classList.add("closing");
      setTimeout(function () {
        banner.remove();
      }, 350);
    }

    actions.appendChild(decline);
    actions.appendChild(accept);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
