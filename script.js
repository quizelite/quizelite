(function () {
  "use strict";

  var QUESTIONS_PER_QUIZ = 10;

  var startScreen = document.getElementById("start-screen");
  var quizScreen = document.getElementById("quiz-screen");
  var resultsScreen = document.getElementById("results-screen");

  var categorySelect = document.getElementById("category-select");
  var diffButtons = Array.prototype.slice.call(
    document.querySelectorAll(".diff-btn")
  );
  var countInfo = document.getElementById("question-count-info");
  var startBtn = document.getElementById("start-btn");
  var chipIcons = Array.prototype.slice.call(
    document.querySelectorAll(".chip-icon")
  );

  var quizCategory = document.getElementById("quiz-category");
  var quizProgress = document.getElementById("quiz-progress");
  var quizScoreEl = document.getElementById("quiz-score");
  var progressFill = document.getElementById("progress-fill");
  var questionText = document.getElementById("question-text");
  var answersEl = document.getElementById("answers");
  var feedback = document.getElementById("feedback");
  var nextBtn = document.getElementById("next-btn");

  var statScore = document.getElementById("stat-score");
  var statCorrect = document.getElementById("stat-correct");
  var statPercent = document.getElementById("stat-percent");
  var resultTitle = document.getElementById("result-title");
  var resultMessage = document.getElementById("result-message");
  var resultEmoji = document.getElementById("result-emoji");

  var state = {
    category: "all",
    difficulty: "easy",
    queue: [],
    index: 0,
    score: 0,
    correctCount: 0,
    answered: false,
  };

  var shareText = "";

  var BEST_KEY = "quizelite-best";

  function bestKey() {
    return state.category + "|" + state.difficulty;
  }

  function getBests() {
    try {
      return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function getBest() {
    return getBests()[bestKey()] || 0;
  }

  function saveBestIfRecord(score) {
    if (score <= 0) return false;
    var bests = getBests();
    if (score > (bests[bestKey()] || 0)) {
      bests[bestKey()] = score;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(bests)); } catch (e) {}
      return true;
    }
    return false;
  }

  function updateBestInfo() {
    var el = document.getElementById("best-score-info");
    if (!el) return;
    var best = getBest();
    if (best <= 0) {
      el.textContent = "";
    } else {
      var label =
        (state.category === "all" ? "Mixed" : state.category) +
        " · " +
        state.difficulty;
      el.textContent = "🏆 Your best: " + best + " pts (" + label + ")";
    }
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function getCategories() {
    var seen = {};
    var cats = [];
    QUESTIONS.forEach(function (q) {
      if (!seen[q.category]) {
        seen[q.category] = true;
        cats.push(q.category);
      }
    });
    return cats;
  }

  function populateCategories() {
    var optionAll = document.createElement("option");
    optionAll.value = "all";
    optionAll.textContent = "🎲 Mixed (all categories)";
    categorySelect.appendChild(optionAll);

    getCategories().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      categorySelect.appendChild(opt);
    });

    updateCountInfo();
  }

  function availableQuestions() {
    return QUESTIONS.filter(function (q) {
      var catOk =
        state.category === "all" || q.category === state.category;
      var diffOk =
        state.difficulty === "mixed" || q.difficulty === state.difficulty;
      return catOk && diffOk;
    });
  }

  function updateCountInfo() {
    var n = availableQuestions().length;
    if (n === 0) {
      countInfo.textContent =
        "No questions available for this combination — try another difficulty.";
      startBtn.disabled = true;
    } else {
      countInfo.textContent =
        n + " questions available · " + Math.min(QUESTIONS_PER_QUIZ, n) + " will be picked.";
      startBtn.disabled = false;
    }
    syncChipSelection();
    updateBestInfo();
  }

  function syncChipSelection() {
    chipIcons.forEach(function (chip) {
      if (chip.dataset.category === state.category) {
        chip.classList.add("selected");
      } else {
        chip.classList.remove("selected");
      }
    });
  }

  function show(screen) {
    [startScreen, quizScreen, resultsScreen].forEach(function (s) {
      s.classList.add("hidden");
    });
    screen.classList.remove("hidden");
  }

  function startQuiz() {
    var pool = availableQuestions();
    if (pool.length === 0) return;

    state.queue = shuffle(pool).slice(0, QUESTIONS_PER_QUIZ);
    state.index = 0;
    state.score = 0;
    state.correctCount = 0;

    quizCategory.textContent =
      (state.category === "all" ? "Mixed" : state.category) +
      " · " +
      state.difficulty;

    show(quizScreen);
    renderQuestion();
  }

  function renderQuestion() {
    var q = state.queue[state.index];
    state.answered = false;

    quizProgress.textContent = "Question " + (state.index + 1) + "/" + state.queue.length;
    quizScoreEl.textContent = "Score: " + state.score;
    progressFill.style.width = (state.index / state.queue.length) * 100 + "%";

    questionText.textContent = q.question;

    var keys = ["A", "B", "C", "D"];
    answersEl.innerHTML = "";
    feedback.classList.add("hidden");
    nextBtn.classList.add("hidden");

    q.answers.forEach(function (text, i) {
      var btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.innerHTML =
        '<span class="key">' + keys[i] + "</span><span>" + text + "</span>";
      btn.addEventListener("click", function () {
        answer(i, btn);
      });
      answersEl.appendChild(btn);
    });
  }

  function answer(choiceIndex, btn) {
    if (state.answered) return;
    state.answered = true;

    var q = state.queue[state.index];
    var buttons = answersEl.querySelectorAll(".answer-btn");
    buttons.forEach(function (b) {
      b.disabled = true;
    });

    var isCorrect = choiceIndex === q.correct;
    if (isCorrect) {
      state.score += q.difficulty === "hard" ? 15 : q.difficulty === "medium" ? 10 : 5;
      state.correctCount++;
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
      buttons[q.correct].classList.add("correct");
    }

    quizScoreEl.textContent = "Score: " + state.score;

    feedback.className = "feedback " + (isCorrect ? "ok" : "no");
    feedback.textContent = isCorrect
      ? "✅ Correct!"
      : "❌ Wrong — the correct answer is: " + q.answers[q.correct];

    if (q.explain) {
      var explainEl = document.createElement("p");
      explainEl.className = "feedback-explain";
      explainEl.textContent = "💡 " + q.explain;
      feedback.appendChild(explainEl);
    }

    feedback.classList.remove("hidden");

    nextBtn.textContent =
      state.index === state.queue.length - 1 ? "See Results →" : "Next Question →";
    nextBtn.classList.remove("hidden");
  }

  function next() {
    state.index++;
    if (state.index >= state.queue.length) {
      showResults();
    } else {
      renderQuestion();
    }
  }

  function showResults() {
    var total = state.queue.length;
    var percent = Math.round((state.correctCount / total) * 100);
    var isRecord = saveBestIfRecord(state.score);

    progressFill.style.width = "100%";

    statScore.textContent = state.score;
    statCorrect.textContent = state.correctCount + "/" + total;
    statPercent.textContent = percent + "%";

    var tier;
    if (percent >= 90) {
      resultEmoji.textContent = "🏆";
      tier = "Hardware Master!";
      resultTitle.textContent = tier;
      resultMessage.textContent =
        "Outstanding! You know PC hardware like a pro builder.";
    } else if (percent >= 70) {
      resultEmoji.textContent = "🎯";
      tier = "Great job!";
      resultTitle.textContent = tier;
      resultMessage.textContent =
        "Solid knowledge. A few more rounds and you'll be an expert.";
    } else if (percent >= 40) {
      resultEmoji.textContent = "💪";
      tier = "Not bad!";
      resultTitle.textContent = tier;
      resultMessage.textContent =
        "You know the basics. Keep practicing to level up.";
    } else {
      resultEmoji.textContent = "📚";
      tier = "Time to study!";
      resultTitle.textContent = tier;
      resultMessage.textContent =
        "Everyone starts somewhere. Read up and try again!";
    }

    if (isRecord) {
      resultMessage.textContent += " 🎉 New personal best!";
    }
    shareText =
      "I scored " +
      percent +
      "% (" +
      state.score +
      " pts) — " +
      tier +
      " Can you beat me?";

    show(resultsScreen);
  }

  // Events
  document.getElementById("start-btn").addEventListener("click", startQuiz);
  nextBtn.addEventListener("click", next);
  document
    .getElementById("retry-btn")
    .addEventListener("click", startQuiz);
  document.getElementById("home-btn").addEventListener("click", function () {
    updateBestInfo();
    show(startScreen);
  });

  document.getElementById("share-btn").addEventListener("click", function () {
    var btn = this;
    var url = "https://quizelite.github.io/quizelite/";
    var full = shareText + " " + url;
    if (navigator.share) {
      navigator.share({ title: "QuizElite", text: shareText, url: url })
        .catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(full).then(function () {
        btn.textContent = "Copied! ✓";
        setTimeout(function () {
          btn.textContent = "Share Result 🔗";
        }, 1600);
      });
    }
  });

  diffButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      diffButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      state.difficulty = btn.dataset.difficulty;
      updateCountInfo();
    });
  });

  categorySelect.addEventListener("change", function () {
    state.category = categorySelect.value;
    updateCountInfo();
  });

  // Category icon chips: click selects the category
  chipIcons.forEach(function (chip) {
    chip.addEventListener("click", function () {
      categorySelect.value = chip.dataset.category;
      state.category = chip.dataset.category;
      updateCountInfo();
    });
  });

  // Keyboard controls
  document.addEventListener("keydown", function (e) {
    var quizVisible = !quizScreen.classList.contains("hidden");
    var resultsVisible = !resultsScreen.classList.contains("hidden");

    if (quizVisible && !state.answered) {
      var keyMap = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      var idx = keyMap[e.key.toLowerCase()];
      if (idx !== undefined) {
        var btns = answersEl.querySelectorAll(".answer-btn:not(:disabled)");
        if (btns[idx]) btns[idx].click();
        return;
      }
    }

    if (quizVisible && state.answered) {
      if (e.key === "Enter" || e.key.toLowerCase() === "n" || e.key === " ") {
        e.preventDefault();
        next();
      }
      return;
    }

    if (resultsVisible && e.key.toLowerCase() === "r") {
      startQuiz();
    }
  });

  // Logo "QuizElite": back to the quiz start screen (same page, no reload)
  document.querySelector(".logo").addEventListener("click", function (e) {
    e.preventDefault();
    show(startScreen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Robot mascot: wave on click
  document.querySelectorAll(".mascot").forEach(function (mascot) {
    mascot.addEventListener("click", function () {
      if (mascot.classList.contains("waving")) return;
      var svg = mascot.querySelector(".robot-svg");
      mascot.classList.add("waving");
      svg.classList.add("waving");
      setTimeout(function () {
        mascot.classList.remove("waving");
        svg.classList.remove("waving");
      }, 1000);
    });
  });

  // Liquid ripple on click for buttons and answers
  document.addEventListener("pointerdown", function (e) {
    var btn = e.target.closest(".btn, .diff-btn, .answer-btn, .chip-icon");
    if (!btn) return;
    var r = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - r.left - size / 2) + "px";
    ripple.style.top = (e.clientY - r.top - size / 2) + "px";
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", function () {
      ripple.remove();
    });
  });

  // Init
  // Place the correct answer at a random position in each question (once at startup)
  QUESTIONS.forEach(function (q) {
    var pos = Math.floor(Math.random() * 4);
    var correctText = q.answers[q.correct];
    q.answers.splice(q.correct, 1);
    q.answers.splice(pos, 0, correctText);
    q.correct = pos;
  });

  populateCategories();
  document.getElementById("year").textContent = new Date().getFullYear();
})();
