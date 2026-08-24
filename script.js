(function () {
  "use strict";

  var QUESTIONS_PER_QUIZ = 10;
  var TIME_LIMIT = 30;
  var BEST_KEY = "quizelite-best";
  var MUTED_KEY = "quizelite-muted";
  var TIMED_KEY = "quizelite-timed";

  var startScreen = document.getElementById("start-screen");
  var quizScreen = document.getElementById("quiz-screen");
  var passScreen = document.getElementById("pass-screen");
  var resultsScreen = document.getElementById("results-screen");
  var modeButtons = Array.prototype.slice.call(
    document.querySelectorAll(".mode-btn")
  );

  var categorySelect = document.getElementById("category-select");
  var diffButtons = Array.prototype.slice.call(
    document.querySelectorAll(".diff-btn:not(.mode-btn)")
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
  var quizBot = document.getElementById("quiz-bot");
  var streakChip = document.getElementById("streak-chip");
  var quizTimer = document.getElementById("quiz-timer");
  var timerToggle = document.getElementById("timer-toggle");
  var soundToggle = document.getElementById("sound-toggle");

  var statScore = document.getElementById("stat-score");
  var statCorrect = document.getElementById("stat-correct");
  var statPercent = document.getElementById("stat-percent");
  var resultTitle = document.getElementById("result-title");
  var resultMessage = document.getElementById("result-message");
  var resultEmoji = document.getElementById("result-emoji");

  var state = {
    category: "all",
    difficulty: "easy",
    mode: "solo",
    duelPlayer: 1,
    duelQueue: null,
    duelScores: [0, 0],
    duelCorrect: [0, 0],
    queue: [],
    index: 0,
    score: 0,
    correctCount: 0,
    answered: false,
    streak: 0,
    bestStreak: 0,
    timed: false,
    timeLeft: 0,
    timerId: null,
  };

  var shareText = "";

  // ===== Sound engine (WebAudio, no assets) =====
  var audioCtx = null;

  function isMuted() {
    try {
      return localStorage.getItem(MUTED_KEY) === "1";
    } catch (e) {
      return true;
    }
  }

  function ac() {
    if (isMuted()) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function tone(freq, delay, dur, type, vol) {
    var c = ac();
    if (!c) return;
    try {
      var o = c.createOscillator();
      var g = c.createGain();
      var t0 = c.currentTime + delay;
      o.type = type || "sine";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol || 0.09, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    } catch (e) {}
  }

  var sfx = {
    click: function () {
      tone(340, 0, 0.05, "square", 0.035);
    },
    correct: function () {
      tone(523.25, 0, 0.09, "sine", 0.09);
      tone(659.25, 0.08, 0.09, "sine", 0.09);
      tone(783.99, 0.16, 0.2, "sine", 0.1);
    },
    wrong: function () {
      tone(185, 0, 0.18, "sawtooth", 0.06);
      tone(138, 0.16, 0.26, "sawtooth", 0.06);
    },
    victory: function () {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach(function (f, i) {
        tone(f, i * 0.13, 0.16, "triangle", 0.09);
      });
      tone(1318.5, 0.55, 0.4, "triangle", 0.1);
      tone(1046.5, 0.55, 0.4, "sine", 0.07);
    },
    defeat: function () {
      tone(329.63, 0, 0.26, "sine", 0.08);
      tone(277.18, 0.24, 0.26, "sine", 0.08);
      tone(220, 0.48, 0.45, "sine", 0.08);
    },
  };

  function updateSoundIcon() {
    if (!soundToggle) return;
    soundToggle.textContent = isMuted() ? "🔇" : "🔊";
    soundToggle.setAttribute(
      "aria-label",
      isMuted() ? "Unmute sounds" : "Mute sounds"
    );
  }

  if (soundToggle) {
    updateSoundIcon();
    soundToggle.addEventListener("click", function () {
      var muted = isMuted();
      try {
        localStorage.setItem(MUTED_KEY, muted ? "0" : "1");
      } catch (e) {}
      updateSoundIcon();
      if (muted) sfx.click();
    });
  }

  // ===== Best scores =====
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
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify(bests));
      } catch (e) {}
      return true;
    }
    return false;
  }

  function updateBestInfo() {
    var el = document.getElementById("best-score-info");
    if (!el) return;
    if (state.mode === "duel") {
      el.textContent = "";
      return;
    }
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

  // ===== Timer mode =====
  function loadTimedPref() {
    try {
      state.timed = localStorage.getItem(TIMED_KEY) === "1";
    } catch (e) {
      state.timed = false;
    }
    syncTimedToggle();
  }

  function syncTimedToggle() {
    if (!timerToggle) return;
    timerToggle.classList.toggle("active", state.timed);
    timerToggle.setAttribute("aria-pressed", String(state.timed));
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    if (quizTimer) quizTimer.classList.add("hidden");
  }

  function startTimer() {
    if (!state.timed || !quizTimer) return;
    state.timeLeft = TIME_LIMIT;
    quizTimer.classList.remove("hidden", "urgent");
    renderTimeLeft();
    state.timerId = setInterval(function () {
      state.timeLeft--;
      renderTimeLeft();
      if (state.timeLeft <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 1000);
  }

  function renderTimeLeft() {
    quizTimer.textContent = "⏱ " + state.timeLeft + "s";
    quizTimer.classList.toggle("urgent", state.timeLeft <= 10);
  }

  function handleTimeout() {
    if (state.answered) return;
    state.answered = true;

    var q = state.queue[state.index];
    var buttons = answersEl.querySelectorAll(".answer-btn");
    buttons.forEach(function (b) {
      b.disabled = true;
    });
    buttons[q.correct].classList.add("correct");

    state.streak = 0;
    updateStreakUI();
    setBotFace("sad");
    sfx.wrong();

    feedback.className = "feedback no";
    feedback.textContent =
      "⏱ Time's up! The correct answer is: " + q.answers[q.correct];
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

  // ===== Streak =====
  function updateStreakUI() {
    if (!streakChip) return;
    if (state.streak >= 2) {
      streakChip.textContent = "🔥 " + state.streak;
      streakChip.classList.remove("hidden");
      streakChip.classList.remove("pop");
      void streakChip.offsetWidth;
      streakChip.classList.add("pop");
    } else {
      streakChip.classList.add("hidden");
    }
  }

  // ===== Bot face =====
  function setBotFace(mood) {
    if (!quizBot) return;
    quizBot.classList.remove("bot-happy", "bot-sad");
    if (mood) quizBot.classList.add("bot-" + mood);
  }

  // ===== Core quiz =====
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
    [startScreen, quizScreen, passScreen, resultsScreen].forEach(function (s) {
      s.classList.add("hidden");
    });
    screen.classList.remove("hidden");
  }

  function startQuiz() {
    var pool = availableQuestions();
    if (pool.length === 0) return;

    stopTimer();

    if (state.mode === "duel") {
      if (!state.duelQueue) {
        state.duelQueue = shuffle(pool).slice(0, QUESTIONS_PER_QUIZ);
        state.duelPlayer = 1;
        state.duelScores = [0, 0];
        state.duelCorrect = [0, 0];
      }
      state.queue = state.duelQueue.slice();
    } else {
      state.duelQueue = null;
      state.duelPlayer = 1;
      state.queue = shuffle(pool).slice(0, QUESTIONS_PER_QUIZ);
    }

    state.index = 0;
    state.score = 0;
    state.correctCount = 0;
    state.streak = 0;
    state.bestStreak = 0;

    quizCategory.textContent =
      (state.mode === "duel" ? "P" + state.duelPlayer + " · " : "") +
      (state.category === "all" ? "Mixed" : state.category) +
      " · " +
      state.difficulty +
      (state.timed ? " · timed" : "");

    show(quizScreen);
    renderQuestion();
  }

  function renderQuestion() {
    var q = state.queue[state.index];
    state.answered = false;
    setBotFace(null);
    updateStreakUI();

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

    stopTimer();
    startTimer();
  }

  function answer(choiceIndex, btn) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    var q = state.queue[state.index];
    var buttons = answersEl.querySelectorAll(".answer-btn");
    buttons.forEach(function (b) {
      b.disabled = true;
    });

    var isCorrect = choiceIndex === q.correct;
    if (isCorrect) {
      state.score += q.difficulty === "hard" ? 15 : q.difficulty === "medium" ? 10 : 5;
      state.correctCount++;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      btn.classList.add("correct");
      setBotFace("happy");
      sfx.correct();
    } else {
      state.streak = 0;
      btn.classList.add("wrong");
      buttons[q.correct].classList.add("correct");
      setBotFace("sad");
      sfx.wrong();
    }
    updateStreakUI();

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

  // ===== Confetti =====
  function launchConfetti(host) {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    var cv = document.createElement("canvas");
    cv.className = "confetti-canvas";
    cv.width = host.clientWidth;
    cv.height = host.clientHeight;
    host.appendChild(cv);
    var ctx2d = cv.getContext && cv.getContext("2d");
    if (!ctx2d) {
      cv.remove();
      return;
    }
    var colors = ["#7b8aff", "#b57bff", "#3ddc84", "#ffd166", "#ff6b7d"];
    var parts = [];
    for (var i = 0; i < 140; i++) {
      parts.push({
        x: Math.random() * cv.width,
        y: -20 - Math.random() * cv.height * 0.5,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vy: 2 + Math.random() * 3.2,
        vx: -1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: -0.12 + Math.random() * 0.24,
        c: colors[i % colors.length],
      });
    }
    var start = performance.now();
    function frame(t) {
      ctx2d.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx2d.save();
        ctx2d.translate(p.x, p.y);
        ctx2d.rotate(p.rot);
        ctx2d.fillStyle = p.c;
        ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx2d.restore();
      });
      if (t - start < 2800) {
        requestAnimationFrame(frame);
      } else {
        cv.remove();
      }
    }
    requestAnimationFrame(frame);
  }

  function showResults() {
    var total = state.queue.length;
    var percent = Math.round((state.correctCount / total) * 100);

    stopTimer();
    progressFill.style.width = "100%";

    if (state.mode === "duel") {
      state.duelScores[state.duelPlayer - 1] = state.score;
      state.duelCorrect[state.duelPlayer - 1] = state.correctCount;
      if (state.duelPlayer === 1) {
        show(passScreen);
        return;
      }
      showDuelResults();
      return;
    }

    var isRecord = saveBestIfRecord(state.score);

    document.querySelector(".result-stats").classList.remove("hidden");
    document.getElementById("duel-scoreboard").classList.add("hidden");
    document.getElementById("duel-winner").classList.add("hidden");
    document.getElementById("retry-btn").textContent = "Try Again";

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
    if (state.bestStreak >= 3) {
      shareText += " 🔥 Best streak: " + state.bestStreak;
    }

    if (percent >= 90) {
      launchConfetti(resultsScreen);
      sfx.victory();
    } else if (percent >= 50) {
      sfx.victory();
    } else {
      sfx.defeat();
    }

    show(resultsScreen);
  }

  function showDuelResults() {
    var s1 = state.duelScores[0];
    var s2 = state.duelScores[1];
    var c1 = state.duelCorrect[0];
    var c2 = state.duelCorrect[1];

    document.querySelector(".result-stats").classList.add("hidden");
    var scoreboard = document.getElementById("duel-scoreboard");
    scoreboard.classList.remove("hidden");
    document.getElementById("duel-p1").textContent = s1;
    document.getElementById("duel-p2").textContent = s2;
    document.getElementById("duel-correct1").textContent = c1 + "/" + state.queue.length + " correct";
    document.getElementById("duel-correct2").textContent = c2 + "/" + state.queue.length + " correct";

    var winnerEl = document.getElementById("duel-winner");
    var suffix =
      (state.category === "all" ? "Mixed" : state.category) +
      " · " +
      state.difficulty +
      (state.timed ? " · timed" : "");

    if (s1 > s2) {
      winnerEl.textContent = "🏆 Player 1 wins!";
      resultEmoji.textContent = "🥇";
      resultTitle.textContent = "Player 1 takes the duel!";
      resultMessage.textContent = "A flawless victory in " + suffix + ".";
      launchConfetti(resultsScreen);
      sfx.victory();
      shareText = "Player 1 beat Player 2 " + s1 + "-" + s2 + " at QuizElite ⚔️ Can you do better?";
    } else if (s2 > s1) {
      winnerEl.textContent = "🏆 Player 2 wins!";
      resultEmoji.textContent = "🥇";
      resultTitle.textContent = "Player 2 takes the duel!";
      resultMessage.textContent = "What a comeback in " + suffix + ".";
      launchConfetti(resultsScreen);
      sfx.victory();
      shareText = "Player 2 beat Player 1 " + s2 + "-" + s1 + " at QuizElite ⚔️ Can you do better?";
    } else {
      winnerEl.textContent = "🤝 It's a tie!";
      resultEmoji.textContent = "⚖️";
      resultTitle.textContent = "Perfectly matched!";
      resultMessage.textContent = s1 + " pts each in " + suffix + ". Rematch?";
      sfx.victory();
      shareText = "We tied " + s1 + "-" + s2 + " at QuizElite ⚔️ Think you can beat both?";
    }
    winnerEl.classList.remove("hidden");

    document.getElementById("retry-btn").textContent = "Rematch ⚔️";

    show(resultsScreen);
  }

  function resetDuel() {
    state.duelQueue = null;
    state.duelPlayer = 1;
  }

  // ===== Events =====
  document.getElementById("start-btn").addEventListener("click", function () {
    sfx.click();
    startQuiz();
  });
  nextBtn.addEventListener("click", next);
  document.getElementById("retry-btn").addEventListener("click", function () {
    resetDuel();
    startQuiz();
  });
  document.getElementById("ready-btn").addEventListener("click", function () {
    sfx.click();
    state.duelPlayer = 2;
    startQuiz();
  });
  modeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      modeButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      state.mode = btn.dataset.mode;
      resetDuel();
      sfx.click();
      updateCountInfo();
    });
  });
  document.getElementById("home-btn").addEventListener("click", function () {
    stopTimer();
    resetDuel();
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

  if (timerToggle) {
    timerToggle.addEventListener("click", function () {
      state.timed = !state.timed;
      try {
        localStorage.setItem(TIMED_KEY, state.timed ? "1" : "0");
      } catch (e) {}
      syncTimedToggle();
      sfx.click();
      updateCountInfo();
    });
  }

  diffButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      diffButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      state.difficulty = btn.dataset.difficulty;
      sfx.click();
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
      sfx.click();
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
      resetDuel();
      startQuiz();
    }
  });

  // Logo "QuizElite": back to the quiz start screen (same page, no reload)
  document.querySelector(".logo").addEventListener("click", function (e) {
    e.preventDefault();
    stopTimer();
    resetDuel();
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

  loadTimedPref();
  populateCategories();
  document.getElementById("year").textContent = new Date().getFullYear();
})();
