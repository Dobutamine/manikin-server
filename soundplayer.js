const { parentPort } = require("worker_threads");

const player = require("play-sound")((opts = {}));

parentPort.on("message", (mes) => {
  switch (mes["command"]) {
    case "heartbeat":
      playHeartbeat(mes["type"]);
      break;

    case "breath":
      playBreathSound(mes["type"]);
      break;

    case "cry":
      playCrying();
      break;

    case "grunt":
      playGrunting();
      break;
  }
});

const playHeartbeat = function (type) {
  player.play("./sounds/hb_normal.mp3");
};

const playBreathSound = function (type) {
  switch (type) {
    case "insp_normal":
      player.play("./sounds/bs_inspiration.mp3");
      break;
    case "exp_normal":
      // player.play("./sounds/bs_expiration.mp3");
      break;
  }
};

const playCrying = function () {
  player.play("./sounds/crying.mp3");
};

const playGrunting = function () {
  player.play("./sounds/grunting.mp3");
};
