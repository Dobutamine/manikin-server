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
      leftLung.setState(true);
      rightLung.setState(true);
      break;
    case "art_exp":
      leftLung.setState(false);
      rightLung.setState(false);
      break;
    case "spont_insp":
      stomach.setState(true);
      break;
    case "spont_exp":
      stomach.setState(false);
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
      stomach.onAttach = function () {
        console.log("stomach valve ready!");
      };

      // instantiate the left lung valve
      leftLung = new phidget22.DigitalOutput();
      leftLung.setIsHubPortDevice(false);
      leftLung.setHubPort(breathingRelayPort);
      leftLung.setChannel(1);
      leftLung.onAttach = function () {
        console.log("left lung valve ready!");
      };

      // instantiate the left lung valve
      rightLung = new phidget22.DigitalOutput();
      rightLung.setIsHubPortDevice(false);
      rightLung.setHubPort(breathingRelayPort);
      rightLung.setChannel(2);
      rightLung.onAttach = function () {
        console.log("right lung valve ready!");
      };

      stomach.open(2000).then(() => {
        console.log("stomach valve channel opened!");
      });
      leftLung.open(2000).then(() => {
        console.log("left lung valve channel opened!");
      });
      rightLung.open(2000).then(() => {
        console.log("right lung valve channel opened!");
      });
    })
    .catch(() => console.log("Breathing module connection failed!"));
};
