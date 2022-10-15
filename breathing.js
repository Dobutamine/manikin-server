const { parentPort } = require("worker_threads");

const phidget22 = require("phidget22");

const ipBreathingModule = "192.168.8.5";

const breathingRelayPort = 2;

let stomach;
let leftLung;
let rightLung;

parentPort.on("message", (message) => {
  switch (message["command"]) {
    case "connect":
      connect();
      break;
    case "art_insp":
      try {
        if (leftLung) {
          leftLung.setState(true);
        }
        if (rightLung) {
          rightLung.setState(true);
        }
      } catch {
        console.log("error at art insp");
      }

      break;
    case "art_exp":
      try {
        if (leftLung) {
          leftLung.setState(false);
        }
        if (rightLung) {
          rightLung.setState(false);
        }
      } catch {
        console.log("error at art exp");
      }

      break;
    case "spont_insp":
      try {
        if (stomach) {
          stomach.setState(true);
        }
      } catch {
        console.log("error at spont_insp");
      }

      break;
    case "spont_exp":
      try {
        if (stomach) {
          stomach.setState(false);
        }
      } catch {
        console.log("error at spont_exp");
      }
      break;
  }
});

const connect = function () {
  const conn = new phidget22.NetworkConnection(5661, ipBreathingModule);

  conn
    .connect()
    .then(() => {
      console.log("Connected to the breathing module.");
      // instantiate the stomach valve
      stomach = new phidget22.DigitalOutput();
      stomach.setIsHubPortDevice(false);
      stomach.setHubPort(breathingRelayPort);
      stomach.setChannel(0);

      // instantiate the left lung valve
      leftLung = new phidget22.DigitalOutput();
      leftLung.setIsHubPortDevice(false);
      leftLung.setHubPort(breathingRelayPort);
      leftLung.setChannel(1);

      // instantiate the left lung valve
      rightLung = new phidget22.DigitalOutput();
      rightLung.setIsHubPortDevice(false);
      rightLung.setHubPort(breathingRelayPort);
      rightLung.setChannel(2);

      stomach
        .open(2000)
        .then(() => {
          console.log("Breathing module: stomach valve online.");
        })
        .catch(() => {
          console.log("Breathing module: stomach valve failed.");
        });

      leftLung
        .open(2000)
        .then(() => {
          console.log("Breathing module: left lung valve online.");
        })
        .catch(() => {
          console.log("Breathing module: left lung valve failed.");
        });

      rightLung
        .open(2000)
        .then(() => {
          console.log("Breathing module: right lung valve online.");
        })
        .catch(() => {
          console.log("Breathing module: right lung valve failed.");
        });
    })
    .catch(() => {
      console.log(
        "Breathing module connection failed! Reconnecting in 5 seconds."
      );
      setTimeout(() => {
        connect();
      }, 5000);
    });
};
