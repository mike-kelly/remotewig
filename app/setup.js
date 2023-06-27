//-------------------------------------------------------
//  Save LAN IP address of host machine to websocketIP.js
//-------------------------------------------------------
const { writeFileSync } = require('fs');
const os = require('os');
const WEB_UI_PORT = 8888;


const getExternalIPAddresses = function () {
  const interfaces = os.networkInterfaces(),
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
const setup = function() {
  const ipAddresses = getExternalIPAddresses();
  try {
    writeFileSync('./web/assets/js/websocketIp.js', `const WEB_SOCKET_ADDRESS = '${ipAddresses[0]}';`);
    console.log("\n");
    console.log('Setup completed. The following IP address was saved:\n');
    ipAddresses.forEach(function (address) {
      console.log(`http://${address}:${WEB_UI_PORT}\n`);
    });
  } catch (err) {
    console.log("There was an error writing web socket IP address: " + err);
    console.log("Edit the value in websocketIP.js manually before running the app:");
    ipAddresses.forEach(function (address) {
      console.log(`${address}\n`);
    });
  }
}

setup();
