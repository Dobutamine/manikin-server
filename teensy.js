const { SerialPort, ReadlineParser } = require("serialport");

var teensy_port;
var teensy_found = false;

const connectTeensy = function () {
  // open de correct serialport where the Teensy lives
  SerialPort.list().then((ports) => {
    ports.forEach((port) => {
      if (port["manufacturer"] == "Teensyduino") {
        teensy_port = new SerialPort({
          path: port["path"],
          baudRate: 9600,
          autoOpen: false,
        });
        teensy_port.open();
        teensy_found = true;
        const parser = teensy_port.pipe(
          new ReadlineParser({ delimiter: "\r" })
        );
        parser.on("data", readSerialPortData);
        console.log(`Teensy connected on port: ${port["path"]}`);
      }
    });
    if (!teensy_found) {
      console.log(`Teensy not found!`);
    }
  });
};

readSerialPortData = (data) => {
  console.log(`Teensy data: ${data}`);
};

const writeTeensyCommand = function (teensy_command) {
  if (teensy_port) {
    teensy_port.write(teensy_command);
  }
};

module.exports.connectTeensy = connectTeensy;
module.exports.writeTeensyCommand = writeTeensyCommand;
