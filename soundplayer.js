const { workerData, parentPort } = require("worker_threads");

const player = require("play-sound")((opts = {}));

var hr_timer;

parentPort.on("message", (mes) => {
  switch (mes["command"]) {
    case "play_hb_normal":
      if (mes["param"] > 1) {
        clearInterval(hr_timer);
        hr_timer = setInterval(playHeartbeat, 60000 / mes["param"]);
      }
      break;
    case "play_bs_normal":
      playBreathSound();
      break;
  }
});

const playHeartbeat = function () {
  player.play("hb_normal.wav");
};

const playBreathSound = function () {
  player.play("bs_normal.wav");
};
