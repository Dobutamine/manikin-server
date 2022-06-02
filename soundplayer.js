const { parentPort } = require("worker_threads");

const player = require("play-sound")((opts = {}));

var hr_timer;

parentPort.on("message", (mes) => {
  switch (mes["command"]) {
    case "heartbeat":
      if (mes["param"] > 1) {
        clearInterval(hr_timer);
        hr_timer = setInterval(playHeartbeatNormal, 60000 / mes["param"]);
      }
      break;

    case "breath":
      playBreathSound(mes["type"]);
      break;

    case "play_crying":
      playCrying();
      break;

    case "play_grunting":
      playGrunting();
      break;
  }
});

const playHeartbeatNormal = function () {
  player.play("./sounds/heartbeat_normal.mp3");
};

const playBreathSound = function (type) {
  switch (type) {
    case "insp_normal":
      player.play("./sounds/bs_inspiration.mp3");
      break;
    case "exp_normal":
      player.play("./sounds/bs_expiration.mp3");
      break;
  }
};

const playCrying = function () {
  player.play("crying.wav");
};

const playGrunting = function () {
  player.play("grunting.wav");
};
