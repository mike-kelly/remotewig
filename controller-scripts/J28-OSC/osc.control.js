loadAPI(12);
load("polyfill.js");
load("TransportHandler.js");
load("PanelHandler.js");
load("TrackHandler.js");
load("DeviceHandler.js");
load("RemoteControlHandler.js");

let localState = [];
let browserState = [];

let application;
// a quirk in the API means that cursorTrack throws errors when retrieving name() unless implicitly declared global
// (see init function below) It may also be a timing issue. Comment out declaration here.
// let cursorTrack;
let mixer;
let osc;
let sender;

let chainSelector;
let cursorDevice;
let deviceHandler;
let panelHandler;
let remoteControlHandler;
let trackBank;
let trackHandler;
let transportHandler;

const MIN_TEMPO = 10;
const MAX_TEMPO = 666;

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("J28", "OSC", "0.1", "090e6d3a-d7f0-4371-b0c4-59363cedf35d");

function cursorDeviceNameObserver() {
	// the scheduling is needed because otherwise the isNested state is not updated prior to requesting it
	deviceHandler.updateLocalState();
}

function cursorDeviceNestedObserver() {
	deviceHandler.cursorDeviceNested();
}

function cursorDeviceEnabledObserver() {
	deviceHandler.deviceToggleUpdate();
}

function cursorDeviceDetailObserver() {
	deviceHandler.deviceDetailUpdate();
}

function cursorDeviceExpandedObserver() {
	deviceHandler.deviceExpandedUpdate();
}

function cursorDeviceRemoteControlsObserver() {
	deviceHandler.deviceRemoteControlsUpdate();
}

function applicationPlayObserver() {
	transportHandler.applicationPlayUpdate();
}

function applicationPositionObserver() {
	transportHandler.applicationPositionUpdate();
}

function remoteControlsPageNamesObserver() {
	remoteControlHandler.sendPagesNames();
}

function init() {

	application = host.createApplication();
	cursorTrack = host.createCursorTrack("OSC_CURSOR_TRACK", "Cursor Track", 0, 0, true);
	trackBank = host.createMainTrackBank (16, 0, 0);
	trackHandler = new TrackHandler(trackBank, cursorTrack);
	mixer = host.createMixer();
	osc = host.getOscModule();
	sender = osc.connectToUdpServer('127.0.0.1', 7400, null);

	cursorDevice = cursorTrack.createCursorDevice("OSC_CURSOR_DEVICE", "Cursor Device", 0, CursorDeviceFollowMode.FOLLOW_SELECTION);
	deviceHandler = new DeviceHandler(cursorTrack, cursorDevice);
	panelHandler = new PanelHandler();
	remoteControlHandler = new RemoteControlHandler(cursorDevice.createCursorRemoteControlsPage(8));
	transportHandler = new TransportHandler(host.createTransport());

	println("initialized" +
		' - ' + host.getHostVendor() +
		' - ' + host.getHostProduct() +
		' - ' + host.getHostVersion()
	);

  println("MK forked version of J28 remotewig v0.2");

	// Configure OSC
	const oscModule = host.getOscModule();
	const as = oscModule.createAddressSpace();

	// handler (OscConnection source, OscMessage message)
	as.registerDefaultMethod(function(connection, msg) {
		println('- unregistered method: con - ' + connection);
		println('- unregistered method: msg typetag - ' + msg.getTypeTag());
		println('- unregistered method: msg adr pat- ' + msg.getAddressPattern());
		println('- unregistered method: msg args - ' + msg.getArguments()[0]);

	});

	as.registerMethod('/track',
		',ffff',
		'Select track',
		function(c, msg) {
			browserState = msg.getArguments();
			// println('- track method: msg args - ' + msg.getArguments ()[0]);
			// println('- track method: msg args - ' + msg.getArguments ()[1]);
			// println('- track method: msg args - ' + msg.getArguments ()[2]);
			// println('- track method: msg args - ' + msg.getArguments ()[3]);
			println('- track method: msg args - ' + localState[0]);
			println('- track method: msg args - ' + localState[1]);
			println('- track method: msg args - ' + localState[2]);
			println('- track method: msg args - ' + localState[3]);
			deviceHandler.browserSelectDevice();
		});

	as.registerMethod('/track/select',
		',f',
		'Select track',
		function(c, msg) {
			const trackPosition = msg.getFloat(0);
			trackHandler.selectTrack(trackPosition);
		});

	as.registerMethod('/device/instrument/select',
		',f',
		'Select track',
		function(c, msg) {
			const chainIndex = msg.getFloat(0);
			deviceHandler.selectChain(chainIndex);
		});

	as.registerMethod('/panel/devices',
		',s',
		'Select device slot',
		function(c, msg) {
			panelHandler.togglePanelDevices();
		});

	as.registerMethod('/panel/notes',
		',s',
		'Toggle Panel Notes',
		function(c, msg) {
			panelHandler.togglePanelNotes();
		});

	as.registerMethod('/panel/meter',
		',s',
		'Toggle Panel Meter',
		function(c, msg) {
			panelHandler.togglePanelMeter();
		});

	as.registerMethod('/panel/io',
		',s',
		'Toggle Panel IO',
		function(c, msg) {
			panelHandler.togglePanelIo();
		});

	as.registerMethod('/panel/inspector',
		',s',
		'Toggle Panel Inspector',
		function(c, msg) {
			panelHandler.togglePanelInspector();
		});

	as.registerMethod('/device/toggle',
		',s',
		'Device Toggle',
		function(c, msg) {
			deviceHandler.deviceToggle();
		});

	as.registerMethod('/device/detail',
		',s',
		'Device Detail',
		function(c, msg) {
			deviceHandler.deviceDetail();
		});

	as.registerMethod('/device/expanded',
		',s',
		'Device Expanded',
		function(c, msg) {
			deviceHandler.deviceExpanded();
		});

	as.registerMethod('/device/remote-controls',
		',s',
		'Device Remote Controls',
		function(c, msg) {
			deviceHandler.deviceRemoteControls();
		});

	as.registerMethod('/application/play',
		',s',
		'Application Play',
		function(c, msg) {
			transportHandler.applicationPlay();
		});

	as.registerMethod('/application/stop',
		',s',
		'Application Stop and Zero Position',
		function(c, msg) {
			transportHandler.applicationStopAndZeroPosition();
		});

	as.registerMethod('/remote-controls/select',
		',f',
		'Remote Controls Select',
		function(c, msg) {
			const pageIndex = msg.getFloat(0);
			remoteControlHandler.selectPage(pageIndex);
		});

	as.registerMethod('/tempo',
		',f',
		'Get Current Tempo',
		function(c, msg) {
			transportHandler.getTempo();
		});

	as.registerMethod('/tempo/set',
		'*',
		'Set Current Tempo',
		function(c, msg) {
			const args = msg.getArguments();
			const newTempo = parseFloat(args[0]);
      const isAbsValue = Boolean(args[1]);
      println('Incoming tempo ' + newTempo);
      println('Incoming tempo is absolute: ' + isAbsValue);
      if (!isAbsValue || (isAbsValue && newTempo >= MIN_TEMPO && newTempo <= MAX_TEMPO)) {
        transportHandler.setTempo(newTempo, isAbsValue);	        	
      }
			
		});

    as.registerMethod('/metronome',
		',s',
		'Get Metronome Status',
		function(c, msg) {
			transportHandler.getMetronome();
		});

    as.registerMethod('/metronome/toggle',
		',s',
		'Metronome Toggle',
		function(c, msg) {
			transportHandler.toggleMetronome();
		});

	oscModule.createUdpServer(7500, as);

}

function exit() {}