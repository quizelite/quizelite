// QuizElite — online multiplayer lobby via Firebase Realtime Database (up to 40 players)
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

  var MAX_PLAYERS = 40;

  var db = null;
  var room = null;
  var code = null;
  var role = null;
  var pid = null;
  var started = false;
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

  function randId(len) {
    var chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var s = "";
    for (var i = 0; i < len; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }

  function getPid() {
    if (window.__PID_OVERRIDE__) return window.__PID_OVERRIDE__;
    var fallback = randId(10);
    try {
      var p = sessionStorage.getItem("quizelite-pid");
      if (!p) {
        p = fallback;
        sessionStorage.setItem("quizelite-pid", p);
      }
      return p;
    } catch (e) {
      return fallback;
    }
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

  function mkPlayer(name) {
    return {
      name: String(name || "Player").slice(0, 14),
      connected: true,
      idx: 0,
      score: 0,
      done: false,
      correct: 0,
      seq: 0,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
    };
  }

  function playersArray(v) {
    var arr = [];
    var ps = v.players || {};
    Object.keys(ps).forEach(function (k) {
      var p = ps[k];
      p.id = k;
      arr.push(p);
    });
    arr.sort(function (a, b) {
      return (a.joinedAt || 0) - (b.joinedAt || 0);
    });
    return arr;
  }

  function detach() {
    if (room) room.off();
  }

  function createRoom(name, questions, settings) {
    if (!ensureDb()) return;
    detach();
    role = "host";
    pid = getPid();
    started = false;
    code = randId(5);
    room = db.ref("rooms/" + code);
    var players = {};
    players[pid] = mkPlayer(name);
    room
      .set({
        status: "lobby",
        qv: 1,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        questions: questions,
        settings: settings,
        hostId: pid,
        players: players,
      })
      .then(function () {
        room.child("players/" + pid + "/connected").onDisconnect().set(false);
        emit("created", code);
        watch();
      })
      .catch(function (e) {
        emit("error", e.message);
      });
  }

  function joinRoom(rawCode, name) {
    if (!ensureDb()) return;
    detach();
    role = "guest";
    pid = getPid();
    started = false;
    code = String(rawCode || "").toUpperCase().trim();
    if (!code) {
      emit("error", "Enter a room code first.");
      return;
    }
    room = db.ref("rooms/" + code);
    room
      .once("value")
      .then(function (snap) {
        var v = snap.val();
        if (!v) {
          emit("error", "Room " + code + " not found.");
          return;
        }
        if (v.status !== "lobby") {
          emit("error", "That match already started — ask for a new room.");
          return;
        }
        var count = Object.keys(v.players || {}).length;
        if (count >= MAX_PLAYERS) {
          emit("error", "Room is full (" + MAX_PLAYERS + " players).");
          return;
        }
        room.child("players/" + pid).set(mkPlayer(name));
        room.child("players/" + pid + "/connected").onDisconnect().set(false);
        emit("joined", { code: code });
        watch();
      })
      .catch(function (e) {
        emit("error", e.message);
      });
  }

  function watch() {
    room.on("value", function (snap) {
      var v = snap.val();
      if (!v) {
        emit("hostLeft");
        return;
      }

      var arr = playersArray(v);

      if (v.status === "lobby") {
        started = false;
        emit("lobby", {
          code: code,
          players: arr,
          hostId: v.hostId,
          me: pid,
          settings: v.settings,
          max: MAX_PLAYERS,
        });
      }

      if (v.status === "playing" && !started && v.questions) {
        started = true;
        emit("start", { questions: v.questions, settings: v.settings, players: arr });
      }

      if (started) {
        emit("players", { players: arr, hostId: v.hostId, me: pid });

        var connected = arr.filter(function (p) {
          return p.connected;
        });
        var allDone =
          connected.length > 0 &&
          connected.every(function (p) {
            return p.done;
          });
        if (allDone) {
          emit("allDone", { players: arr });
        }

        var hostP = v.players && v.players[v.hostId];
        if (!hostP || hostP.connected === false) {
          emit("hostLeft");
        }
      }
    });
  }

  function startMatch() {
    if (role === "host" && room) {
      room.child("status").set("playing");
    }
  }

  function sendProgress(idx, score, done, correct, seq) {
    if (!room) return;
    room.child("players/" + pid).update({
      idx: idx,
      score: score,
      done: !!done,
      correct: correct || 0,
      seq: seq || 0,
    });
  }

  function rematch() {
    if (!room || role !== "host") return;
    var qs = questionGen ? questionGen() : null;
    if (!qs) {
      emit("error", "Could not generate a new quiz.");
      return;
    }
    var v = null;
    room.once("value").then(function (snap) {
      v = snap.val();
      if (!v) return;
      var reset = {};
      Object.keys(v.players || {}).forEach(function (k) {
        var p = v.players[k];
        if (!p.connected) return;
        reset[k] = {
          name: p.name,
          connected: true,
          idx: 0,
          score: 0,
          done: false,
          correct: 0,
          seq: 0,
          joinedAt: p.joinedAt || 0,
        };
      });
      room.update({
        status: "lobby",
        questions: qs,
        qv: (v.qv || 1) + 1,
        players: reset,
      });
      emit("backToLobby");
    });
  }

  function leave() {
    if (room && pid) {
      room.child("players/" + pid + "/connected").set(false);
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
    startMatch: startMatch,
    sendProgress: sendProgress,
    rematch: rematch,
    setQuestionGenerator: setQuestionGenerator,
    leave: leave,
    role: function () {
      return role;
    },
    me: function () {
      return pid;
    },
    MAX_PLAYERS: MAX_PLAYERS,
  };
})();
