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

var inspiration_sound = "insp_normal";
var expiration_sound = "exp_normal";
var heartbeat_sound = "heartbeat_normal";
var crying_sound = "crying_1";
var grunting_sound = "grunting_1";
var spontaneous_breathing_timer;
var expiration_timer;
var breath_duration = 800;

const playSoundService = new Worker("./soundplayer.js");

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

    // first connect the airway sensor
    airwayPresSensor.open(2000);
    compPresSensor.open(2000);
    gyroSensor.open(2000);
    accSensor.open(2000);
  });
};

const spontaneousBreathing = function (spont_resp_rate) {
  if (spont_resp_rate > 0) {
    clearInterval(spontaneous_breathing_timer);
    spontaneous_breathing_timer = setInterval(() => {
      inspiration();
      // start timeout for expiration
      clearTimeout(expiration_timer);
      expiration_timer = setTimeout(() => {
        expiration();
      }, breath_duration);
    }, 60000 / parseInt(spont_resp_rate));
  } else {
    clearInterval(spontaneous_breathing_timer);
    expiration();
  }
};

const inspiration = function () {
  // start inspiration on the manikin by sending the A command to the Teensy
  writeTeensyCommand("A");
  // play the breath inspiration sound
  playSoundService.postMessage({
    command: "breath",
    type: inspiration_sound,
    param: 0,
  });
};

const expiration = function () {
  // start the expiration on the manikin by sending the B command to the Teensy
  writeTeensyCommand("B");
  // play the breath expiration sound
  playSoundService.postMessage({
    command: "breath",
    type: expiration_sound,
    param: 0,
  });
};

const heartbeat = function (new_hr) {
  playSoundService.postMessage({
    command: "heartbeat",
    type: heartbeat_sound,
    param: parseInt(new_hr),
  });
};

playSoundService.on("exit", (e) => console.log("sound player disconnected"));

module.exports.connectManikin = connectManikin;
module.exports.spontaneousBreathing = spontaneousBreathing;
module.exports.heartbeat = heartbeat;
