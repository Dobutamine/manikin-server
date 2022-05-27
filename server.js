
const http = require("http")
const ip = require("ip")
const express = require("express")
const { WebSocket } = require("ws")
const app = express()
const manikin_server_port = 3000
const server = http.createServer(app)
const wss = new WebSocket.Server( { server })

const { connectTeensy } = require("./teensy")
const { connectManikin } = require("./manikin")

var current_ip = ip.address()

wss.on('connection', (ws) => {
    ws.on('message', (json_mes) => {
        // handle the different messages
        const message = JSON.parse(json_mes)
        handleWebsocketCommands(message)
        ws.send('OK')
    })
    console.log(`New connection accepted!`)
    ws.send("Hi from the manikin server!")
})

handleWebsocketCommands = (command) => {
    console.log(command)
}

// connect to the Teensy module inside the grey box
connectTeensy()

// connect to the Manikin 
connectManikin()

// Spin up a server
server.listen(manikin_server_port, () => {
    console.log(`Manikin webserver listening on address: ${current_ip} port: ${manikin_server_port}`)
})


