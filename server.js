const {
  connectManikin,
  getAirwayPatency,
  setAirwayPatency,
} = require("./manikin");

const http = require("http");
const ip = require("ip");
const express = require("express");
const { WebSocket } = require("ws");
const path = require("node:path");
const app = express();
const manikin_server_port = 3000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
var current_ip = ip.address();
const player = require("play-sound")();

wss.on("connection", (ws) => {
  ws.on("message", (json_mes) => {
    // handle the different messages
    const message = JSON.parse(json_mes);
    handleWebsocketCommands(ws, message);
  });
  console.log(`New connection accepted!`);
  ws.send("Hi from the manikin server!");
});

handleWebsocketCommands = (ws, message) => {};

// connect to the Manikin
connectManikin();

// player.play("./sound.mp3", (err) => {
//   if (err) console.log(`Could not play sound: ${err}`);
// });

// Spin up a server
server.listen(manikin_server_port, () => {
  console.log(
    `Manikin webserver listening on address: ${current_ip} port: ${manikin_server_port}`
  );
});
