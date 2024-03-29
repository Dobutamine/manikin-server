const { Worker, parentPort, postMessage } = require("worker_threads");

const phidget22 = require("phidget22");

const _ = require("lodash");
//const { chain } = require("lodash");

const ipManikinModule = "192.168.8.7";

var airway_pres_port = 0;
var stomach_pres_port = 1;
var comp_pressure_port = 3;
var gyro_port = 2;
var acc_port = 2;
var breathingRelayPort = 2;

var airway_pressure = 0;
var voltage_pressure_conversion = 1.0;
var airway_status = false;

var stomach_pressure = 0;
var comp_pressure = 0;

var gyro_angular_x = 0;
var gyro_angular_y = 0;
var gyro_angular_z = 0;

var acc_angular_x = 0;
var acc_angular_y = 0;
var acc_angular_z = 0;
var optimal_position = 0.09;
var optimal_position_delta = 5.5;
var airway_patency = true;
var airway_factor = 1.0;
var airway_override = 0;
var airway_pressure_threshold = 10.0;
var art_inspiration = false;
var art_expiration = true;

var spontaneous_breathing_timer;
var inspiration_sound = "insp_normal";
var expiration_sound = "exp_normal";
var expiration_timer;
var breath_duration = 800;
var spont_respiration_blocked = false;

var expiration_sound_type = 0;
var heartbeat_timer;
var heartbeat_sound = "heartbeat_normal";

var temp_max_pressure = 0;
var pip = 0;
var temp_min_pressure = 0;
var peep = 0;

var temp_max_abd = 0;
var pip_abd = 0;
var temp_min_abd = 0;
var peep_abd = 0;

var temp_max_comp = 0;
var max_comp = 0;
var temp_min_comp = 0;
var min_comp = 0;
var reporterInterval = 2500;

let performanceData = {
  pip: 0,
  peep: 0,
  aw: 0,
  ap: false,
  pip_abd: 0,
  peep_abd: 0,
  comp_pres: 0,
  comp_release: 0,
};
// define a sound service
const playSoundService = new Worker("./soundplayer.js");

parentPort.on("message", (message) => {
  switch (message["command"]) {
    case "connect":
      connect();
      break;
    case "set_spont_rr":
      setSpontBreathing(parseInt(message["param"]));
      break;
    case "set_hr":
      setHeartrate(parseInt(message["param"]));
      break;
    case "set_awor":
      setAirwayOverride(parseInt(message["param"]));
      break;
    case "set_sound":
      expiration_sound_type = parseInt(message["param"]);
      break;
  }
});

const reportPressures = function () {
  pip = parseInt(temp_max_pressure);
  temp_max_pressure = -1000;
  peep = parseInt(temp_min_pressure);
  temp_min_pressure = 1000;

  max_comp = parseInt(temp_max_comp);
  temp_max_comp = -1000;
  min_comp = parseInt(temp_min_comp);
  temp_min_comp = 1000;

  pip_abd = parseInt(temp_max_abd);
  temp_max_abd = -1000;
  peep_abd = parseInt(temp_min_abd);
  temp_min_abd = 1000;

  let aw = parseInt(airway_factor * 100);

  performanceData.pip = pip;
  performanceData.peep = peep;
  performanceData.aw = aw;
  performanceData.ap = airway_patency;
  performanceData.pip_abd = pip_abd;
  performanceData.peep_abd = peep_abd;
  performanceData.max_comp = max_comp;
  performanceData.min_comp = min_comp;

  // send the performance data to the server
  parentPort.postMessage({ command: "status", param: performanceData });
};

