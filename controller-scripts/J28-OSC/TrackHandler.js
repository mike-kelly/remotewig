function TrackHandler(trackbank, cursorTrack) {
	this.trackbank = trackbank;
	this.cursorTrack = cursorTrack;
	this.devicesAmount = [];

	for (let i = 0; i < this.trackbank.getSizeOfBank(); i++) {

		const track = this.trackbank.getItemAt(i);
		const vol = track.volume();
		vol.markInterested();
		vol.setIndication(true);

		const name = track.name();
		name.markInterested();

		const color = track.color();
		color.markInterested();

	}

	this.trackbank.followCursorTrack(this.cursorTrack);
	this.cursorTrack.name().addValueObserver(this.updateLocalState);
	this.cursorTrack.color().markInterested();
	this.cursorTrack.position().markInterested();
}

TrackHandler.prototype.updateLocalState = function() {
	// localState[0] = trackHandler.cursorTrack.position().get();
	// println("track POSITION is: " + localState[0]);

	const cursorTrackName = this.cursorTrack.name().get();
	for (let i = 0; i < trackHandler.trackbank.getSizeOfBank(); i++) {

		const track = trackHandler.trackbank.getItemAt(i);
		const trackName = track.name().get();

		if(cursorTrackName == trackName){
			localState[0] = i;
		} 

	}

	host.scheduleTask(function() {
		deviceHandler.updateBrowserRoot();
	}, 50);
};

TrackHandler.prototype.selectTrack = function(trackPosition) {
	// println("track POSITION is: " + trackPosition);
	this.trackbank.getItemAt(trackPosition).select();
};


TrackHandler.prototype.cursorTrackPositionSend = function() {
	// const trackPositionAPI = this.cursorTrack.position().get();
	// println("track name is: " + trackName);

	const cursorTrackName = this.cursorTrack.name().get();
	let trackPosition;
	for (let i = 0; i < this.trackbank.getSizeOfBank(); i++) {

		const track = this.trackbank.getItemAt(i);
		const trackName = track.name().get();
		// println("track name is: " + trackName);
		if(cursorTrackName == trackName){
			trackPosition = i;
		} else {
			trackPosition = -1;
		}
	}

	// println("cursorTrack name is: " + cursorTrackName);
	// println("track position based on api: " + trackPositionAPI);
	println("track position based on calc: " + trackPosition);

	const oscArgs = [];
	oscArgs[0] = trackPosition;

	try {
		sender.sendMessage('/track/position', oscArgs);
	} catch (err) {
		println("error sending level: " + err);
	}
};

TrackHandler.prototype.cursorTrackNameSend = function() {
	const trackName = this.cursorTrack.name().get();
	// println("track name is: " + trackName);

	const oscArgs = [];
	oscArgs[0] = trackName;

	try {
		sender.sendMessage('/track/name', oscArgs);
	} catch (err) {
		println("error sending level: " + err);
	}

	host.showPopupNotification(trackName);

	// stuff like this does not work... because one has to go through the device bank to access the devices inside a track :(
	// const cursorTrackDevice1 = cursorTrack.getDevice (0).name ().get();
	// println("inside track name observer cursor track device 1: " + cursorTrackDevice1);
};

TrackHandler.prototype.tracksColorsSend = function() {
	// const cursorTrackPosition = this.cursorTrack.position().get();
	// println("POSITION: " + cursorTrackPosition);

	const cursorTrackName = this.cursorTrack.name().get();
	// println("NAME: " + cursorTrackName);

	println("before bundle start");
	sender.startBundle();

		const tracksColors = [];
		for (let i = 0; i < this.trackbank.getSizeOfBank(); i++) {

			const track = this.trackbank.getItemAt(i);
			const trackColor = track.color().get();
			const trackName = track.name().get();

			const currentColorRed = trackColor.getRed255();
			const currentColorGreen = trackColor.getGreen255();
			const currentColorBlue = trackColor.getBlue255();

			tracksColors[i] = [];
			tracksColors[i][0] = currentColorRed;
			tracksColors[i][1] = currentColorGreen;
			tracksColors[i][2] = currentColorBlue;
			tracksColors[i][3] = trackName;

			// we can't use position until api bug is fixed
			if (cursorTrackName == trackName){
				tracksColors[i][4] = true;
			} else {
				tracksColors[i][4] = false;
			}

			// println("\ncurrentColor Red is: " + currentColorRed);
			// println("currentColor Green is: " + currentColorGreen);
			// println("currentColor Blue is: " + currentColorBlue);

			try {
				sender.sendMessage('/track/render', tracksColors[i]);
			} catch (err) {
				println("error sending level: " + err);
			}

		}

	sender.endBundle();
	println("after bundle end");
};

TrackHandler.prototype.cursorTrackColorSend = function() {
	const trackColor = this.cursorTrack.color().get();
	// println("track color is: " + trackColor);

	const currentColorRed = trackColor.getRed255();
	const currentColorGreen = trackColor.getGreen255();
	const currentColorBlue = trackColor.getBlue255();

	const oscArgs = [];
	oscArgs[0] = currentColorRed;
	oscArgs[1] = currentColorGreen;
	oscArgs[2] = currentColorBlue;

	try {
		sender.sendMessage('/track/color', oscArgs);
	} catch (err) {
		println("error sending level: " + err);
	}
};