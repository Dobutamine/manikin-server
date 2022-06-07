const { Worker, parentPort } = require("worker_threads");
const http = require("http");
const ip = require("ip");
const express = require("express");
const { WebSocket } = require("ws");
const { parseInt } = require("lodash");
const { stringify } = require("querystring");

const app = express();
const manikin_server_port = 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const status = {
  target: "status",
  message: "",
};

const vitals = {
  target: "vitals",
  hr: 130,
  spo2_pre: 97,
  spo2_post: 95,
  abp_syst: 60,
  abp_diast: 40,
  resp_rate: 40,
  temp: 37.0,
  etco2: 4.5,
  pfi: 1.6,
  configChange: true,
};

const mon_config = {
  target: "config",
  hrEnabled: true,
  hrAlarmEnabled: false,
  hrUpper: 200,
  hrLower: 80,
  spo2PreEnabled: true,
  spo2PreAlarmEnabled: true,
  spo2PreUpper: 100,
  spo2PreLower: 92,
  spo2PostEnabled: true,
  spo2PostAlarmEnabled: true,
  spo2PostUpper: 100,
  spo2PostLower: 92,
  abpEnabled: true,
  abpAlarmEnabled: true,
  abpMeanUpper: 80,
  abpMeanLower: 40,
  respEnabled: true,
  respAlarmEnabled: true,
  respUpper: 80,
  respLower: 30,
  etco2Enabled: true,
  etco2AlarmEnabled: true,
  etco2Upper: 7.0,
  etco2Lower: 4.0,
  tempEnabled: true,
  tempAlarmEnabled: true,
  tempUpper: 38.0,
  tempLower: 36.5,
  nibdEnabled: true,
  nibdAlarmEnabled: true,
  alarmOverride: false,
};

const labs = {
  natrium: 140,
  kalium: 4.5,
};

const media = {};

var current_ip = ip.address();

wss.on("connection", (ws) => {
  ws.on("message", (json_mes) => {
    // handle the different messages
    const message = JSON.parse(json_mes);
    handleWebsocketCommands(ws, message);
  });
  console.log(`New connection accepted!`);
  let message = {};
  status.message = "Hi from the manikin server";
  ws.send(JSON.stringify(status));
});

handleWebsocketCommands = (ws, message) => {
  let target = message["target"];
  let command = message["command"];
  let data = message["data"];
  switch (target) {
    case "manikin":
      if (command == "normal") {
        manikin.postMessage({ command: "set_sound", param: 0 });
      }
      if (command == "cry") {
        manikin.postMessage({ command: "set_sound", param: 1 });
      }
      if (command == "grunt") {
        manikin.postMessage({ command: "set_sound", param: 2 });
      }
      if (command == "aw_auto") {
        manikin.postMessage({ command: "set_awor", param: 0 });
      }
      if (command == "aw_close") {
        manikin.postMessage({ command: "set_awor", param: 2 });
      }
      if (command == "aw_open") {
        manikin.postMessage({ command: "set_awor", param: 1 });
      }
      break;

    case "vitals":
      if (command == "get") {
        ws.send(JSON.stringify(vitals));
      }
      if (command == "set") {
        if (data.hr != vitals.hr) {
          manikin.postMessage({ command: "set_hr", param: data.hr });
          vitals.hr = data.hr;
        }
        if (data.resp_rate != vitals.resp_rate) {
          if (data.resp_rate <= 0) {
            manikin.postMessage({
              command: "set_spont_rr",
              param: 1,
            });
          } else {
            manikin.postMessage({
              command: "set_spont_rr",
              param: data.resp_rate,
            });
          }

          vitals.resp_rate = data.resp_rate;
        }
        vitals.spo2_pre = data.spo2_pre;
        vitals.spo2_post = data.spo2_post;
        vitals.abp_syst = data.abp_syst;
        vitals.abp_diast = data.abp_diast;
        vitals.temp = data.temp;
        vitals.pfi = data.pfi;
        vitals.etco2 = data.etco2;
        vitals.configChange = data.configChange;
      }
      break;

    case "labs":
      if (command == "get") {
        ws.send(JSON.stringify(labs));
      }
      if (command == "set") {
        manikin_vitals.hr = 110;
      }
      break;

    case "mon_config":
      if (command == "get") {
        ws.send(JSON.stringify(mon_config));
        vitals.configChange = false;
      }
      if (command == "set") {
        mon_config.hrEnabled = data.hrEnabled;
        mon_config.hrAlarmEnabled = data.hrAlarmEnabled;
        mon_config.hrUpper = data.hrUpper;
        mon_config.hrLower = data.hrLower;
        mon_config.spo2PreEnabled = data.spo2PreEnabled;
        mon_config.spo2PreAlarmEnabled = data.spo2PreAlarmEnabled;
        mon_config.spo2PreUpper = data.spo2PreUpper;
        mon_config.spo2PreLower = data.spo2PreLower;
        mon_config.spo2PostEnabled = data.spo2PostEnabled;
        mon_config.spo2PostAlarmEnabled = data.spo2PostAlarmEnabled;
        mon_config.spo2PostUpper = data.spo2PostUpper;
        mon_config.spo2PostLower = data.spo2PostLower;
        mon_config.abpEnabled = data.abpEnabled;
        mon_config.abpAlarmEnabled = data.abpAlarmEnabled;
        mon_config.abpMeanUpper = data.abpMeanUpper;
        mon_config.abpMeanLower = data.abpMeanLower;
        mon_config.respEnabled = data.respEnabled;
        mon_config.respAlarmEnabled = data.respAlarmEnabled;
        mon_config.respUpper = data.respUpper;
        mon_config.respLower = data.respLower;
        mon_config.etco2Enabled = data.etco2Enabled;
        mon_config.etco2AlarmEnabled = data.etco2AlarmEnabled;
        mon_config.etco2Upper = data.etco2Upper;
        mon_config.etco2Lower = data.etco2Lower;
        mon_config.tempEnabled = data.tempEnabled;
        mon_config.tempAlarmEnabled = data.tempAlarmEnabled;
        mon_config.tempUpper = data.tempUpper;
        mon_config.tempLower = data.tempLower;
        mon_config.nibdEnabled = data.nibdEnabled;
        mon_config.nibdAlarmEnabled = data.nibdAlarmEnabled;
        mon_config.alarmOverride = data.alarmOverride;
      }
      break;

    case "media":
      if (command == "set") {
      }
      if (command == "get") {
        ws.send(JSON, stringify(media));
      }
      break;
  }
};

// define a manikin service
const manikin = new Worker("./manikin.js");

// connect to the Manikin
manikin.postMessage({ command: "connect", param: 0 });

// attach an event handler to catch messages from manikin worker process
manikin.on("message", (message) => {
  console.log(message);
});

// Spin up the server
server.listen(manikin_server_port, () => {
  console.log(
    `Manikin webserver listening on address: ${current_ip} port: ${manikin_server_port}`
  );
});
