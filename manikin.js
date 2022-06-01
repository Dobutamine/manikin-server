const { connectTeensy, writeTeensyCommand } = require("./teensy");
const { Worker } = require("worker_threads");

const phidget22 = require("phidget22");
const { resolve } = require("path");

var phidgets_found = false;
var airway_pres_port = 5;
var stomach_pres_port = 0;
var comp_pressure_port = 1;
var gyro_port = 4;
var acc_port = 4;

var airway_pressure = 0;
var airway_status = false;
var airway_patency = true;
var stomach_pressure = 0;
var comp_pressure = 0;

var gyro_angular_x = 0;
var gyro_angular_y = 0;
var gyro_angular_z = 0;

var acc_angular_x = 0;
var acc_angular_y = 0;
var acc_angular_z = 0;

const connectManikin = function () {
  // connect to the Teensy module inside the grey box
  connectTeensy();

  // open the connection to the Phidgets of the manikin
  const conn = new phidget22.NetworkConnection(5661, "localhost");

  conn.connect().then((phidget) => {
    // connect all the sensors
    const airwayPresSensor = new phidget22.VoltageInput();
    airwayPresSensor.setIsHubPortDevice(true);
    airwayPresSensor.setHubPort(airway_pres_port);

    const stomachPresSensor = new phidget22.VoltageInput();
    stomachPresSensor.setIsHubPortDevice(true);
    stomachPresSensor.setHubPort(stomach_pres_port);

    const compPresSensor = new phidget22.VoltageInput();
    compPresSensor.setIsHubPortDevice(true);
    compPresSensor.setHubPort(comp_pressure_port);

    const gyroSensor = new phidget22.Gyroscope();
    gyroSensor.setHubPort(gyro_port);

    const accSensor = new phidget22.Accelerometer();
    accSensor.setHubPort(acc_port);

    // handle the sensor changes
    airwayPresSensor.onVoltageChange = (voltage) => {
      airway_pressure = voltage;
    };

    stomachPresSensor.onVoltageChange = (voltage) => {
      stomach_pressure = voltage;
    };

    compPresSensor.onVoltageChange = (voltage) => {
      comp_pressure = voltage;
    };

    gyroSensor.onAngularRateUpdate = (angularRate, timestamp) => {
      gyro_angular_x = angularRate[0];
      gyro_angular_y = angularRate[1];
      gyro_angular_z = angularRate[2];
    };

    accSensor.onAngularRateUpdate = (acceleration, timestamp) => {
      acc_angular_x = acceleration[0];
      acc_angular_y = acceleration[1];
      acc_angular_z = acceleration[2];
    };

    airwayPresSensor.open(2000);
    stomachPresSensor.open(2000);
    compPresSensor.open(2000);
    gyroSensor.open(2000);
    accSensor.open(2000);

    phidgets_found = true;

    if (phidgets_found) {
      console.log(`Manikin connected!`);
    } else {
      console.log(`Manikin not connected!`);
    }
  });
};

const setAirwayPatency = function (patency) {
  airway_patency = patency;
  console.log(`MANIKIN: Airway patency set to: ${patency}.`);
};

const getAirwayPatency = function () {
  console.log(`MANIKIN: Returned airway patency.`);
  return airway_patency;
};

const startBreathing = function (frequency) {
  let interval = 60000 / frequency;
  setInterval(() => {
    writeTeensyCommand("A");
    0;
  }, interval);
};

const playSoundService = new Worker("./soundplayer.js", {
  workerData: { freq: 60 },
});

const updateHeartbeat = function (new_hr) {
  playSoundService.postMessage({
    command: "play_hb_normal",
    param: parseInt(new_hr),
  });
};

const playBreathSound = function (bs) {
  playSoundService.postMessage({
    command: "play_bs_normal",
    param: 0,
  });
};
playSoundService.on("exit", (e) => console.log("sound player ready"));

module.exports.connectManikin = connectManikin;
module.exports.setAirwayPatency = setAirwayPatency;
module.exports.getAirwayPatency = getAirwayPatency;
module.exports.updateHeartbeat = updateHeartbeat;
module.exports.playBreathSound = playBreathSound;
