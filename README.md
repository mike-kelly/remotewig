### Forked from https://github.com/j28/remotewig

### New Features

- View and set tempo
- Stop / zero button for transport (stops Bitwig if playing, zeros position if stopped)
- Toggle Metronome control
- Display current position
- Some simple updates to layout and CSS
- Added documentation and terminal prompts to make it easier to get started

____

## Installation

> #### Tested with node version 18.7.0
Install on the same computer which is running Bitwig.

From the command line:
1. In the <code>/app</code> folder, run <code>npm install</code>
2. In the <code>/app/web</code> folder, run <code>npm install</code>
3. Both folders should now have `node_modules` folders with npm libraries installed
4. Add the contents of <code>/controller-scripts</code> to your Bitwig Controller Scripts folder

## Running the Application From Source

1. Before running the app for the first time, in the <code>/app</code> folder, set up the server configuration with <code>npm run setup</code>
2. In the <code>/app</code> folder, start the Node.js server with <code>npm run serve</code>
3. A URL will be displayed in the terminal—this is the address to open in your web browser. A log message will be printed to the terminal when you are successfully connected. You will want to open the browser page on a remote computer, but in the same local network as the computer running Bitwig. The URL of the page is likely to be something like http://192.168.1.x:8888


> Note: The `npm run setup` script tries to write the correct IP address to `/app/web/assets/js/websocketIP.js`. You can edit this value manually if required, to match the local area network IP of your host computer.

## Packaging as a Standalone

1. Make sure you have already run `npm run setup` (see step 1 above) or edited `/app/web/assets/js/websocketIP.js`
2. Install pkg using <code>npm install -g pkg</code>
3. To package for mac, in the `/app` folder run <code>npm run build</code> (The build script assumes use of node v18.x.x)

## Running as a Standalone

In the <code>/app</code> folder, run <code>./remotewig</code>, or double click on the `remotewig` executable file which has been created in the `app` folder. You can move it to another location on your computer if required.

