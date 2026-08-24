// QuizElite — online 1v1 via Firebase Realtime Database
// PASTE YOUR FIREBASE WEB CONFIG BELOW (console.firebase.google.com → Project settings → Your apps)
(function () {
  "use strict";

  var FIREBASE_CONFIG = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyCew8Kzr4wbZcb3Y3CK2Y5l9CadnlomPZw",
    authDomain: "quizelite2.firebaseapp.com",
    databaseURL: "https://quizelite2-default-rtdb.firebaseio.com",
    projectId: "quizelite2",
    storageBucket: "quizelite2.firebasestorage.app",
    messagingSenderId: "148384751360",
    appId: "1:148384751360:web:ef9e724038323e7cb61de5"
  };

  var db = null;
  var room = null;
  var code = null;
  var role = null;
  var started = false;
  var qv = null;
  var oppLeftFired = false;
  var roomStatus = "waiting";
  var cbs = {};
  var questionGen = null;

  function configured() {
    return (
      typeof firebase !== "undefined" &&
      firebase.database &&
      FIREBASE_CONFIG.apiKey.indexOf("PASTE_") === -1 &&
      FIREBASE_CONFIG.databaseURL.indexOf("PASTE_") === -1
    );
  }

  function emit(ev, data) {
    if (cbs[ev]) cbs[ev](data);
  }

  function on(ev, cb) {
    cbs[ev] = cb;
  }

  function setQuestionGenerator(fn) {
    questionGen = fn;
  }

  function genCode() {
    var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var s = "";
    for (var i = 0; i < 5; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }

  function ensureDb() {
    if (db) return true;
    if (!configured()) {
      emit("error", "Online is not configured yet (Firebase config missing in online.js).");
      return false;
    }
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      return true;
    } catch (e) {
      emit("error", "Firebase error: " + e.message);
      return false;
    }
  }

  function blankPlayer() {
    return { connected: true, idx: 0, score: 0, done: false, correct: 0 };
  }

  function createRoom(questions, settings) {
    if (!ensureDb()) return;
    detach();
    role = "host";
    started = false;
    qv = null;
    oppLeftFired = false;
    roomStatus = "waiting";
    code = genCode();
    room = db.ref("rooms/" + code);
    room
      .set({
        status: "waiting",
        qv: 1,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        questions: questions,
        settings: settings,
        host: blankPlayer(),
        guest: Object.assign(blankPlayer(), { connected: false }),
      })
      .then(function () {
        room.child("host/connected").onDisconnect().set(false);
        emit("created", code);
        watch();
      })
      .catch(function (e) {
        emit("error", e.message);
      });
  }

  function joinRoom(rawCode) {
    if (!ensureDb()) return;
    detach();
    role = "guest";
    started = false;
    qv = null;
    oppLeftFired = false;
    roomStatus = "waiting";
    code = String(rawCode || "").toUpperCase().trim();
    if (!code) {
      emit("error", "Enter a room code first.");
      return;
    }
    room = db.ref("rooms/" + code);
    room
      .once("value")
      .then(function (snap) {
        var val = snap.val();
        if (!val) {
          emit("error", "Room " + code + " not found.");
          return;
        }
        if (val.status !== "waiting" || (val.guest && val.guest.connected)) {
          emit("error", "That room is full or already started.");
          return;
        }
        room.child("guest").set(blankPlayer());
        room.child("guest/connected").onDisconnect().set(false);
        emit("joined", { code: code, settings: val.settings });
        watch();
      })
      .catch(function (e) {
        emit("error", e.message);
      });
  }

  function detach() {
    if (room) room.off();
  }

  function watch() {
    room.child("guest/connected").on("value", function (s) {
      if (role === "host" && s.val() === true && roomStatus === "waiting") {
        room.child("status").set("playing");
      }
    });

    room.on("value", function (snap) {
      var v = snap.val();
      if (!v) {
        if (!oppLeftFired) {
          oppLeftFired = true;
          emit("opponentLeft");
        }
        return;
      }
      roomStatus = v.status || "waiting";

      var opp = role === "host" ? v.guest : v.host;
      if (opp) {
        emit("progress", {
          idx: opp.idx || 0,
          score: opp.score || 0,
          done: !!opp.done,
          correct: opp.correct || 0,
        });
        if (started && opp.connected === false && !oppLeftFired) {
          oppLeftFired = true;
          emit("opponentLeft");
        }
      }

      if (
        roomStatus === "playing" &&
        !started &&
        v.questions &&
        v.host &&
        v.host.connected &&
        v.guest &&
        v.guest.connected
      ) {
        started = true;
        emit("start", { questions: v.questions, settings: v.settings });
      }

      if (v.host && v.host.done && v.guest && v.guest.done) {
        emit("bothDone", {
          host: { score: v.host.score || 0, correct: v.host.correct || 0 },
          guest: { score: v.guest.score || 0, correct: v.guest.correct || 0 },
        });
      }

      if (role === "host" && v.rematchReq && started) {
        room.child("rematchReq").remove();
        rematch();
      }
    });

    room.child("qv").on("value", function (s) {
      if (!s.exists()) return;
      var val = s.val();
      if (qv === null) {
        qv = val;
        return;
      }
      if (val !== qv) {
        qv = val;
        started = true;
        room
          .once("value")
          .then(function (snap) {
            emit("start", {
              questions: snap.val().questions,
              settings: snap.val().settings,
              rematch: true,
            });
          });
      }
    });
  }

  function sendProgress(idx, score, done, correct) {
    if (!room) return;
    room.child(role).update({
      idx: idx,
      score: score,
      done: !!done,
      correct: correct || 0,
    });
  }

  function rematch() {
    if (!room) return;
    if (role === "host") {
      doRematch();
    } else {
      room.child("rematchReq").set(true);
      emit("waitingRematch");
    }
  }

  function doRematch() {
    if (!room) return;
    started = false;
    oppLeftFired = false;
    var qs = questionGen ? questionGen() : null;
    if (!qs) {
      emit("error", "Could not generate a new quiz.");
      return;
    }
    room.update({
      status: "playing",
      questions: qs,
      qv: (qv || 1) + 1,
      rematchReq: null,
      host: blankPlayer(),
      guest: Object.assign(blankPlayer(), { connected: false }),
    });
  }

  function leave() {
    if (room && role) {
      room.child(role + "/connected").set(false);
    }
    detach();
    room = null;
    role = null;
    started = false;
  }

  window.QuizOnline = {
    on: on,
    configured: configured,
    createRoom: createRoom,
    joinRoom: joinRoom,
    sendProgress: sendProgress,
    rematch: rematch,
    setQuestionGenerator: setQuestionGenerator,
    leave: leave,
    role: function () {
      return role;
    },
  };
})();
