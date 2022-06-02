const {
  connectManikin,
  setSpontBreathing,
  setHeartrate,
} = require("./manikin");

const http = require("http");
const ip = require("ip");
const express = require("express");
const { WebSocket } = require("ws");
const { Certificate } = require("crypto");
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
  let command = message["command"];
  let type = message["type"];
  let param = message["param"];
  switch (command) {
    case "set_spont_rr":
      setSpontBreathing(parseInt(param));
      break;
    case "set_hr":
      setHeartrate(parseInt(param));
      break;
  }
};

// connect to the Manikin
// connectManikin();

// player.play("./sound.mp3", (err) => {
//   if (err) console.log(`Could not play sound: ${err}`);
// });

// Spin up a server
server.listen(manikin_server_port, () => {
  console.log(
    `Manikin webserver listening on address: ${current_ip} port: ${manikin_server_port}`
  );
});
