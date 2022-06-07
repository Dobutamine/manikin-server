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

const vitals = {
  hr: 130,
  spo2_pre: 97,
  spo2_post: 95,
  abp_syst: 60,
  abp_diast: 40,
  nibd_syst: 60,
  nibd_diast: 40,
  resp_rate: 45,
  spont_resp_rate: 40,
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
  ws.send("Hi from the manikin server!");
});

handleWebsocketCommands = (ws, message) => {
  let target = message["target"];
  let command = message["command"];
  let data = message["data"];
  switch (target) {
    case "vitals":
      if (command == "get") {
        ws.send(JSON.stringify(vitals));
      }
      if (command == "set") {
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
