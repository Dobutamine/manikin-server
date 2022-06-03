// const {
//   connectManikin,
//   setSpontBreathing,
//   setHeartrate,
//   setAirwayOverride,
//   returnData,
// } = require("./manikin");

const { Worker, parentPort } = require("worker_threads");
const http = require("http");
const ip = require("ip");
const express = require("express");
const { WebSocket } = require("ws");
const { parseInt } = require("lodash");

const app = express();
const manikin_server_port = 3001;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
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
  let param = message["param"];
  switch (target) {
    case "manikin":
      manikin.postMessage({
        command: command,
        param: parseInt(param),
      });
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