const connect = function () {
  // open the connection to the Phidgets of the manikin
  const conn = new phidget22.NetworkConnection(5661, ipManikinModule);

  conn
    .connect()
    .then(() => {
      console.log("Connected to the manikin module.");
      // connect all the sensors
      const airwayPresSensor = new phidget22.VoltageRatioInput();

      airwayPresSensor.setIsHubPortDevice(true);
      airwayPresSensor.setHubPort(airway_pres_port);

      const stomachPresSensor = new phidget22.VoltageRatioInput();
      stomachPresSensor.setIsHubPortDevice(true);
      stomachPresSensor.setHubPort(stomach_pres_port);

      const compPresSensor = new phidget22.VoltageRatioInput();
      compPresSensor.setIsHubPortDevice(true);
      compPresSensor.setHubPort(comp_pressure_port);

      const gyroSensor = new phidget22.Gyroscope();
      gyroSensor.setHubPort(gyro_port);

      const accSensor = new phidget22.Accelerometer();
      accSensor.setHubPort(acc_port);

      airwayPresSensor.onSensorChange = (sensorValue) => {
        airway_pressure = sensorValue * 10.1972; // convert kPa to cmH2O
        if (airway_pressure > temp_max_pressure) {
          temp_max_pressure = airway_pressure;
        }
        if (airway_pressure < temp_min_pressure) {
          temp_min_pressure = airway_pressure;
        }

        switch (airway_override) {
          case 0: // automatic mode
            if (
              (airway_pressure > airway_pressure_threshold) &
              (art_expiration == true) &
              (airway_patency == true)
            ) {
              art_inspiration = true;
              art_expiration = false;
              artInspiration();
            }
            break;
          case 1: // always open
            if (
              (airway_pressure > airway_pressure_threshold) &
              (art_expiration == true)
            ) {
              art_inspiration = true;
              art_expiration = false;
              artInspiration();
            }
            break;
          case 2: // always closed
            break;
        }

        if (
          (airway_pressure < airway_pressure_threshold) &
          (art_inspiration == true)
        ) {
          art_inspiration = false;
          art_expiration = true;
          artExpiration();
        }
      };

      stomachPresSensor.onSensorChange = (sensorValue) => {
        stomach_pressure = sensorValue * 10.1972; // convert kPa to cmH2o
        if (stomach_pressure > temp_max_abd) {
          temp_max_abd = stomach_pressure;
        }
        if (stomach_pressure < temp_min_abd) {
          temp_min_abd = stomach_pressure;
        }
      };

      compPresSensor.onSensorChange = (sensorValue) => {
        comp_pressure = sensorValue;
        if (comp_pressure > temp_max_comp) {
          temp_max_comp = comp_pressure;
        }
        if (comp_pressure < temp_min_comp) {
          temp_min_comp = comp_pressure;
        }
      };

      gyroSensor.onAngularRateUpdate = (angularRate, timestamp) => {
        gyro_angular_x = angularRate[0];
        gyro_angular_y = angularRate[1];
        gyro_angular_z = angularRate[2];
      };

      accSensor.onAccelerationChange = (acceleration, timestamp) => {
        acc_angular_x = acceleration[0];
        acc_angular_y = acceleration[1];
        acc_angular_z = acceleration[2];
        airway_patency = true;
        airway_factor =
          1.0 -
          Math.abs(acc_angular_z - optimal_position) * optimal_position_delta;
        if (airway_factor < 0) {
          airway_factor = 0;
          airway_patency = false;
        }
      };

      // connect the airway pressure sensor
      airwayPresSensor
        .open(2000)
        .then(() => {
          console.log("Manikin module: airway pressure sensor online.");
          airwayPresSensor.setSensorType(
            phidget22.VoltageRatioSensorType.PN_1137
          ); //+-7kPa sensor 1137
          airwayPresSensor.setDataInterval(50);

          // start the pressure reporter
          setInterval(reportPressures, reporterInterval);
        })
        .catch(() => {
          console.log("Manikin module: airway pressure sensor failed.");
        });

      // connect the stomach pressure sensor
      stomachPresSensor
        .open(2000)
        .then(() => {
          console.log("Manikin module: stomach pressure sensor online.");
          stomachPresSensor.setSensorType(
            phidget22.VoltageRatioSensorType.PN_1137
          );
          stomachPresSensor.setDataInterval(50);
        })
        .catch(() => {
          console.log("Manikin module: stomach pressure sensor failed.");
        });

      // connect the compression pressure sensor
      compPresSensor
        .open(2000)
        .then(() => {
          console.log("Manikin module: compressions pressure sensor online.");
          compPresSensor.setSensorType(
            phidget22.VoltageRatioSensorType.PN_1131
          ); // Thinforce sensor
          compPresSensor.setDataInterval(50);
        })
        .catch(() => {
          console.log("Manikin module: compressions pressure sensor failed.");
        });

      // connect the gyro sensor
      gyroSensor
        .open(2000)
        .then(() => {
          gyroSensor.setDataInterval(100);
          console.log("Manikin module: head gyro sensor online.");
        })
        .catch(() => {
          console.log("Manikin module: head gyro pressure sensor failed.");
        });

      // connect the acceleration sensor
      accSensor
        .open(2000)
        .then(() => {
          accSensor.setDataInterval(100);
          console.log("Manikin module: head acceleration sensor online.");
        })
        .catch(() => {
          console.log("Manikin module: head acceleration sensor failed.");
        });
    })
    .catch(() => {
      console.log("Manikin connection failed! Reconnecting in 5 seconds.");
      setTimeout(() => {
        connect();
      }, 5000);
    });
};

