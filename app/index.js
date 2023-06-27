//--------------------------------------------------
//  Bi-Directional OSC messaging Websocket <-> UDP
//--------------------------------------------------
const osc = require("osc");
const path = require("node:path");
const WebSocket = require("ws");
const connect = require('connect');
const serveStatic = require('serve-static');
const WEB_UI_PORT = 8888;

// WEB_SOCKET_PORT value MUST match that of variable of same name in web/assets/remotewig.js
const WEB_SOCKET_PORT = 8089;

const getHostIpAddresses = function() {
  const ipAddresses = getIPAddresses();
  ipAddresses.forEach(function (address) {
    console.log(`  Host: ${address}, Port: ${udp.options.localPort}`);
  });
}

connect()
  .use(serveStatic(path.resolve(__dirname, 'web')))
  .listen({ port: WEB_UI_PORT }, () => {
    console.log("\n");
    console.log('Open or refresh the following web page to control Bitwig remotely:\n');
    const ipAddresses = getIPAddresses();
    ipAddresses.forEach(function (address) {
      console.log(`http://${address}:${WEB_UI_PORT}\n`);
    });
  })

const getIPAddresses = function () {
  const os = require("os"),
    interfaces = os.networkInterfaces(),
    ipAddresses = [];

  for (const deviceName in interfaces) {
    const addresses = interfaces[deviceName];

    for (let i = 0; i < addresses.length; i++) {
      const addressInfo = addresses[i];

      if (addressInfo.family === "IPv4" && !addressInfo.internal) {
        ipAddresses.push(addressInfo.address);
      }
    }
  }

  return ipAddresses;
};

const udp = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 7400,
  remoteAddress: "127.0.0.1",
  remotePort: 7500,
  metadata: true
});

udp.on("ready", function () {
  const ipAddresses = getIPAddresses();
  console.log("Listening for OSC over UDP:");
  ipAddresses.forEach(function (address) {
    console.log(`  Host: ${address}, Port: ${udp.options.localPort}`);
  });
  console.log(`  Remote address: ${udp.options.remoteAddress}, Port: ${udp.options.remotePort}`);
});

udp.open();

const wss = new WebSocket.Server({
  port: WEB_SOCKET_PORT
});

wss.on("connection", function (socket) {
  console.log(`A connection has been established with the browser on port ${WEB_UI_PORT}.`);
  console.log(`A Web Socket connection has been established on port ${WEB_SOCKET_PORT}.`);
  console.log("OSC messages will be relayed between Bitwig and the web browser via UDP.");
	const socketPort = new osc.WebSocketPort({
    socket: socket,
    metadata: true
  });

  const relay = new osc.Relay(udp, socketPort, {
    raw: true,
    metadata: true
  });
});