const setAirwayOverride = function (setting) {
  airway_override = setting;
};

// BREAHTING
const setSpontBreathing = function (spont_resp_rate) {
  if (spont_resp_rate > 0) {
    clearInterval(spontaneous_breathing_timer);
    spontaneous_breathing_timer = setInterval(() => {
      spontInspiration();
      // start timeout for expiration
      clearTimeout(expiration_timer);
      expiration_timer = setTimeout(() => {
        spontExpiration();
      }, breath_duration);
    }, 60000 / parseInt(spont_resp_rate));
  } else {
    clearInterval(spontaneous_breathing_timer);
    expiration();
  }
};

const spontInspiration = function () {
  if (!spont_respiration_blocked) {
    // start inspiration on the manikin by sending the A command to the Teensy
    parentPort.postMessage({ command: "spont_insp", param: {} });
    // play the breath inspiration sound
    playSoundService.postMessage({
      command: "breath",
      type: inspiration_sound,
      param: 0,
    });
  }
};

const spontExpiration = function () {
  if (!spont_respiration_blocked) {
    // start the expiration on the manikin by sending the B command to the Teensy
    parentPort.postMessage({ command: "spont_exp", param: {} });
    // play the breath expiration sound
    switch (expiration_sound_type) {
      case 0: // normal breath sound
        parentPort.postMessage("spont_exp");
        playSoundService.postMessage({
          command: "breath",
          type: expiration_sound,
          param: 0,
        });
        break;
      case 1: // crying
        parentPort.postMessage("spont_exp");
        playSoundService.postMessage({
          command: "cry",
          type: expiration_sound,
          param: 0,
        });
        break;
      case 2: // grunting
        parentPort.postMessage("spont_exp");
        playSoundService.postMessage({
          command: "grunt",
          type: expiration_sound,
          param: 0,
        });
        break;
    }
    playSoundService.postMessage({
      command: "breath",
      type: expiration_sound,
      param: 0,
    });
  }
};

const artInspiration = _.debounce(function () {
  spont_respiration_blocked = true;
  // start inspiration on the manikin by sending the A command to the Teensy
  parentPort.postMessage({ command: "art_insp", param: {} });
  // play the breath inspiration sound
  playSoundService.postMessage({
    command: "breath",
    type: inspiration_sound,
    param: 0,
  });
}, 250);

const artExpiration = _.debounce(function () {
  // unblock spontaneous breathing
  spont_respiration_blocked = false;
  // start the expiration on the manikin by sending the B command to the Teensy
  parentPort.postMessage({ command: "art_exp", param: {} });
  // play the breath expiration sound
  playSoundService.postMessage({
    command: "breath",
    type: expiration_sound,
    param: 0,
  });
}, 250);

// HEARTRATE
function setHeartrate(new_hr) {
  if (new_hr > 0) {
    clearInterval(heartbeat_timer);
    heartbeat_timer = setInterval(heartbeat, 60000 / new_hr);
  }
}

function heartbeat() {
  // play the heartbeat sound
  playSoundService.postMessage({
    command: "heartbeat",
    type: heartbeat_sound,
    param: 0,
  });
}

function returnData() {
  return JSON.stringify({
    ap: airway_pressure,
    cp: comp_pressure,
    aw_pos: airway_factor,
  });
}
